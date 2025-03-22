@echo off
echo 한국어 수화 번역 파이프라인 실행
echo ============================================

REM Python 설치 확인
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Python이 설치되어 있지 않습니다.
    echo https://www.python.org/downloads/ 에서 Python 3.8 이상을 설치하세요.
    pause
    exit /b 1
)

REM 의존성 설치 확인
pip show tensorflow > nul 2>&1
if %errorlevel% neq 0 (
    echo 필요한 패키지를 설치합니다...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo 패키지 설치에 실패했습니다.
        pause
        exit /b 1
    )
)

REM 파이프라인 실행
python full_pipeline.py %*

echo.
echo 완료되었습니다!
pause 