# CheckMite

CheckMite는 응애 사육 데이터를 이미지와 영상 기반으로 분석하는 웹 인터페이스입니다. 사용자는 사육박스별로 사진 또는 영상을 업로드하고, 객체 탐지, 밀도 측정, 활력도 측정, 증식률 분석 결과를 확인할 수 있습니다.

## 주요 기능

- 객체 탐지: 사진에서 천적응애와 대상 개체를 탐지하고 개체 수, 비율, 신뢰도 정보를 표시합니다.
- 밀도 측정: 영상 프레임에서 개체를 추적하고 단위 면적당 밀도와 등급을 계산합니다.
- 활력도 측정: 영상 속 개체 움직임을 분석해 활력도 점수, 히트맵, 시간별 추이를 제공합니다.
- 증식률 분석: 사육박스별 날짜별 count, 밀도, 활력도 데이터를 누적하고 기간별 성장률을 계산합니다.
- 휴지통: 삭제된 사육박스를 즉시 제거하지 않고 보관했다가 복구할 수 있습니다.

## 기술 스택

- Frontend: React + Vite + TypeScript TSX
- Backend: Express + Node.js
- Database: PostgreSQL
- Model runtime: 같은 서버 안에서 실행되는 모델 추론 프로세스

## 프론트엔드 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 프론트엔드 빌드

```bash
npm run build
```

현재 작업 환경에서 Vite 기본 minify 단계가 오류 메시지 없이 종료될 수 있어, 검증 시 아래 명령을 사용할 수 있습니다.

```bash
node ./node_modules/vite/bin/vite.js build --minify=false --emptyOutDir=false
```

## 서버 구성 문서

프론트엔드, Express 백엔드, 모델 런타임, PostgreSQL을 하나의 서버 안에 구성하는 방식은 아래 문서를 참고하세요.

[docs/backend-model-server-architecture.md](./docs/backend-model-server-architecture.md)
