# 수어 번역기 (Sign Language Translator)

수어 영상을 입력하면 그것이 의미하는 문장을 출력해주는 번역 시스템입니다. 이 프로젝트는 [bigdata-3team/Sign-Language-Translator](https://github.com/bigdata-3team/Sign-Language-Translator) 프로젝트를 기반으로 구현되었습니다.

## 프로젝트 개요

수어 번역기는 CNN+LSTM 기반의 딥러닝 모델과 MediaPipe 손 랜드마크 감지 기술을 활용하여 수어를 인식하고 번역합니다. 대부분의 일반인들은 수어를 알지 못합니다. 수어 번역기는 일반인이 수어를 배우기 위한 시간과 비용을 들일 필요없이 손쉽게 농인들과 소통할 수 있는 장을 마련합니다.

## 기능

- 실시간 수어 인식 및 번역
- MediaPipe 기반 손 랜드마크 감지
- 딥러닝 모델을 통한 정확한 수어 분류
- 간단한 REST API 인터페이스
- 시각화된 손 랜드마크 제공

## 기술 스택

- **백엔드**: Flask, Python 3.11
- **ML/DL**: TensorFlow, MediaPipe, OpenCV
- **데이터베이스**: MongoDB
- **배포**: Docker, GitHub Actions

## 설치 및 실행 방법

### 필수 요구사항

- Python 3.11
- pip

### 설치 방법

1. 저장소 클론
   ```bash
   git clone https://github.com/YOUR_USERNAME/sign-language-translator.git
   cd sign-language-translator
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
   ```

4. 환경 변수 설정
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 필요한 환경 변수 설정
   ```

### 실행 방법

```bash
cd backend
python app.py
```

서버는 기본적으로 http://localhost:5000/ 에서 실행됩니다.

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
  "model_used": "bigdata-3team/Sign-Language-Translator"
}
```

### GET /api/health

서버 상태를 확인합니다.

**응답 형식**:
```json
{
  "status": "ok"
}
```

## 모델 아키텍처

이 프로젝트에서 사용된 모델은 CNN(Convolutional Neural Network)과 LSTM(Long Short-Term Memory)을 결합한 구조입니다. 이 모델은 다음과 같은 특징을 가집니다:

1. **시간적 특성 반영**: 수어는 시간에 따라 변화하는 동작을 포함하므로, 시퀀스 데이터 처리가 필요합니다.
2. **공간적 특성 반영**: CNN을 통해 이미지의 공간적 특성을 추출합니다.
3. **TimeDistributed 레이어**: 프레임 시퀀스의 각 프레임에 동일한 처리를 적용합니다.

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요. 