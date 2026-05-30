# CheckMite Single Server Architecture

이 문서는 현재 프론트엔드 구조에 맞춰 CheckMite 백엔드를 설계하기 위한 문서입니다. 배포는 프론트엔드, Express 백엔드, 모델 런타임, PostgreSQL을 하나의 서버 안에 두는 구조를 기준으로 합니다.

## 기술 스택

- Frontend: React + Vite + TypeScript TSX
- Backend: Express + Node.js
- Database: PostgreSQL
- Model runtime: 같은 서버 내부의 로컬 모델 추론 프로세스

## 핵심 요구사항

- 사육박스는 사용자가 추가, 삭제, 복구할 수 있어야 합니다.
- 사육박스에는 초기 개체수 정보를 두지 않습니다.
- 사육박스 삭제는 즉시 물리 삭제하지 않고 휴지통 상태로 이동합니다.
- 휴지통에서 복구하면 사육박스와 측정 이력을 다시 사용할 수 있어야 합니다.
- 밀도 측정은 count를 기반으로 밀도값을 계산합니다.
- 증식률 분석 화면은 count 자체를 주요 결과로 보여주지 않습니다.
- 증식률 분석 화면은 현재 밀도량, 밀도 변화율, 활력도 추이, 증식률 분석 결과를 보여주는 것이 목적입니다.

## 현재 프론트엔드 반영 범위

현재 프론트엔드는 `객체 탐지`, `밀도 측정`, `활력도 측정`, `증식률 분석`, `휴지통` 탭을 기준으로 동작합니다. 백엔드는 이 탭 구조를 그대로 API 경계로 삼되, 탭 이름에 맞춘 단순 테이블 하나로 모든 데이터를 몰아넣지 않고 사육박스, 업로드 파일, 분석 작업, 측정 원본, 밀도 결과, 활력도 결과, 증식률 스냅샷, 휴지통 이벤트를 분리해서 저장합니다.

사육박스 선택은 모든 측정 요청의 필수 컨텍스트입니다. 밀도 모델이나 활력도 모델을 실행할 때 프론트엔드는 `cultureBoxId`를 함께 보내야 하며, 백엔드는 결과를 해당 사육박스에 귀속해서 저장해야 합니다. 서로 다른 사육박스에서 가져온 데이터가 같은 날짜에 측정되더라도 분석과 증식률 계산은 사육박스 단위로 독립되어야 합니다.

`count`는 화면의 최종 목표값이 아니라 밀도 산출을 위한 중간값입니다. 백엔드는 모델에서 얻은 count와 측정 면적을 이용해 `densityPerCm2`를 계산하고, 증식률 API에서는 count 변화 대신 밀도 변화율, 일 밀도 증가량, 로그 기반 밀도 증식률, 활력도 추이를 반환합니다.

## 단일 서버 구성

```text
Single Linux Server
  |
  +-- nginx
  |     +-- React/Vite 정적 파일 서빙
  |     +-- /api 요청을 Express로 프록시
  |
  +-- Express Node.js Backend
  |     +-- REST API
  |     +-- 파일 업로드 처리
  |     +-- PostgreSQL 저장/조회
  |     +-- 모델 런타임 호출
  |
  +-- Model Runtime
  |     +-- detection model
  |     +-- density model
  |     +-- vitality model
  |
  +-- PostgreSQL
        +-- 사육박스
        +-- 업로드 파일
        +-- 분석 작업
        +-- 측정 결과
        +-- 휴지통 이력
```

외부 브라우저는 nginx만 바라봅니다. Express, 모델 런타임, PostgreSQL은 외부에 직접 노출하지 않습니다.

## 백엔드 디렉터리 구조

백엔드는 하나의 파일에 모든 기능을 몰아넣지 않습니다. 기능별 파일로 나누어 수정과 확장이 쉽게 구성합니다.

