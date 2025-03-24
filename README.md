# 수어 하자 (SueoHaja)

한국어 수화(수어)를 인식하여 텍스트 및 음성으로 번역해주는 모바일 앱입니다.

## 프로젝트 설명

수어 하자(SueoHaja)는 카메라를 통해 수어 동작을 인식하고, 이를 텍스트와 음성으로 변환하여 사용자에게 제공하는 앱입니다. 청각장애인과 비장애인 간의 원활한 의사소통을 돕기 위해 개발되었습니다.

### 주요 기능

- 실시간 수어 인식 및 번역
- 번역된 텍스트의 음성 출력
- 번역 기록 저장 및 관리
- 사용자 친화적인 인터페이스

## 기술 스택

### 프론트엔드 (모바일 앱)
- React Native
- React Navigation
- React Native Camera
- TTS (Text-to-Speech)

### 백엔드
- Flask (Python)
- MediaPipe
- TensorFlow/PyTorch
- MongoDB

### 인프라
- Docker
- GitHub Actions
- Google Cloud Platform

## 개발 환경 설정

### 필수 요구사항
- Node.js 14 이상
- Python 3.8 이상
- Docker

### 프론트엔드 설정

```bash
# 의존성 설치
cd frontend
npm install

# 개발 서버 실행
npm start

# 안드로이드 빌드
npm run android

# iOS 빌드
npm run ios
```

### 백엔드 설정

```bash
# 가상 환경 생성 및 활성화
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python app.py
```

### Docker를 이용한 배포

```bash
# 백엔드 이미지 빌드
cd backend
docker build -t sueohaja-backend .

# 백엔드 컨테이너 실행
docker run -d -p 5000:5000 --name sueohaja-backend sueohaja-backend
```

## 인프라 구성 및 배포

### 서버 구성

1. Google Cloud Platform에 프로젝트 생성
2. Cloud Run 또는 App Engine 서비스 설정
3. MongoDB Atlas 계정 생성 및 클러스터 설정
4. 환경 변수 구성 (API 키, 데이터베이스 연결 문자열 등)

### CI/CD 파이프라인

GitHub Actions를 통해 자동화된 빌드 및 배포 파이프라인을 구성합니다:

1. `main` 브랜치로 푸시 시 CI/CD 파이프라인 실행
2. 코드 테스트 및 빌드
3. Docker 이미지 생성
4. Google Cloud Platform에 배포

자세한 구성은 `.github/workflows` 디렉토리에서 확인할 수 있습니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요. 