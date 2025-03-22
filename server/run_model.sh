#!/bin/bash

echo "KSL 번역 모델 학습 및 테스트 시작"
echo "============================================"

# Python 설치 확인
if ! command -v python3 &> /dev/null; then
    echo "Python 3가 설치되어 있지 않습니다."
    echo "https://www.python.org/downloads/ 에서 Python 3.8 이상을 설치하세요."
    exit 1
fi

# 의존성 설치 확인
if ! python3 -c "import tensorflow" &> /dev/null; then
    echo "필요한 패키지를 설치합니다..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "패키지 설치에 실패했습니다."
        exit 1
    fi
fi

# 실행 권한 부여
chmod +x run_ksl_model.py

# 모델 학습 및 테스트 실행
python3 run_ksl_model.py "$@"

echo ""
echo "완료되었습니다!" 