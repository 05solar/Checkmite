# CheckMite Backend API Specification

이 문서는 현재 구현된 `backend/src` 기준의 백엔드 명세서입니다. 백엔드는 Express + Node.js로 동작하며, 데이터 저장소는 PostgreSQL을 사용합니다.

## 실행 환경

- Runtime: Node.js ESM
- Framework: Express
- Database: PostgreSQL
- Upload: multer local disk storage
- Model runtime: HTTP 호출 방식
- Default API base URL: `http://localhost:3000/api`

## 실행 명령

```bash
cp .env.example .env
npm install
npm run backend:migrate
npm run backend:dev
```

## 환경 변수

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://checkmite:password@127.0.0.1:5432/checkmite
UPLOAD_DIR=uploads
UPLOAD_MAX_IMAGE_MB=20
UPLOAD_MAX_VIDEO_MB=500
MODEL_RUNTIME_URL=http://127.0.0.1:8000
MODEL_RUNTIME_REQUIRED=false
FRONTEND_DIST_DIR=dist
```

`MODEL_RUNTIME_REQUIRED=false`이면 모델 서버 호출 실패 시 개발용 fallback 결과를 반환합니다. 운영 환경에서는 `true`로 설정하는 것을 권장합니다.

## 디렉터리 구조

```text
backend/
  db/
    schema.sql
  src/
    app.js
    server.js
    config/
    controllers/
    db/
    middleware/
    repositories/
    routes/
    schemas/
    services/
    utils/
```

- `routes`: URL과 controller 연결
- `controllers`: 요청/응답 처리
- `services`: 비즈니스 로직
- `repositories`: PostgreSQL 쿼리
- `schemas`: 요청 body 검증 및 정규화
- `middleware`: 업로드, 에러 처리
- `config`: 환경 변수와 DB pool

## 공통 응답

성공 응답은 JSON입니다.

에러 응답:

```json
{
  "message": "에러 메시지",
  "details": {}
}
```

주요 상태 코드:

- `200`: 조회, 수정, 삭제 처리 성공
- `201`: 생성 성공
- `400`: 요청 값 오류
- `404`: 대상 없음
- `500`: 서버 오류

## Health

### GET `/api/health`

DB 연결까지 확인합니다.

응답:

```json
{
  "ok": true,
  "service": "checkmite-backend"
}
```

## 사육박스 API

사육박스에는 초기 개체수 필드를 두지 않습니다. 삭제는 실제 삭제가 아니라 `deleted_at`을 기록하는 soft delete입니다.

### GET `/api/culture-boxes`

활성 사육박스 목록을 반환합니다.

응답:

```json
[
  {
    "id": "uuid",
    "name": "A동 1번 사육박스",
    "startedAt": "2026-05-01",
    "memo": "고습도 조건",
    "createdAt": "2026-05-30T06:00:00.000Z",
    "updatedAt": "2026-05-30T06:00:00.000Z"
  }
]
```

### POST `/api/culture-boxes`

사육박스를 생성합니다.

요청:

```json
{
  "name": "A동 1번 사육박스",
  "startedAt": "2026-05-01",
  "memo": "고습도 조건"
}
```

필수 값:

- `name`
- `startedAt`: `YYYY-MM-DD`

응답: 생성된 사육박스 객체

### PATCH `/api/culture-boxes/:id`

사육박스 정보를 수정합니다.

요청:

```json
{
  "name": "A동 1번 사육박스",
  "startedAt": "2026-05-01",
  "memo": "메모 수정"
}
```

응답: 수정된 사육박스 객체

### DELETE `/api/culture-boxes/:id`

사육박스를 휴지통으로 이동합니다.

처리 방식:

- `culture_boxes.deleted_at` 기록
- `trash_events`에 `deleted` 이벤트 기록
- 측정 데이터는 삭제하지 않음

응답:

```json
{
  "box": {
    "id": "uuid",
    "name": "A동 1번 사육박스",
    "startedAt": "2026-05-01",
    "deletedAt": "2026-05-30T06:20:00.000Z"
  },
  "measurements": []
}
```

## 휴지통 API

### GET `/api/trash/culture-boxes`

삭제된 사육박스 목록을 반환합니다.

응답:

```json
[
  {
    "box": {
      "id": "uuid",
      "name": "A동 1번 사육박스",
      "startedAt": "2026-05-01",
      "deletedAt": "2026-05-30T06:20:00.000Z"
    },
    "measurements": [],
    "deletedAt": "2026-05-30T06:20:00.000Z"
  }
]
```

### POST `/api/trash/culture-boxes/:id/restore`

휴지통의 사육박스를 복구합니다.

처리 방식:

- `culture_boxes.deleted_at`을 `NULL`로 변경
- `trash_events`에 `restored` 이벤트 기록
- 기존 측정 데이터는 그대로 유지

응답:

```json
{
  "box": {
    "id": "uuid",
    "name": "A동 1번 사육박스",
    "startedAt": "2026-05-01"
  },
  "measurements": []
}
```

## 측정 API

### GET `/api/culture-boxes/:boxId/measurements`

특정 사육박스의 측정 이력을 반환합니다.

응답:

```json
[
  {
    "id": "uuid",
    "boxId": "uuid",
    "type": "density",
    "measuredAt": "2026-05-30T06:30:00.000Z",
    "countValue": 34,
    "densityPerCm2": 2.833,
    "resultJson": {}
  }
]
```

### POST `/api/measurements`

모델 분석 없이 측정 데이터를 직접 저장합니다. 개발, 테스트, 수동 입력용 API입니다.

요청:

```json
{
  "boxId": "uuid",
  "type": "density",
  "measuredAt": "2026-05-30T06:30:00.000Z",
  "countValue": 34,
  "densityPerCm2": 2.833,
  "vitalityScore": null,
  "activeRatio": null,
  "resultJson": {}
}
```

`type` 값:

- `detection`
- `density`
- `vitality`

응답: 생성된 측정 객체

## 분석 API

분석 API는 `multipart/form-data`를 사용합니다. 모든 분석 요청에는 사육박스 구분을 위해 `boxId`가 필요합니다.

공통 form fields:

- `boxId`: 사육박스 ID
- `measuredAt`: 측정 시각, 생략 시 서버 현재 시각
- `file`: 이미지 또는 영상 파일

### POST `/api/analysis/detection`

객체 탐지 분석을 실행하고 측정 결과를 저장합니다.

요청:

```text
Content-Type: multipart/form-data

