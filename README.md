# 수어랑 (Sign Language Translator)

수어를 입력하면 그것이 의미하는 문장을 출력해주는 번역 시스템입니다. MZ세대를 위한 세련된 UI와 사용자 친화적인 기능을 제공합니다.

## 프로젝트 개요

수어랑은 CNN+LSTM 기반의 딥러닝 모델과 MediaPipe 손 랜드마크 감지 기술을 활용하여 수어를 인식하고 번역합니다. 대부분의 일반인들은 수어를 알지 못합니다. 수어랑은 일반인이 수어를 배우기 위한 시간과 비용을 들일 필요없이 손쉽게 농인들과 소통할 수 있는 장을 마련합니다.

## 주요 기능

- 실시간 수어 인식 및 번역
- 사용자 인증 및 개인화된 경험
- 번역 결과 저장 및 관리
- 성별에 따른 음성 지원 (TTS)
- 세련된 MZ세대 친화적 UI/UX
- 다크 모드 지원

## 기술 스택

- **백엔드**: Flask, Python 3.11, MongoDB
- **ML/DL**: TensorFlow, MediaPipe, OpenCV
- **프론트엔드**: React Native, Expo
- **배포**: Docker, GitHub Actions, Firebase
- **인증**: JWT 기반 사용자 인증

## 설치 및 실행 방법

### 필수 요구사항

- Python 3.11
- Node.js 18+
- MongoDB
- Docker (선택 사항)

### 백엔드 설치 방법

1. 저장소 클론
   ```bash
   git clone https://github.com/YOUR_USERNAME/sueorang.git
   cd sueorang
   ```

2. 가상환경 생성 및 활성화
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/macOS
   .\.venv\Scripts\activate   # Windows
   ```

3. 필요한 패키지 설치
   ```bash
   pip install -r requirements.txt
   pip install -r backend/requirements.txt
   ```

4. 환경 변수 설정
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 필요한 환경 변수 설정
   ```

5. 백엔드 실행
   ```bash
   cd backend
   python app.py
   ```

### 프론트엔드 설치 방법

1. 필요한 패키지 설치
   ```bash
   cd frontend
   npm install
   ```

2. 개발 서버 실행
   ```bash
   npm start
   ```

### Docker를 사용한 실행 (선택 사항)

```bash
docker-compose up -d
```

## GitHub Actions를 통한 배포

이 프로젝트는 GitHub Actions를 사용하여 자동으로 배포됩니다. 메인 브랜치에 푸시하면 다음 작업이 자동으로 수행됩니다:

1. 테스트 실행
2. 백엔드 Docker 이미지 빌드 및 푸시
3. 프론트엔드 빌드
4. 서버에 배포
5. Firebase에 프론트엔드 배포
6. Slack 알림 전송

## 모바일 앱 배포

### 내부 테스트 설정

1. Google 개발자 콘솔에서 프로젝트 생성
2. 내부 테스트 트랙 설정
3. 다음 명령어로 APK 빌드
   ```bash
   cd frontend
   eas build -p android --profile internal
   ```
4. 생성된 APK를 Google Play Console에 업로드

## API 엔드포인트

### POST /api/translate

수어 이미지를 분석하여 번역 결과를 반환합니다.

**요청 형식**:
```json
{
  "frame": "BASE64_ENCODED_IMAGE_DATA"
}
```

**응답 형식**:
```json
{
  "predicted_word": "안녕하세요",
  "confidence": 0.95,
  "annotated_image": "BASE64_ENCODED_IMAGE_WITH_LANDMARKS",
  "model_used": "CNN+LSTM 기반 딥러닝 모델"
}
```

### 인증 API

- `POST /api/auth/register`: 사용자 등록
- `POST /api/auth/login`: 로그인
- `GET /api/auth/me`: 현재 사용자 정보 조회

### 번역 관리 API

- `POST /api/translations`: 번역 결과 저장
- `GET /api/translations/recent`: 최근 번역 조회
- `POST /api/translations/{id}/toggle-save`: 번역 저장 상태 토글
- `DELETE /api/translations/{id}`: 번역 삭제

### 저장된 수어 API

- `GET /api/signs/saved`: 저장된 수어 목록 조회
- `GET /api/signs/saved/{id}`: 저장된 수어 상세 조회
- `DELETE /api/signs/saved/{id}`: 저장된 수어 삭제
- `GET /api/signs/image/{id}`: 수어 이미지 조회

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요. 