```text
backend/
  src/
    app.ts
    server.ts

    config/
      env.ts
      database.ts
      storage.ts
      model-runtime.ts

    routes/
      culture-box.routes.ts
      analysis.routes.ts
      measurement.routes.ts
      growth.routes.ts
      trash.routes.ts

    controllers/
      culture-box.controller.ts
      analysis.controller.ts
      measurement.controller.ts
      growth.controller.ts
      trash.controller.ts

    services/
      culture-box.service.ts
      file-storage.service.ts
      analysis-job.service.ts
      measurement.service.ts
      growth.service.ts
      trash.service.ts
      model-runtime.service.ts

    repositories/
      culture-box.repository.ts
      uploaded-file.repository.ts
      analysis-job.repository.ts
      measurement.repository.ts
      growth.repository.ts
      trash.repository.ts

    schemas/
      culture-box.schema.ts
      analysis.schema.ts
      growth.schema.ts

    middleware/
      upload.middleware.ts
      validate.middleware.ts
      error.middleware.ts

    types/
      culture-box.ts
      analysis.ts
      measurement.ts
      growth.ts
```

## 계층별 역할

- `routes`: URL과 controller 연결만 담당합니다.
- `controllers`: 요청/응답 처리와 service 호출만 담당합니다.
- `services`: 사육박스 관리, 분석 저장, 증식률 계산 같은 비즈니스 로직을 담당합니다.
- `repositories`: PostgreSQL 쿼리만 담당합니다.
- `schemas`: 요청 body, params, query 검증을 담당합니다.
- `model-runtime.service`: Express와 모델 런타임 사이의 호출을 담당합니다.

## PostgreSQL 설계 원칙

하나의 테이블에 모든 정보를 몰아넣지 않습니다. 사육박스, 업로드 파일, 분석 작업, 측정 결과, 상세 결과, 휴지통 이력을 분리합니다.

분리 이유:

- 사육박스 정보와 측정 결과는 변경 주기가 다릅니다.
- 밀도 결과와 활력도 결과는 조회/계산 방식이 다릅니다.
- 상세 모델 결과는 크기가 커질 수 있으므로 별도 테이블이나 JSONB로 분리해야 합니다.
- 삭제/복구 이력은 활성 데이터와 별도로 추적해야 합니다.
- 추후 모델 결과 스키마가 바뀌어도 전체 테이블을 흔들지 않게 해야 합니다.

## 권장 DB 구조

### culture_boxes

사육박스 기본 정보입니다. 초기 개체수는 저장하지 않습니다.

```sql
CREATE TABLE culture_boxes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  started_at DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

`deleted_at IS NULL`이면 활성 사육박스입니다. 값이 있으면 휴지통 상태입니다.

### uploaded_files

업로드된 이미지/영상 파일 메타데이터입니다.

```sql
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY,
  culture_box_id UUID REFERENCES culture_boxes(id),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### analysis_jobs

분석 요청 단위입니다.

