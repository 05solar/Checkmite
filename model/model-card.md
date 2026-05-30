# Checkmite MVP1v11 Model Card

## Files

- `best.pt`: trained Ultralytics YOLOv8 detection weights, regenerated locally from parts when needed.
- `best.pt.part-aa`, `best.pt.part-ab`: split model weight chunks kept below GitHub's per-file size limit.
- `mvp1v11 (2).ipynb`: original training notebook.

## Training Summary

- Base model: `yolov8m.pt`
- Task: two-class object detection
- Classes:
  - `0`: `predator`
  - `1`: `prey`
- Image size: `640`
- Tile size: `640`
- Tile overlap ratio: `0.25`
- Minimum bbox area ratio retained during tiling: `0.3`
- Minimum bbox size retained during tiling: `4px`
- Negative tile ratio: `0.05`
- Train ratio: `0.9`
- Epochs: `300`
- Batch size: `16`
- Patience: `50`
- Augmentation: `degrees=45`, `flipud=0.5`, `fliplr=0.5`, `mosaic=1.0`, `close_mosaic=10`

## Runtime

Use the API wrapper in `api/model_server.py`.
If `model/best.pt` is missing, the API automatically rebuilds it from `model/best.pt.part-*`.

```bash
sudo apt-get install -y python3-pip python3-venv libgl1
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r api/requirements.txt
uvicorn api.model_server:app --host 0.0.0.0 --port 8000
```

Example:

```bash
curl -F "file=@sample.jpg" "http://localhost:8000/predict/image?conf=0.25&imgsz=640"
```

The response includes `counts`, `total`, and pixel-coordinate bounding boxes.
