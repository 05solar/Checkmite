# CheckMite

CheckMite는 사육박스별 이미지/영상 데이터를 기반으로 객체 탐지, 밀도 측정, 활력도 측정, 증식률 분석을 수행하는 웹 애플리케이션입니다.

## 기술 스택

- Frontend: React + Vite + TypeScript TSX
- Backend: Express + Node.js
- Database: PostgreSQL
- Model runtime: 별도 로컬 모델 추론 서버

## 사전 준비

필요한 도구:

- Node.js
- npm
- PostgreSQL

의존성 설치:

```bash
npm install
```

## 환경 변수 설정

백엔드를 실행하려면 `.env` 파일이 필요합니다.

```bash
cp .env.example .env
```

Windows PowerShell에서는 아래처럼 복사할 수 있습니다.

```powershell
Copy-Item .env.example .env
```

기본 예시:

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

`DATABASE_URL`은 실제 PostgreSQL 계정, 비밀번호, DB 이름에 맞게 수정해야 합니다.

## 프론트엔드 개발 실행

프론트엔드만 실행할 때 사용합니다.

```bash
npm run dev
```

기본 주소:

```text
http://localhost:5173
```

현재 프론트엔드는 일부 상태를 localStorage 기반으로도 동작할 수 있습니다. 백엔드 API 연동을 완전히 붙일 때는 `docs/backend-api-spec.md`의 API를 기준으로 연결하면 됩니다.

## 백엔드 개발 실행

PostgreSQL DB가 먼저 실행 중이어야 합니다.

DB 테이블 생성:

```bash
npm run backend:migrate
```

백엔드 실행:

```bash
npm run backend:dev
```

기본 API 주소:

```text
http://localhost:3000/api
```

상태 확인:

```bash
curl http://localhost:3000/api/health
```

Windows PowerShell:

```powershell
Invoke-WebRequest http://localhost:3000/api/health
```

## 프론트엔드와 백엔드 함께 실행

개발 중에는 터미널을 2개 열어 실행합니다.

터미널 1:

```bash
npm run backend:dev
```

터미널 2:

```bash
npm run dev
```

접속 주소:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000/api
```

## 모델 서버

백엔드는 모델 서버를 아래 주소로 호출합니다.

```text
MODEL_RUNTIME_URL=http://127.0.0.1:8000
```

호출 경로:

- `POST /infer/detection`
- `POST /infer/density`
- `POST /infer/vitality`

현재 `.env.example`의 기본값은 `MODEL_RUNTIME_REQUIRED=false`입니다. 이 상태에서는 모델 서버가 없어도 개발용 fallback 결과로 백엔드 흐름을 테스트할 수 있습니다.

운영 환경에서는 아래처럼 설정하는 것을 권장합니다.

```env
MODEL_RUNTIME_REQUIRED=true
```

## 빌드

기본 빌드:

```bash
npm run build
```

현재 작업 환경에서는 Vite 기본 minify 단계가 실패 코드로 종료될 수 있습니다. 이 경우 타입 검사와 번들 생성을 분리해서 검증합니다.

TypeScript 검사:

```bash
npx tsc -b --pretty false
```

minify 없이 Vite 빌드:

```bash
node ./node_modules/vite/bin/vite.js build --minify=false --emptyOutDir=false
```

빌드 결과는 `dist/`에 생성됩니다.

## 프로덕션 실행 구조

권장 구조:

```text
nginx
  - React/Vite 정적 파일 서빙
  - /api 요청을 Express 백엔드로 프록시

Express Backend
  - REST API
  - PostgreSQL 저장/조회
  - 모델 서버 호출

Model Runtime
  - detection
  - density
  - vitality

PostgreSQL
  - 사육박스
  - 측정 데이터
  - 분석 결과
  - 휴지통 이벤트
```

단일 Express 서버에서 빌드된 프론트엔드까지 함께 서빙하려면 `FRONTEND_DIST_DIR=dist`로 설정하고, 먼저 프론트엔드를 빌드한 뒤 백엔드를 실행합니다.

```bash
node ./node_modules/vite/bin/vite.js build --minify=false --emptyOutDir=false
npm run backend:dev
```

## 주요 API

- `GET /api/health`
- `GET /api/culture-boxes`
- `POST /api/culture-boxes`
- `PATCH /api/culture-boxes/:id`
- `DELETE /api/culture-boxes/:id`
- `GET /api/trash/culture-boxes`
- `POST /api/trash/culture-boxes/:id/restore`
- `POST /api/measurements`
- `GET /api/culture-boxes/:boxId/measurements`
- `POST /api/analysis/detection`
- `POST /api/analysis/density`
- `POST /api/analysis/vitality`
- `GET /api/culture-boxes/:boxId/growth`

## 문서

서버 구성 설계:

[docs/backend-model-server-architecture.md](./docs/backend-model-server-architecture.md)

현재 구현된 백엔드 API와 DB 명세:

[docs/backend-api-spec.md](./docs/backend-api-spec.md)
