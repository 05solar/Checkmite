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
uvicorn api.model_server:app --host 0.0.0.0 --port 8000
```

The model path can be overridden:

```bash
CHECKMITE_MODEL_PATH=/path/to/best.pt uvicorn api.model_server:app --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health`
- `GET /model/info`
- `POST /predict/image`

Example:

```bash
curl -F "file=@sample.jpg" "http://localhost:8000/predict/image?conf=0.25&imgsz=640"
```
