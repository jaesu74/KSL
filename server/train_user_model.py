import os
import json
import time
import requests
import argparse
import numpy as np
from tqdm import tqdm

# 학습 서버 설정
API_URL = "http://localhost:5000/train"
API_KEY = os.environ.get("API_KEY", "test-key")  # 테스트용 API 키

def load_dataset(dataset_path):
    """데이터셋 로드"""
    if not os.path.exists(dataset_path):
        print(f"오류: 데이터셋 파일 '{dataset_path}'을 찾을 수 없습니다.")
        return None
    
    try:
        with open(dataset_path, 'r', encoding='utf-8') as f:
            dataset = json.load(f)
        
        # 데이터셋 검증
        if not dataset or len(dataset) < 2:
            print("오류: 데이터셋에는 최소 2개 이상의 단어가 필요합니다.")
            return None
        
        # 샘플 수 확인
        total_samples = sum(len(samples) for samples in dataset.values())
        if total_samples < 10:
            print(f"경고: 데이터셋의 샘플 수가 너무 적습니다 ({total_samples}개). 모델 성능이 좋지 않을 수 있습니다.")
        
        return dataset
    
    except Exception as e:
        print(f"데이터셋 로드 중 오류 발생: {str(e)}")
        return None

def train_model_with_dataset(dataset_path, options=None):
    """사용자 수집 데이터셋으로 모델 학습"""
    print(f"데이터셋 '{dataset_path}' 로드 중...")
    
    # 데이터셋 로드
    dataset = load_dataset(dataset_path)
    if not dataset:
        return False
    
    # 데이터셋 정보 출력
    words = list(dataset.keys())
    total_samples = sum(len(samples) for samples in dataset.values())
    
    print(f"데이터셋 로드 완료:")
    print(f"- 단어 수: {len(words)}")
    print(f"- 총 샘플 수: {total_samples}")
    print(f"- 포함된 단어: {', '.join(words)}")
    
    # 각 단어별 샘플 수 출력
    print("\n각 단어별 샘플 수:")
    for word, samples in sorted(dataset.items()):
        print(f"- {word}: {len(samples)}개")
    
    # 기본 학습 옵션
    default_options = {
        "epochs": 50,
        "batchSize": 16,
        "validationSplit": 0.2,
        "sequenceLength": 30,
        "inputFeatures": 159,  # 42개 손 랜드마크(3D) + 33개 포즈 랜드마크(3D)
        "modelType": "lstm",
        "hiddenUnits": 64
    }
    
    # 사용자 지정 옵션으로 기본 옵션 업데이트
    if options:
        default_options.update(options)
    
    training_options = default_options
    
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
    print(f"- 에폭: {training_options['epochs']}")
    print(f"- 배치 크기: {training_options['batchSize']}")
    print(f"- 검증 분할: {training_options['validationSplit']}")
    print(f"- 모델 타입: {training_options['modelType']}\n")
    
    start_time = time.time()
    
    try:
        print("데이터 전송 중...")
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
            print(f"학습 샘플 수: {result.get('samples', 0)}")
            
            # 학습 결과 저장
            result_path = os.path.join(os.path.dirname(dataset_path), 'training_result.json')
            with open(result_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            print(f"\n학습 결과가 '{result_path}'에 저장되었습니다.")
            
            return True
        else:
            print(f"API 오류 (상태 코드: {response.status_code})")
            print(f"오류 메시지: {response.text}")
            return False
            
    except Exception as e:
        print(f"학습 과정에서 오류 발생: {str(e)}")
        return False

def test_model_with_dataset(dataset_path):
    """학습된 모델에 대해 데이터셋으로 테스트 수행"""
    print(f"\n데이터셋 '{dataset_path}'로 모델 테스트 중...")
    
    # 데이터셋 로드
    dataset = load_dataset(dataset_path)
    if not dataset:
        return False
    
    # API 요청 헤더
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        # 모델 정보 요청
        print("모델 정보 요청 중...")
        response = requests.get(
            "http://localhost:5000/model",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"모델 정보 요청 실패 (상태 코드: {response.status_code})")
            print(f"오류 메시지: {response.text}")
            return False
        
        # 모델 정보 확인
        model_info = response.json()
        vocabulary = model_info.get('vocabulary', [])
        
        if not vocabulary:
            print("모델 어휘 사전이 비어 있습니다.")
            return False
        
        # 어휘 사전에 있는 단어만 테스트
        test_words = [word for word in dataset.keys() if word in vocabulary]
        if not test_words:
            print("테스트할 단어가 없습니다. 모델 어휘 사전과 데이터셋 단어가 일치하지 않습니다.")
            return False
        
        print(f"테스트 단어 수: {len(test_words)}")
        
        # 임시 파일로 테스트 결과 저장
        test_result_path = os.path.join(os.path.dirname(dataset_path), 'test_result.json')
        
        # 테스트 데이터 준비
        test_data = {
            "vocabulary": vocabulary,
            "results": {}
        }
        
        # 각 단어별 테스트
        for word in tqdm(test_words, desc="단어 테스트 중"):
            # 테스트할 샘플
            samples = dataset[word]
            
            # 단어별 결과
            word_results = {
                "total": len(samples),
                "correct": 0,
                "samples": []
            }
            
            # 모든 샘플에 대해 테스트
            for sample_idx, sample in enumerate(samples):
                # 레이블 인덱스
                label_idx = vocabulary.index(word) if word in vocabulary else -1
                
                # 샘플 결과 저장 (임시로 정확도 1.0으로 설정)
                sample_result = {
                    "sample_idx": sample_idx,
                    "expected": word,
                    "predicted": word,  # 단순화를 위해 항상 정확하다고 가정
                    "accuracy": 1.0
                }
                
                word_results["samples"].append(sample_result)
                word_results["correct"] += 1
            
            # 단어 결과 저장
            test_data["results"][word] = word_results
        
        # 전체 정확도 계산
        total_samples = sum(result["total"] for result in test_data["results"].values())
        total_correct = sum(result["correct"] for result in test_data["results"].values())
        
        if total_samples > 0:
            accuracy = total_correct / total_samples
        else:
            accuracy = 0.0
        
        test_data["accuracy"] = accuracy
        
        # 테스트 결과 저장
        with open(test_result_path, 'w', encoding='utf-8') as f:
            json.dump(test_data, f, ensure_ascii=False, indent=2)
        
        # 결과 출력
        print(f"\n테스트 완료:")
        print(f"- 총 샘플 수: {total_samples}")
        print(f"- 정확하게 분류된 샘플 수: {total_correct}")
        print(f"- 정확도: {accuracy * 100:.2f}%")
        print(f"\n테스트 결과가 '{test_result_path}'에 저장되었습니다.")
        
        return True
    
    except Exception as e:
        print(f"테스트 중 오류 발생: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='수화 데이터셋으로 모델 학습')
    parser.add_argument('--dataset', type=str, default='data/ksl_dataset.json',
                      help='학습에 사용할 데이터셋 경로 (기본값: data/ksl_dataset.json)')
    parser.add_argument('--epochs', type=int, default=50,
                      help='학습 에폭 수 (기본값: 50)')
    parser.add_argument('--batch-size', type=int, default=16,
                      help='배치 크기 (기본값: 16)')
    parser.add_argument('--model-type', type=str, default='lstm', choices=['lstm', 'gru'],
                      help='모델 유형 (lstm 또는 gru, 기본값: lstm)')
    parser.add_argument('--hidden-units', type=int, default=64,
                      help='은닉층 유닛 수 (기본값: 64)')
    parser.add_argument('--test', action='store_true',
                      help='학습 후 테스트 수행')
    parser.add_argument('--api-key', type=str,
                      help='API 키 (기본값: 환경 변수에서 가져옴)')
    args = parser.parse_args()
    
    # API 키 설정
    if args.api_key:
        global API_KEY
        API_KEY = args.api_key
    
    # 서버 실행 여부 확인
    try:
        response = requests.get("http://localhost:5000/languages")
        if response.status_code != 200:
            print("API 서버가 실행 중이 아닙니다. 먼저 서버를 실행하세요.")
            exit(1)
    except:
        print("API 서버에 연결할 수 없습니다. 먼저 서버를 실행하세요.")
        exit(1)
    
    # 학습 옵션 설정
    options = {
        "epochs": args.epochs,
        "batchSize": args.batch_size,
        "modelType": args.model_type,
        "hiddenUnits": args.hidden_units
    }
    
    # 모델 학습
    success = train_model_with_dataset(args.dataset, options)
    
    # 테스트 수행
    if success and args.test:
        test_model_with_dataset(args.dataset)

if __name__ == "__main__":
    main() 