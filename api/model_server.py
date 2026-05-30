from __future__ import annotations

import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

import cv2
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

from .tracking_service import TrackingService
from .vitality_service import VitalityService


ROOT_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = Path(os.getenv("CHECKMITE_MODEL_PATH", ROOT_DIR / "model" / "best.pt"))
MODEL_PART_GLOB = "best.pt.part-*"
DEFAULT_CONF = float(os.getenv("CHECKMITE_CONF", "0.5"))
DEFAULT_IMGSZ = int(os.getenv("CHECKMITE_IMGSZ", "640"))
DEFAULT_TILE_SIZE = int(os.getenv("CHECKMITE_TILE_SIZE", "640"))
DEFAULT_TILE_OVERLAP = float(os.getenv("CHECKMITE_TILE_OVERLAP", "0.5"))
DEFAULT_NMS_IOU = float(os.getenv("CHECKMITE_NMS_IOU", "0.3"))
DEFAULT_VITALITY_TARGET_CLASS = os.getenv("CHECKMITE_VITALITY_TARGET_CLASS", "predator")
DEFAULT_VITALITY_PX_PER_MM = float(os.getenv("CHECKMITE_VITALITY_PX_PER_MM", "1500"))
DEFAULT_VITALITY_REFERENCE_SPEED_MM_SEC = float(os.getenv("CHECKMITE_VITALITY_REFERENCE_SPEED_MM_SEC", "0.15"))
DEFAULT_VITALITY_MIN_TRACK_FRAMES = int(os.getenv("CHECKMITE_VITALITY_MIN_TRACK_FRAMES", "3"))
DEFAULT_VITALITY_MOTION_THRESHOLD_PX = float(os.getenv("CHECKMITE_VITALITY_MOTION_THRESHOLD_PX", "2.0"))
DEFAULT_VITALITY_MAX_FRAMES = int(os.getenv("CHECKMITE_VITALITY_MAX_FRAMES", "0"))
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


class VitalityRequest(BaseModel):
    filePath: str
    mimeType: str | None = None
    targetClass: str | None = None
    maxFrames: int | None = None


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


def detection_to_dict(
    *,
    index: int,
    cls_id: int,
    conf: float,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
) -> dict[str, Any]:
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


def box_to_tracking_detection(box: Any) -> dict[str, Any]:
    cls_id = int(box.cls[0])
    conf = float(box.conf[0])
    x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
    return {
        "bbox": [x1, y1, x2, y2],
        "center": [(x1 + x2) / 2.0, (y1 + y2) / 2.0],
        "score": conf,
        "class_name": CLASS_NAMES.get(cls_id, str(cls_id)),
    }


def predict_frame_detections(
    *,
    model: YOLO,
    frame: Any,
    conf: float,
    imgsz: int,
) -> list[dict[str, Any]]:
    result = model.predict(frame, conf=conf, imgsz=imgsz, verbose=False)[0]
    if result.boxes is None:
        return []
    return [box_to_tracking_detection(box) for box in result.boxes]


def analyze_vitality_video(
    *,
    model: YOLO,
    video_path: Path,
    conf: float,
    imgsz: int,
    target_class: str,
    max_frames: int,
) -> dict[str, Any]:
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video")

    fps = capture.get(cv2.CAP_PROP_FPS) or 10.0
    tracker = TrackingService(motion_threshold_px=DEFAULT_VITALITY_MOTION_THRESHOLD_PX)
    vitality = VitalityService(
        min_track_frames=DEFAULT_VITALITY_MIN_TRACK_FRAMES,
        motion_threshold_px=DEFAULT_VITALITY_MOTION_THRESHOLD_PX,
        px_per_mm=DEFAULT_VITALITY_PX_PER_MM,
        reference_speed_mm_sec=DEFAULT_VITALITY_REFERENCE_SPEED_MM_SEC,
        target_class_name=target_class,
    )

    frame_idx = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break

            detections = predict_frame_detections(
                model=model,
                frame=frame,
                conf=conf,
                imgsz=imgsz,
            )
            detections = [
                detection for detection in detections
                if detection["class_name"] == target_class
            ]
            tracker.update(detections, frame_idx)
            frame_idx += 1

            if max_frames and frame_idx >= max_frames:
                break
    finally:
        capture.release()

    summary_rows, aggregate = vitality.summarize(tracker.tracks, frame_idx, fps)
    return {
        "vitalityScore": aggregate["vitality_score"],
        "score": aggregate["vitality_score"],
        "activeRatio": aggregate["moving_ratio"],
        "averageSpeedMmPerSec": aggregate["mean_speed_mm_sec"],
        "activityIndex": aggregate["activity_index"],
        "speedScore": aggregate["speed_score"],
        "observationStability": aggregate["observation_stability"],
        "estimatedLiveRatio": aggregate["estimated_live_ratio"],
        "confirmedTracks": aggregate["confirmed_tracks"],
        "movingTracks": aggregate["moving_tracks"],
        "targetClass": aggregate["target_class_name"],
        "frameCount": aggregate["frame_count"],
        "fps": aggregate["fps"],
        "observedSeconds": aggregate["observed_seconds"],
        "trend": [aggregate["vitality_score"]],
        "tracks": summary_rows,
        "summary": aggregate,
    }


