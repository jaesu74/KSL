#!/bin/bash

echo "한국어 수화 AI Hub 파이프라인 실행"
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
chmod +x aihub_pipeline.py
chmod +x aihub_collector.py

# 가상 데이터 생성 여부 확인
SIMULATE="--simulate"
echo "AI Hub API 키가 없는 경우 가상 데이터를 생성합니다."
read -p "AI Hub API 키를 입력하세요 (없으면 Enter): " API_KEY

if [ ! -z "$API_KEY" ]; then
    SIMULATE=""
    AIHUB_KEY="--aihub-key $API_KEY"
else
    AIHUB_KEY=""
fi

# 특정 단어 입력 받기
echo ""
echo "수집할 특정 단어가 있으면 입력하세요 (공백으로 구분)"
echo "예: 안녕하세요 감사합니다 미안합니다"
echo "입력하지 않으면 기본 단어 목록이 사용됩니다."
read -p "단어 목록: " WORDS

if [ ! -z "$WORDS" ]; then
    WORDS_ARG="--words $WORDS"
else
    WORDS_ARG=""
fi

# 파이프라인 실행
python3 aihub_pipeline.py $SIMULATE $AIHUB_KEY $WORDS_ARG "$@"

echo ""
echo "완료되었습니다!" 