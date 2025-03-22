#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import argparse

def print_header(message):
    """헤더 메시지 출력"""
    print("\n" + "=" * 60)
    print(f" {message}")
    print("=" * 60)

def run_command(command, message):
    """명령어 실행 함수"""
    print_header(message)
    result = subprocess.run(command, shell=True)
    return result.returncode == 0

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='KSL 모델 학습 및 테스트 도구')
    parser.add_argument('--skip-server', action='store_true', help='서버 시작 단계 건너뛰기')
    parser.add_argument('--skip-train', action='store_true', help='모델 학습 단계 건너뛰기')
    parser.add_argument('--api-key', type=str, help='API 키 설정 (선택 사항)')
    parser.add_argument('--port', type=int, default=5000, help='서버 포트 (기본값: 5000)')
    args = parser.parse_args()
    
    # 환경 변수 설정
    if args.api_key:
        os.environ['API_KEY'] = args.api_key
        os.environ['API_KEYS'] = args.api_key
    
    os.environ['PORT'] = str(args.port)
    
    # 디렉토리 생성
    os.makedirs('models', exist_ok=True)
    os.makedirs('data', exist_ok=True)
    
    # 서버 프로세스
    server_process = None
    
    try:
        # 1. 서버 시작 (백그라운드)
        if not args.skip_server:
            print_header("Flask 서버 시작")
            server_process = subprocess.Popen([sys.executable, 'train_api.py'])
            print("서버가 시작되었습니다. 잠시 후 계속됩니다...")
            # 서버가 시작될 때까지 대기
            time.sleep(3)
        
        # 2. 샘플 데이터셋 생성 및 모델 학습
        if not args.skip_train:
            success = run_command(
                f"{sys.executable} train_sample_model.py",
                "샘플 데이터셋으로 모델 학습"
            )
            
            if not success:
                print("모델 학습에 실패했습니다. 프로세스를 중단합니다.")
                return
        
        # 3. 모델 테스트
        run_command(
            f"{sys.executable} test_translation.py",
            "학습된 모델 테스트"
        )
        
        print_header("모든 과정이 완료되었습니다!")
        
    except KeyboardInterrupt:
        print("\n프로세스가 사용자에 의해 중단되었습니다.")
    finally:
        # 서버 프로세스 종료
        if server_process:
            print("서버를 종료합니다...")
            server_process.terminate()
            server_process.wait()

if __name__ == "__main__":
    main() 