#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import argparse
import json
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

def print_header(message):
    """헤더 메시지 출력"""
    print("\n" + "=" * 60)
    print(f" {message}")
    print("=" * 60)

def run_command(command, message, capture_output=False):
    """명령어 실행 함수"""
    print_header(message)
    
    if capture_output:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result
    else:
        result = subprocess.run(command, shell=True)
        return result.returncode == 0

def create_directories():
    """필요한 디렉토리 생성"""
    os.makedirs('data', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    os.makedirs('reports', exist_ok=True)

def check_dependencies():
    """필요한 패키지 설치 확인"""
    dependencies = ['tensorflow', 'mediapipe', 'flask', 'flask_cors', 'opencv-python', 'numpy', 'tqdm']
    missing = []
    
    for dep in dependencies:
        try:
            __import__(dep.replace('-', '_'))
        except ImportError:
            missing.append(dep)
    
    if missing:
        print_header("누락된 패키지 설치")
        print(f"다음 패키지를 설치합니다: {', '.join(missing)}")
        subprocess.run(f"{sys.executable} -m pip install {' '.join(missing)}", shell=True)

def run_web_server(port=8000):
    """간단한 웹 서버 실행"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    
    print(f"http://localhost:{port}/reports/dashboard.html 에서 대시보드를 확인할 수 있습니다.")
    
    # 브라우저 열기
    threading.Timer(1.0, lambda: webbrowser.open(f'http://localhost:{port}/reports/dashboard.html')).start()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("웹 서버를 종료합니다.")

def generate_dashboard(dataset_path, training_result_path, test_result_path):
    """대시보드 HTML 파일 생성"""
    # 데이터 로드
    dataset = {}
    training_result = {}
    test_result = {}
    
    try:
        if os.path.exists(dataset_path):
            with open(dataset_path, 'r', encoding='utf-8') as f:
                dataset = json.load(f)
        
        if os.path.exists(training_result_path):
            with open(training_result_path, 'r', encoding='utf-8') as f:
                training_result = json.load(f)
        
        if os.path.exists(test_result_path):
            with open(test_result_path, 'r', encoding='utf-8') as f:
                test_result = json.load(f)
    except Exception as e:
        print(f"대시보드 생성 중 오류 발생: {str(e)}")
        return False
    
    # 대시보드 HTML 생성
    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KSL 번역 모델 대시보드</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .card {{ background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .metrics {{ display: flex; justify-content: space-between; margin-bottom: 20px; }}
        .metric {{ flex: 1; text-align: center; padding: 15px; background-color: #f9f9f9; border-radius: 8px; margin: 0 10px; }}
        .metric h3 {{ margin-top: 0; color: #333; }}
        .metric .value {{ font-size: 24px; font-weight: bold; color: #2196F3; }}
        h2 {{ color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #f2f2f2; }}
        tr:hover {{ background-color: #f5f5f5; }}
        .chart {{ height: 300px; margin-top: 20px; }}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>KSL 번역 모델 대시보드</h1>
            <p>한국어 수화 번역 모델의 데이터셋, 학습 및 테스트 결과</p>
        </div>
        
        <div class="card">
            <h2>모델 성능 요약</h2>
            <div class="metrics">
                <div class="metric">
                    <h3>단어 수</h3>
                    <div class="value">{len(dataset)}</div>
                </div>
                <div class="metric">
                    <h3>총 샘플 수</h3>
                    <div class="value">{sum(len(samples) for samples in dataset.values())}</div>
                </div>
                <div class="metric">
                    <h3>학습 정확도</h3>
                    <div class="value">{training_result.get('accuracy', 0) * 100:.1f}%</div>
                </div>
                <div class="metric">
                    <h3>검증 정확도</h3>
                    <div class="value">{training_result.get('val_accuracy', 0) * 100:.1f}%</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>데이터셋 분포</h2>
            <div class="chart">
                <canvas id="datasetChart"></canvas>
            </div>
        </div>
        
        <div class="card">
            <h2>단어별 샘플 수</h2>
            <table>
                <tr>
                    <th>단어</th>
                    <th>샘플 수</th>
                </tr>
                {"".join(f"<tr><td>{word}</td><td>{len(samples)}</td></tr>" for word, samples in sorted(dataset.items()))}
            </table>
        </div>
    </div>
    
    <script>
        // 데이터셋 분포 차트
        const datasetCtx = document.getElementById('datasetChart').getContext('2d');
        const datasetChart = new Chart(datasetCtx, {{
            type: 'bar',
            data: {{
                labels: {json.dumps([word for word in sorted(dataset.keys())])},
                datasets: [{{
                    label: '샘플 수',
                    data: {json.dumps([len(samples) for _, samples in sorted(dataset.items())])},
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }}]
            }},
            options: {{
                responsive: true,
                scales: {{
                    y: {{
                        beginAtZero: true,
                        title: {{
                            display: true,
                            text: '샘플 수'
                        }}
                    }},
                    x: {{
                        title: {{
                            display: true,
                            text: '단어'
                        }}
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>
"""
    
    # 보고서 디렉토리 생성
    os.makedirs('reports', exist_ok=True)
    
    # HTML 파일 저장
    try:
        with open('reports/dashboard.html', 'w', encoding='utf-8') as f:
            f.write(html)
        return True
    except Exception as e:
        print(f"대시보드 저장 중 오류 발생: {str(e)}")
        return False

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='한국어 수화 번역 파이프라인')
    parser.add_argument('--collect', action='store_true', help='데이터 수집 수행')
    parser.add_argument('--train', action='store_true', help='모델 학습 수행')
    parser.add_argument('--test', action='store_true', help='모델 테스트 수행')
    parser.add_argument('--dashboard', action='store_true', help='결과 대시보드 생성')
    parser.add_argument('--dataset', type=str, default='data/ksl_dataset.json',
                      help='데이터셋 경로 (기본값: data/ksl_dataset.json)')
    parser.add_argument('--seconds', type=int, default=2,
                      help='데이터 수집 시 각 샘플 녹화 시간(초) (기본값: 2)')
    parser.add_argument('--epochs', type=int, default=50,
                      help='학습 에폭 수 (기본값: 50)')
    parser.add_argument('--batch-size', type=int, default=16,
                      help='배치 크기 (기본값: 16)')
    parser.add_argument('--model-type', type=str, default='lstm', choices=['lstm', 'gru'],
                      help='모델 유형 (lstm 또는 gru, 기본값: lstm)')
    parser.add_argument('--api-key', type=str, default='test-key',
                      help='API 키 (기본값: test-key)')
    args = parser.parse_args()
    
    # 모든 단계 수행 (아무 인자가 지정되지 않은 경우)
    run_all = not (args.collect or args.train or args.test or args.dashboard)
    
    # 필요한 디렉토리 생성
    create_directories()
    
    # 패키지 의존성 확인
    check_dependencies()
    
    # 환경 변수 설정
    os.environ['API_KEY'] = args.api_key
    os.environ['API_KEYS'] = args.api_key
    
    # 서버 프로세스
    server_process = None
    
    try:
        # 1. 서버 시작 (백그라운드)
        print_header("Flask 서버 시작")
        server_process = subprocess.Popen([sys.executable, 'train_api.py'])
        print("서버가 시작되었습니다. 잠시 후 계속됩니다...")
        time.sleep(3)  # 서버 시작 대기
        
        # 2. 데이터 수집
        if args.collect or run_all:
            collect_command = f"{sys.executable} data_collector.py --output {args.dataset} --seconds {args.seconds}"
            run_command(collect_command, "한국어 수화 데이터 수집")
        
        # 3. 모델 학습
        if args.train or run_all:
            train_command = f"{sys.executable} train_user_model.py --dataset {args.dataset} --epochs {args.epochs} --batch-size {args.batch_size} --model-type {args.model_type} --api-key {args.api_key}"
            if args.test or run_all:
                train_command += " --test"
            run_command(train_command, "한국어 수화 모델 학습")
        
        # 4. 대시보드 생성
        if args.dashboard or run_all:
            training_result_path = os.path.join(os.path.dirname(args.dataset), 'training_result.json')
            test_result_path = os.path.join(os.path.dirname(args.dataset), 'test_result.json')
            
            print_header("결과 대시보드 생성")
            if generate_dashboard(args.dataset, training_result_path, test_result_path):
                print("대시보드가 생성되었습니다.")
                print("웹 서버를 시작합니다...")
                run_web_server()
            else:
                print("대시보드 생성에 실패했습니다.")
        
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