def axis_starts(length: int, tile_size: int, overlap: float) -> list[int]:
    if length <= tile_size:
        return [0]

    stride = max(1, int(tile_size * (1 - overlap)))
    starts = list(range(0, length - tile_size + 1, stride))
    last = length - tile_size
    if starts[-1] != last:
        starts.append(last)
    return starts


def box_iou(a: dict[str, Any], b: dict[str, Any]) -> float:
    ab = a["box"]
    bb = b["box"]
    x1 = max(ab["x1"], bb["x1"])
    y1 = max(ab["y1"], bb["y1"])
    x2 = min(ab["x2"], bb["x2"])
    y2 = min(ab["y2"], bb["y2"])
    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter = inter_w * inter_h
    if inter <= 0:
        return 0.0

    area_a = max(0.0, ab["width"]) * max(0.0, ab["height"])
    area_b = max(0.0, bb["width"]) * max(0.0, bb["height"])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def class_aware_nms(detections: list[dict[str, Any]], iou_threshold: float) -> list[dict[str, Any]]:
    kept: list[dict[str, Any]] = []
    for det in sorted(detections, key=lambda item: item["confidence"], reverse=True):
        duplicate = any(
            det["class_id"] == kept_det["class_id"] and box_iou(det, kept_det) > iou_threshold
            for kept_det in kept
        )
        if not duplicate:
            kept.append(det)

    for index, det in enumerate(kept, start=1):
        det["id"] = index
    return kept


def predict_tiled(
    *,
    model: YOLO,
    image_path: Path,
    conf: float,
    imgsz: int,
    tile_size: int,
    overlap: float,
    nms_iou: float,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    image = cv2.imread(str(image_path))
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    height, width = image.shape[:2]
    xs = axis_starts(width, tile_size, overlap)
    ys = axis_starts(height, tile_size, overlap)
    detections: list[dict[str, Any]] = []

    for y in ys:
        for x in xs:
            tile = image[y : min(y + tile_size, height), x : min(x + tile_size, width)]
            result = model.predict(tile, conf=conf, imgsz=imgsz, iou=nms_iou, verbose=False)[0]
            for box in result.boxes:
                cls_id = int(box.cls[0])
                box_conf = float(box.conf[0])
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
                detections.append(
                    detection_to_dict(
                        index=len(detections) + 1,
                        cls_id=cls_id,
                        conf=box_conf,
                        x1=max(0.0, min(width, x1 + x)),
                        y1=max(0.0, min(height, y1 + y)),
                        x2=max(0.0, min(width, x2 + x)),
                        y2=max(0.0, min(height, y2 + y)),
                    )
                )

    return class_aware_nms(detections, nms_iou), {"width": width, "height": height, "tiles": len(xs) * len(ys)}


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
        "inference": {
            "mode": "sahi-style-tiled",
            "tile_size": DEFAULT_TILE_SIZE,
            "tile_overlap_ratio": DEFAULT_TILE_OVERLAP,
            "confidence": DEFAULT_CONF,
            "nms_iou_threshold": DEFAULT_NMS_IOU,
        },
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
    tile_size: int = DEFAULT_TILE_SIZE,
    overlap: float = DEFAULT_TILE_OVERLAP,
    nms: float = DEFAULT_NMS_IOU,
) -> dict[str, Any]:
    allowed_content_types = {"application/octet-stream", "binary/octet-stream"}
    if (
        file.content_type
        and not file.content_type.startswith("image/")
        and file.content_type not in allowed_content_types
    ):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    suffix = Path(file.filename or "upload.jpg").suffix or ".jpg"
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = Path(tmp.name)

    try:
        if tile_size <= 0:
            raise HTTPException(status_code=400, detail="tile_size must be greater than 0")
        if not 0 <= overlap < 1:
            raise HTTPException(status_code=400, detail="overlap must be between 0 and 1")
        if not 0 <= nms <= 1:
            raise HTTPException(status_code=400, detail="nms must be between 0 and 1")

        model = get_model()
        detections, image_info = predict_tiled(
            model=model,
            image_path=tmp_path,
            conf=conf,
            imgsz=imgsz,
            tile_size=tile_size,
            overlap=overlap,
            nms_iou=nms,
        )
        counts = {name: 0 for name in CLASS_NAMES.values()}
        for det in detections:
            counts[det["class_name"]] = counts.get(det["class_name"], 0) + 1

        return {
            "filename": file.filename,
            "image": {"width": image_info["width"], "height": image_info["height"]},
            "settings": {
                "confidence": conf,
                "image_size": imgsz,
                "mode": "sahi-style-tiled",
                "tile_size": tile_size,
                "overlap": overlap,
                "nms_threshold": nms,
                "tiles_processed": image_info["tiles"],
            },
            "counts": counts,
            "total": len(detections),
            "detections": detections,
        }
    finally:
        tmp_path.unlink(missing_ok=True)


@app.post("/infer/vitality")
async def infer_vitality(payload: VitalityRequest) -> dict[str, Any]:
    video_path = Path(payload.filePath)
    if not video_path.exists():
        raise HTTPException(status_code=400, detail=f"Video file not found: {video_path}")

    model = get_model()
    return analyze_vitality_video(
        model=model,
        video_path=video_path,
        conf=DEFAULT_CONF,
        imgsz=DEFAULT_IMGSZ,
        target_class=payload.targetClass or DEFAULT_VITALITY_TARGET_CLASS,
        max_frames=payload.maxFrames or DEFAULT_VITALITY_MAX_FRAMES,
    )
