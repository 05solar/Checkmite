# Checkmite Model API

This API loads `model/best.pt` and exposes image inference for the Checkmite web app.

The repository stores the model as `model/best.pt.part-*` chunks so GitHub can accept
the files without Git LFS. On first API startup, `api.model_server` automatically
reassembles those chunks into `model/best.pt` if the full weight file is missing.

## Setup

Ubuntu system packages used by OpenCV/Ultralytics:

```bash
sudo apt-get install -y python3-pip python3-venv libgl1
```

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r api/requirements.txt
```

## Run

```bash
.venv/bin/uvicorn api.model_server:app --host 0.0.0.0 --port 8000
```

The model path can be overridden:

```bash
CHECKMITE_MODEL_PATH=/path/to/best.pt .venv/bin/uvicorn api.model_server:app --host 0.0.0.0 --port 8000
```

Image detection uses SAHI-style tiled inference by default:

- tile size: `640`
- tile overlap: `0.5`
- confidence threshold: `0.5`
- global class-aware NMS IoU threshold: `0.3`

## Endpoints

- `GET /health`
- `GET /model/info`
- `POST /predict/image`

Example:

```bash
curl -F "file=@sample.jpg" "http://localhost:8000/predict/image?conf=0.5&imgsz=640&tile_size=640&overlap=0.5&nms=0.3"
```