```sql
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY,
  culture_box_id UUID NOT NULL REFERENCES culture_boxes(id),
  uploaded_file_id UUID REFERENCES uploaded_files(id),
  type TEXT NOT NULL CHECK (type IN ('detection', 'density', 'vitality')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### measurements

분석 결과의 공통 측정 레코드입니다.

```sql
CREATE TABLE measurements (
  id UUID PRIMARY KEY,
  culture_box_id UUID NOT NULL REFERENCES culture_boxes(id),
  analysis_job_id UUID REFERENCES analysis_jobs(id),
  type TEXT NOT NULL CHECK (type IN ('detection', 'density', 'vitality')),
  measured_at TIMESTAMPTZ NOT NULL,
  count_value INTEGER,
  density_per_cm2 NUMERIC(10, 3),
  vitality_score NUMERIC(6, 2),
  active_ratio NUMERIC(6, 4),
  result_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`count_value`는 밀도 계산의 원천값으로 저장할 수 있지만, 프론트의 증식률 결과 화면에서는 주요 지표로 노출하지 않습니다.

### density_results

밀도 분석에 필요한 세부 계산값입니다.

```sql
CREATE TABLE density_results (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  measured_area_cm2 NUMERIC(10, 3) NOT NULL,
  peak_count INTEGER,
  average_count NUMERIC(10, 3),
  density_per_cm2 NUMERIC(10, 3) NOT NULL,
  density_grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

밀도 계산식:

```text
density_per_cm2 = count_value / measured_area_cm2
```

프론트의 "현재 밀도량"은 최신 밀도 측정의 `density_per_cm2`를 사용합니다.

### density_frame_counts

영상 분석에서 프레임별 count를 저장합니다.

```sql
CREATE TABLE density_frame_counts (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  frame_index INTEGER NOT NULL,
  count_value INTEGER NOT NULL
);
```

### vitality_results

활력도 분석 요약값입니다.

```sql
CREATE TABLE vitality_results (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  vitality_score NUMERIC(6, 2) NOT NULL,
  active_ratio NUMERIC(6, 4),
  average_speed_mm_per_sec NUMERIC(10, 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### vitality_series

활력도 시간별 추이입니다.

```sql
CREATE TABLE vitality_series (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  frame_index INTEGER NOT NULL,
  score NUMERIC(6, 2) NOT NULL
);
```

### detection_boxes

객체 탐지 박스 상세 결과입니다.

```sql
CREATE TABLE detection_boxes (
  id UUID PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  confidence NUMERIC(6, 5) NOT NULL,
  x NUMERIC(8, 5) NOT NULL,
  y NUMERIC(8, 5) NOT NULL,
  width NUMERIC(8, 5) NOT NULL,
  height NUMERIC(8, 5) NOT NULL
);
```

### growth_snapshots

증식률 계산 결과를 저장하고 싶을 때 사용합니다. 매번 실시간 계산만 한다면 필수는 아닙니다.

```sql
CREATE TABLE growth_snapshots (
  id UUID PRIMARY KEY,
  culture_box_id UUID NOT NULL REFERENCES culture_boxes(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  first_density_per_cm2 NUMERIC(10, 3),
  current_density_per_cm2 NUMERIC(10, 3),
  density_change_per_cm2 NUMERIC(10, 3),
  density_change_rate_percent NUMERIC(10, 3),
  density_growth_per_day NUMERIC(10, 4),
  log_density_growth_per_day NUMERIC(10, 6),
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

증식률 분석 계산식:

```text
density = count_value / measured_area_cm2
density_change = current_density - first_density
density_change_rate_percent = density_change / first_density * 100
density_growth_per_day = density_change / days
log_density_growth_per_day = (ln(current_density) - ln(first_density)) / days
```

### trash_events

삭제/복구 이력을 저장합니다.

```sql
CREATE TABLE trash_events (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('deleted', 'restored')),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

휴지통 구현은 `culture_boxes.deleted_at` soft delete를 기본으로 하고, `trash_events`에는 삭제/복구 이벤트를 남기는 방식을 권장합니다.

## 인덱스 권장

```sql
CREATE INDEX idx_culture_boxes_deleted_at ON culture_boxes(deleted_at);
CREATE INDEX idx_measurements_box_measured_at ON measurements(culture_box_id, measured_at);
CREATE INDEX idx_measurements_type ON measurements(type);
CREATE INDEX idx_density_results_measurement ON density_results(measurement_id);
CREATE INDEX idx_vitality_results_measurement ON vitality_results(measurement_id);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status);
```

## API 설계

### 사육박스

```http
GET    /api/culture-boxes
POST   /api/culture-boxes
PATCH  /api/culture-boxes/:id
DELETE /api/culture-boxes/:id
```

생성 요청 예시:

```json
{
  "name": "A동 1번 사육박스",
  "startedAt": "2026-05-01",
  "memo": "고습도 조건"
}
```

초기 개체수 필드는 받지 않습니다.

`DELETE`는 물리 삭제가 아니라 `deleted_at`을 기록하는 soft delete입니다.

### 휴지통

```http
GET  /api/trash/culture-boxes
POST /api/trash/culture-boxes/:id/restore
```

### 밀도 분석

```http
POST /api/analysis/density
Content-Type: multipart/form-data
```

요청 필드:

```text
boxId
measuredAt
file
measuredAreaCm2
```

응답 예시:

```json
{
  "measurementId": "uuid",
  "boxId": "box_A01",
  "type": "density",
  "measuredAt": "2026-05-30T09:00:00.000Z",
  "density": {
    "currentDensityPerCm2": 2.8,
    "measuredAreaCm2": 12.0,
    "peakCount": 33,
    "averageCount": 17
  }
}
```

### 활력도 분석

```http
POST /api/analysis/vitality
Content-Type: multipart/form-data
```

응답 예시:

```json
{
  "measurementId": "uuid",
  "boxId": "box_A01",
  "type": "vitality",
  "measuredAt": "2026-05-30T09:20:00.000Z",
  "vitality": {
    "score": 78,
    "activeRatio": 0.86,
    "trend": [62, 58, 65, 71]
  }
}
```

### 측정 이력

```http
GET /api/culture-boxes/:boxId/measurements
```

프론트는 이 응답에서 밀도 추이와 활력도 추이를 그립니다.

### 증식률 분석

```http
GET /api/culture-boxes/:boxId/growth?from=2026-05-01&to=2026-05-30
```

응답 예시:

```json
{
  "boxId": "box_A01",
  "from": "2026-05-01",
  "to": "2026-05-30",
  "days": 29,
  "currentDensityPerCm2": 4.1,
  "firstDensityPerCm2": 0.9,
  "densityChangePerCm2": 3.2,
  "densityChangeRatePercent": 355.6,
  "densityGrowthPerDay": 0.11,
  "logDensityGrowthPerDay": 0.0523,
  "growthLabel": "증식 활발",
  "densityTrend": [
    { "date": "2026-05-01", "densityPerCm2": 0.9 },
    { "date": "2026-05-30", "densityPerCm2": 4.1 }
  ],
  "vitalityTrend": [
    { "date": "2026-05-01", "score": 72 },
    { "date": "2026-05-30", "score": 81 }
  ]
}
```

이 API는 count를 응답의 중심값으로 두지 않습니다. count는 밀도 계산 과정에서만 사용하고, 프론트에는 밀도 기반 결과를 중심으로 반환합니다.

## 모델 런타임 구성

같은 서버 안에 두더라도 Express와 모델 런타임은 별도 프로세스로 분리하는 것을 권장합니다.

```text
nginx             80 / 443
Express backend   3000
Model runtime     8000
PostgreSQL        5432
```

Express는 모델 런타임을 다음처럼 호출합니다.

```text
POST http://127.0.0.1:8000/infer/density
POST http://127.0.0.1:8000/infer/vitality
POST http://127.0.0.1:8000/infer/detection
```

외부에 공개하는 포트는 nginx 80/443만 두고, Express와 모델 런타임, PostgreSQL은 내부 접근만 허용합니다.

## 환경 변수 예시

```env
NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://checkmite:password@127.0.0.1:5432/checkmite

UPLOAD_DIR=/srv/checkmite/uploads
UPLOAD_MAX_IMAGE_MB=20
UPLOAD_MAX_VIDEO_MB=500

MODEL_RUNTIME_URL=http://127.0.0.1:8000
FRONTEND_DIST_DIR=/srv/checkmite/frontend/dist
```

## 프론트엔드 연동 기준

현재 프론트의 localStorage 기반 임시 상태는 백엔드 연결 후 아래 API로 교체합니다.

```text
cm-culture-boxes -> GET/POST/PATCH/DELETE /api/culture-boxes
cm-trash-db      -> GET /api/trash/culture-boxes, POST /restore
measurements     -> GET /api/culture-boxes/:boxId/measurements
growth result    -> GET /api/culture-boxes/:boxId/growth
```

증식률 탭에서 필요한 응답 필드는 다음입니다.

```text
currentDensityPerCm2
densityChangeRatePercent
densityGrowthPerDay
logDensityGrowthPerDay
densityTrend
vitalityTrend
growthLabel
```

## 배포 구성

권장 프로세스:

```text
systemd
  +-- checkmite-backend.service
  +-- checkmite-model-runtime.service
  +-- postgresql.service
  +-- nginx.service
```

또는 Docker Compose:

```text
services:
  nginx
  backend
  model-runtime
  postgres
```

## 운영 체크리스트

- PostgreSQL 정기 백업을 설정합니다.
- 업로드 파일 디렉터리는 용량 제한과 보존 기간을 둡니다.
- 사육박스 삭제는 soft delete로 처리합니다.
- 휴지통 데이터는 일정 기간 후 완전 삭제하는 정책을 별도로 둡니다.
- 모델 추론 요청에는 timeout을 둡니다.
- 영상 분석이 오래 걸리면 `analysis_jobs.status`를 사용해 진행 상태를 추적합니다.
- Express, 모델 런타임, PostgreSQL은 외부에 직접 노출하지 않습니다.
