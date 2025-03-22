FROM python:3.8-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 환경 변수 설정
ENV MODEL_DIR=/app/models
ENV PORT=5000

# 모델 저장 디렉토리 생성
RUN mkdir -p ${MODEL_DIR}

# 포트 노출
EXPOSE ${PORT}

# 서버 실행
CMD gunicorn --bind 0.0.0.0:${PORT} train_api:app 