boxId=uuid
measuredAt=2026-05-30T06:30:00.000Z
file=@image.png
```

모델 서버 호출:

```text
POST {MODEL_RUNTIME_URL}/infer/detection
```

응답:

```json
{
  "measurementId": "uuid",
  "boxId": "uuid",
  "type": "detection",
  "measuredAt": "2026-05-30T06:30:00.000Z",
  "detection": {
    "countValue": 12,
    "boxes": [
      {
        "className": "predator",
        "confidence": 0.92,
        "x": 0.12,
        "y": 0.18,
        "width": 0.08,
        "height": 0.08
      }
    ]
  },
  "measurement": {}
}
```

### POST `/api/analysis/density`

밀도 분석을 실행하고 측정 결과를 저장합니다. `count`는 최종 결과가 아니라 밀도 계산을 위한 중간값입니다.

추가 form fields:

- `measuredAreaCm2`: 측정 면적, 0보다 큰 숫자

요청:

```text
Content-Type: multipart/form-data

boxId=uuid
measuredAt=2026-05-30T06:30:00.000Z
measuredAreaCm2=12
file=@video.mp4
```

계산식:

```text
densityPerCm2 = countValue / measuredAreaCm2
```

모델 서버 호출:

```text
POST {MODEL_RUNTIME_URL}/infer/density
```

응답:

```json
{
  "measurementId": "uuid",
  "boxId": "uuid",
  "type": "density",
  "measuredAt": "2026-05-30T06:30:00.000Z",
  "density": {
    "currentDensityPerCm2": 2.833,
    "measuredAreaCm2": 12,
    "peakCount": 34,
    "averageCount": 21.5
  },
  "measurement": {}
}
```

저장 테이블:

- `uploaded_files`
- `analysis_jobs`
- `measurements`
- `density_results`

### POST `/api/analysis/vitality`

활력도 분석을 실행하고 측정 결과를 저장합니다.

요청:

```text
Content-Type: multipart/form-data

