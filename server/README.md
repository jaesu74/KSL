# 한국어 수화 번역 모델 (Korean Sign Language Translation Model)

이 프로젝트는 한국어 수화를 텍스트로 번역하는 인공지능 모델을 구현합니다.

## 주요 기능

- 카메라를 통한 사용자 수화 데이터 수집
- AI Hub에서 API를 통한 수화 데이터 수집
- 수집된 데이터셋으로 딥러닝 모델 학습
- 학습된 모델을 사용한 실시간 수화 번역
- 학습 및 테스트 결과 시각화 대시보드

## 설치 방법

### 요구사항

- Python 3.8 이상
- TensorFlow 2.8.0
- MediaPipe 0.8.10
- Flask 2.0.1
- 기타 필요한 패키지는 requirements.txt 참조

### 설치 명령어

```bash
pip install -r requirements.txt
```

## 사용 방법

### 1. 데이터 수집

#### 직접 수집

Windows:
```
run_collector.bat
```

Mac/Linux:
```
./run_collector.sh
```

#### AI Hub에서 수집

Windows:
```
run_aihub.bat
```

Mac/Linux:
```
./run_aihub.sh
```

### 2. 모델 학습

Windows:
```
run_pipeline.bat --train
```

Mac/Linux:
```
./run_pipeline.sh --train
```

### 3. 전체 파이프라인 실행 (데이터 수집부터 모델 학습, 테스트, 대시보드까지)

Windows:
```
run_pipeline.bat
```

Mac/Linux:
```
./run_pipeline.sh
```

## AI Hub 데이터 수집 및 학습 파이프라인

AI Hub에서 한국어 수화 데이터를 수집하고 모델을 학습시키는 파이프라인입니다.

### 기능

- AI Hub API를 통한 수화 데이터 자동 수집
- API 키가 없는 경우 시뮬레이션 데이터 생성
- 수집된 데이터로 모델 학습
- 학습 결과 시각화 대시보드 생성

### 명령어 옵션

```
python aihub_pipeline.py [옵션]
```

주요 옵션:
- `--collect`: AI Hub에서 데이터 수집
- `--train`: 모델 학습
- `--test`: 모델 테스트
- `--dashboard`: 결과 대시보드 생성
- `--simulate`: AI Hub API 없이 가상 데이터 생성
- `--aihub-key KEY`: AI Hub API 키 설정
- `--words WORD1 WORD2...`: 수집할 단어 목록 지정
- `--samples N`: 단어별 샘플 수 설정 (기본값: 5)
- `--epochs N`: 학습 에폭 수 설정 (기본값: 50)
- `--batch-size N`: 배치 크기 설정 (기본값: 16)
- `--model-type TYPE`: 모델 유형 설정 (lstm 또는 gru, 기본값: lstm)

## 프로젝트 구조

```
server/
├── aihub_collector.py      # AI Hub 데이터 수집 모듈
├── aihub_pipeline.py       # AI Hub 데이터 수집 및 학습 파이프라인
├── data_collector.py       # 직접 데이터 수집 모듈
├── full_pipeline.py        # 전체 파이프라인 실행 스크립트
├── train_api.py            # 모델 학습 API 서버
├── train_user_model.py     # 사용자 데이터로 모델 학습
├── requirements.txt        # 필요한 패키지 목록
├── run_aihub.bat           # AI Hub 파이프라인 실행 (Windows)
├── run_aihub.sh            # AI Hub 파이프라인 실행 (Mac/Linux)
├── run_pipeline.bat        # 전체 파이프라인 실행 (Windows)
├── run_pipeline.sh         # 전체 파이프라인 실행 (Mac/Linux)
├── collect_data.bat        # 데이터 수집 실행 (Windows)
└── collect_data.sh         # 데이터 수집 실행 (Mac/Linux)
```

## 데이터 형식

수집된 데이터는 JSON 형식으로 저장되며, 다음과 같은 구조를 가집니다:

```json
{
  "단어1": [
    [프레임1_데이터, 프레임2_데이터, ...],
    [프레임1_데이터, 프레임2_데이터, ...],
    ...
  ],
  "단어2": [
    ...
  ],
  ...
}
```

각 프레임 데이터는 손과 포즈의 랜드마크 좌표로 구성됩니다.

## 모델 아키텍처

현재 지원하는 모델:
- LSTM (Long Short-Term Memory)
- GRU (Gated Recurrent Unit)

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.

## 참고사항

AI Hub API를 통한 데이터 수집은 API 키가 필요하며, 키가 없는 경우 시뮬레이션 데이터를 생성합니다. 