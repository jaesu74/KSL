@echo off
echo 한국어 수화 AI Hub 파이프라인 실행
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

REM 가상 데이터 생성 여부 확인
set SIMULATE=--simulate
echo AI Hub API 키가 없는 경우 가상 데이터를 생성합니다.
set /p API_KEY="AI Hub API 키를 입력하세요 (없으면 Enter): "

if not "%API_KEY%"=="" (
    set SIMULATE=
    set AIHUB_KEY=--aihub-key %API_KEY%
)

REM 특정 단어 입력 받기
echo.
echo 수집할 특정 단어가 있으면 입력하세요 (공백으로 구분)
echo 예: 안녕하세요 감사합니다 미안합니다
echo 입력하지 않으면 기본 단어 목록이 사용됩니다.
set /p WORDS="단어 목록: "

if not "%WORDS%"=="" (
    set WORDS_ARG=--words %WORDS%
) else (
    set WORDS_ARG=
)

REM 파이프라인 실행
python aihub_pipeline.py %SIMULATE% %AIHUB_KEY% %WORDS_ARG% %*

echo.
echo 완료되었습니다!
pause 