boxId=uuid
measuredAt=2026-05-30T06:30:00.000Z
file=@video.mp4
```

모델 서버 호출:

```text
POST {MODEL_RUNTIME_URL}/infer/vitality
```

응답:

```json
{
  "measurementId": "uuid",
  "boxId": "uuid",
  "type": "vitality",
  "measuredAt": "2026-05-30T06:30:00.000Z",
  "vitality": {
    "score": 78,
    "activeRatio": 0.84,
    "trend": [64, 69, 73, 78]
  },
  "measurement": {}
}
```

저장 테이블:

- `uploaded_files`
- `analysis_jobs`
- `measurements`
- `vitality_results`

## 증식률 API

### GET `/api/culture-boxes/:boxId/growth?from=YYYY-MM-DD&to=YYYY-MM-DD`

사육박스별 밀도 기반 증식률을 계산합니다. count 변화 자체를 주요 결과로 반환하지 않고, 밀도 변화와 활력도 추이를 중심으로 반환합니다.

쿼리:

- `from`: 시작일, 생략 시 사육박스 `startedAt`
- `to`: 종료일, 생략 시 서버 현재 날짜

계산식:

```text
densityChangePerCm2 = currentDensityPerCm2 - firstDensityPerCm2
densityChangeRatePercent = densityChangePerCm2 / firstDensityPerCm2 * 100
densityGrowthPerDay = densityChangePerCm2 / days
logDensityGrowthPerDay = (ln(currentDensityPerCm2) - ln(firstDensityPerCm2)) / days
```

응답:

```json
{
  "boxId": "uuid",
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
    {
      "date": "2026-05-01",
      "densityPerCm2": 0.9
    }
  ],
  "vitalityTrend": [
    {
      "date": "2026-05-01",
      "score": 72
    }
  ]
}
```

`growthLabel` 기준:

- 밀도 변화율 `> 20`: `증식 활발`
- 밀도 변화율 `< -10`: `감소 추세`
- 그 외: `유지 관찰`

## 모델 서버 연동 명세

Express 백엔드는 모델 런타임을 별도 프로세스로 보고 HTTP로 호출합니다.

### Detection

```text
POST {MODEL_RUNTIME_URL}/infer/detection
```

요청 payload:

```json
{
  "cultureBoxId": "uuid",
  "filePath": "uploads/file.png",
  "measuredAt": "2026-05-30T06:30:00.000Z"
}
```

기대 응답:

```json
{
  "countValue": 12,
  "boxes": [
    {
      "className": "predator",
      "confidence": 0.92,
      "x": 0.12,
      "y": 0.18,
      "width": 0.08,
      "height": 0.08
    }
  ]
}
```

### Density

```text
POST {MODEL_RUNTIME_URL}/infer/density
```

요청 payload:

```json
{
  "cultureBoxId": "uuid",
  "filePath": "uploads/file.mp4",
  "measuredAt": "2026-05-30T06:30:00.000Z",
  "measuredAreaCm2": 12
}
```

기대 응답:

```json
{
  "countValue": 34,
  "peakCount": 34,
  "averageCount": 21.5,
  "densityGrade": "normal"
}
```

### Vitality

```text
POST {MODEL_RUNTIME_URL}/infer/vitality
```

요청 payload:

```json
{
  "cultureBoxId": "uuid",
  "filePath": "uploads/file.mp4",
  "measuredAt": "2026-05-30T06:30:00.000Z"
}
```

기대 응답:

```json
{
  "vitalityScore": 78,
  "activeRatio": 0.84,
  "averageSpeedMmPerSec": 1.8,
  "trend": [64, 69, 73, 78]
}
```

## PostgreSQL 테이블

현재 마이그레이션 파일은 [backend/db/schema.sql](../backend/db/schema.sql)에 있습니다.

테이블:

- `culture_boxes`: 사육박스 기본 정보와 soft delete 상태
- `uploaded_files`: 업로드 파일 메타데이터
- `analysis_jobs`: 분석 요청 상태
- `measurements`: 공통 측정 결과
- `density_results`: 밀도 분석 상세 결과
- `density_frame_counts`: 프레임별 count 기록
- `vitality_results`: 활력도 분석 상세 결과
- `vitality_series`: 프레임별 활력도 추이
- `detection_boxes`: 객체 탐지 박스 상세
- `growth_snapshots`: 증식률 계산 결과 저장용
- `trash_events`: 삭제/복구 이벤트 로그

## 주요 데이터 관계

```text
culture_boxes 1 -- N uploaded_files
culture_boxes 1 -- N analysis_jobs
culture_boxes 1 -- N measurements
analysis_jobs 1 -- 0..1 measurements
measurements 1 -- 0..1 density_results
measurements 1 -- 0..1 vitality_results
measurements 1 -- N detection_boxes
measurements 1 -- N density_frame_counts
measurements 1 -- N vitality_series
culture_boxes 1 -- N growth_snapshots
trash_events N -- 1 entity
```

## 프론트엔드 연결 기준

기존 localStorage 상태는 다음 API로 대체할 수 있습니다.

```text
cm-culture-boxes -> GET/POST/PATCH/DELETE /api/culture-boxes
cm-trash-db      -> GET /api/trash/culture-boxes, POST /api/trash/culture-boxes/:id/restore
measurements     -> GET /api/culture-boxes/:boxId/measurements
growth result    -> GET /api/culture-boxes/:boxId/growth
```

프론트에서 모델 분석을 호출할 때는 항상 `boxId`를 함께 전송해야 합니다.

## 현재 제한사항

- 인증/권한은 아직 구현되어 있지 않습니다.
- 실제 모델 서버가 없으면 fallback 결과로 저장됩니다.
- `growth_snapshots` 테이블은 준비되어 있지만 현재 API는 실시간 계산 결과를 반환합니다.
- 업로드 파일은 로컬 디스크에 저장됩니다. 운영에서는 파일 보존 기간, 용량 제한, 백업 정책이 필요합니다.
- `density_frame_counts`, `vitality_series` 저장 로직은 테이블만 준비되어 있고 상세 저장은 모델 응답 형식 확정 후 확장해야 합니다.
