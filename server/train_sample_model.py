import os
import json
import time
import requests
import numpy as np
from sample_dataset import generate_sample_dataset

# 학습 서버 설정
API_URL = "http://localhost:5000/train"
API_KEY = os.environ.get("API_KEY", "test-key")  # 테스트용 API 키

def train_model_with_sample_data():
    """
    샘플 데이터셋을 생성하고 API를 통해 모델을 학습합니다.
    """
    print("샘플 데이터셋 생성 중...")
    
    # 데이터 디렉토리 생성
    os.makedirs('data', exist_ok=True)
    
    # 샘플 데이터셋 생성
    dataset = generate_sample_dataset('data/ksl_sample_dataset.json')
    
    print(f"생성된 단어 수: {len(dataset)}")
    print(f"총 샘플 수: {sum(len(samples) for samples in dataset.values())}")
    
    # 학습 옵션 설정
    training_options = {
        "epochs": 30,
        "batchSize": 16,
        "validationSplit": 0.2,
        "sequenceLength": 30,
        "inputFeatures": 159,  # 42개 손 랜드마크(3D) + 33개 포즈 랜드마크(3D)
        "modelType": "lstm",
        "hiddenUnits": 64
    }
    
    # API 요청 데이터 준비
    request_data = {
        "dataset": dataset,
        "options": training_options
    }
    
    # API 요청 헤더
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    print("\nAPI를 통해 모델 학습 시작...")
    start_time = time.time()
    
    try:
        response = requests.post(
            API_URL,
            json=request_data,
            headers=headers
        )
        
        # 응답 검증
        if response.status_code == 200:
            result = response.json()
            print(f"\n학습 완료! 소요 시간: {time.time() - start_time:.2f}초")
            print(f"모델 버전: {result.get('version')}")
            print(f"정확도: {result.get('accuracy', 0) * 100:.2f}%")
            print(f"검증 정확도: {result.get('val_accuracy', 0) * 100:.2f}%")
            print(f"어휘 사전: {', '.join(result.get('vocabulary', []))}")
            print(f"학습 샘플 수: {result.get('samples', 0)}")
            
            return True
        else:
            print(f"API 오류 (상태 코드: {response.status_code})")
            print(f"오류 메시지: {response.text}")
            return False
            
    except Exception as e:
        print(f"학습 과정에서 오류 발생: {str(e)}")
        return False

def test_model_endpoint():
    """
    학습된 모델을 검증합니다.
    """
    print("\n학습된 모델 정보 요청 중...")
    
    # API 요청 헤더
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(
            "http://localhost:5000/model",
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print("모델 정보 수신 성공!")
            print(f"모델 버전: {result.get('version')}")
            print(f"어휘 사전 크기: {len(result.get('vocabulary', []))}")
            print(f"지원하는 단어: {', '.join(result.get('vocabulary', []))}")
            
            # 모델 구조 정보
            model_info = result.get('modelInfo', {})
            print(f"\n모델 구조:")
            print(f"입력 형태: {model_info.get('input_shape')}")
            print(f"출력 형태: {model_info.get('output_shape')}")
            print(f"모델 레이어: {', '.join(model_info.get('layers', []))}")
            
            return True
        else:
            print(f"모델 정보 요청 실패 (상태 코드: {response.status_code})")
            print(f"오류 메시지: {response.text}")
            return False
            
    except Exception as e:
        print(f"모델 정보 요청 중 오류 발생: {str(e)}")
        return False

if __name__ == "__main__":
    # 서버 실행 여부 확인
    try:
        response = requests.get("http://localhost:5000/languages")
        if response.status_code != 200:
            print("API 서버가 실행 중이 아닙니다. 먼저 서버를 실행하세요.")
            exit(1)
    except:
        print("API 서버에 연결할 수 없습니다. 먼저 서버를 실행하세요.")
        exit(1)
    
    # 모델 학습
    success = train_model_with_sample_data()
    
    if success:
        # 모델 테스트
        test_model_endpoint() 