from __future__ import annotations

import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO


ROOT_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = Path(os.getenv("CHECKMITE_MODEL_PATH", ROOT_DIR / "model" / "best.pt"))
MODEL_PART_GLOB = "best.pt.part-*"
DEFAULT_CONF = float(os.getenv("CHECKMITE_CONF", "0.25"))
DEFAULT_IMGSZ = int(os.getenv("CHECKMITE_IMGSZ", "640"))
CLASS_NAMES = {
    0: "predator",
    1: "prey",
}

app = FastAPI(title="Checkmite Model API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CHECKMITE_CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: YOLO | None = None


def restore_model_from_parts() -> None:
    if MODEL_PATH.exists():
        return

    part_dir = MODEL_PATH.parent
    parts = sorted(part_dir.glob(MODEL_PART_GLOB))
    if not parts:
        return

    tmp_path = MODEL_PATH.with_suffix(".pt.tmp")
    with tmp_path.open("wb") as out:
        for part in parts:
            with part.open("rb") as src:
                out.write(src.read())
    tmp_path.replace(MODEL_PATH)


def get_model() -> YOLO:
    global _model
    if _model is None:
        restore_model_from_parts()
        if not MODEL_PATH.exists():
            raise HTTPException(status_code=500, detail=f"Model file not found: {MODEL_PATH}")
        _model = YOLO(str(MODEL_PATH))
    return _model


def box_to_dict(box: Any, index: int) -> dict[str, Any]:
    cls_id = int(box.cls[0])
    conf = float(box.conf[0])
    x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
    return {
        "id": index,
        "class_id": cls_id,
        "class_name": CLASS_NAMES.get(cls_id, str(cls_id)),
        "confidence": conf,
        "box": {
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,
            "width": x2 - x1,
            "height": y2 - y1,
        },
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "model_path": str(MODEL_PATH),
        "model_exists": MODEL_PATH.exists(),
    }


@app.get("/model/info")
def model_info() -> dict[str, Any]:
    return {
        "name": "checkmite-mvp1v11-yolov8m",
        "task": "object-detection",
        "framework": "ultralytics-yolov8",
        "weights": str(MODEL_PATH.relative_to(ROOT_DIR)),
        "weight_parts": [str(p.relative_to(ROOT_DIR)) for p in sorted(MODEL_PATH.parent.glob(MODEL_PART_GLOB))],
        "input_size": DEFAULT_IMGSZ,
        "classes": CLASS_NAMES,
        "training_summary": {
            "base_model": "yolov8m.pt",
            "image_size": 640,
            "tile_size": 640,
            "tile_overlap_ratio": 0.25,
            "epochs": 300,
            "batch": 16,
            "augmentation": ["degrees=45", "flipud=0.5", "fliplr=0.5", "mosaic=1.0"],
        },
    }


@app.post("/predict/image")
async def predict_image(
    file: UploadFile = File(...),
    conf: float = DEFAULT_CONF,
    imgsz: int = DEFAULT_IMGSZ,
) -> dict[str, Any]:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    suffix = Path(file.filename or "upload.jpg").suffix or ".jpg"
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = Path(tmp.name)

    try:
        model = get_model()
        result = model.predict(str(tmp_path), conf=conf, imgsz=imgsz, verbose=False)[0]
        detections = [box_to_dict(box, i + 1) for i, box in enumerate(result.boxes)]
        counts = {name: 0 for name in CLASS_NAMES.values()}
        for det in detections:
            counts[det["class_name"]] = counts.get(det["class_name"], 0) + 1

        height, width = result.orig_shape
        return {
            "filename": file.filename,
            "image": {"width": width, "height": height},
            "settings": {"confidence": conf, "image_size": imgsz},
            "counts": counts,
            "total": len(detections),
            "detections": detections,
        }
    finally:
        tmp_path.unlink(missing_ok=True)
