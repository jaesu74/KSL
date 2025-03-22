import os
import json
import requests
import argparse
import time
import numpy as np
from tqdm import tqdm

class AIHubCollector:
    """AI Hub에서 한국어 수화 데이터를 수집하는 클래스"""
    
    def __init__(self, api_key=None, output_path="data/aihub_ksl_dataset.json"):
        self.api_key = api_key or os.environ.get('AIHUB_API_KEY')
        if not self.api_key:
            raise ValueError("AI Hub API 키가 필요합니다. 환경 변수 AIHUB_API_KEY를 설정하거나 생성자에 전달하세요.")
        
        self.output_path = output_path
        self.base_url = "https://api.aihub.or.kr/api/ksl"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # 데이터셋 디렉토리 생성
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
    
    def search_datasets(self, query=None, category=None, limit=10):
        """
        AI Hub에서 수화 데이터셋 검색
        
        Args:
            query: 검색 키워드
            category: 카테고리 ID
            limit: 최대 검색 결과 수
        
        Returns:
            검색 결과 목록
        """
        endpoint = f"{self.base_url}/datasets/search"
        params = {
            "limit": limit
        }
        
        if query:
            params["query"] = query
        
        if category:
            params["category"] = category
        
        response = requests.get(
            endpoint,
            headers=self.headers,
            params=params
        )
        
        if response.status_code == 200:
            return response.json().get("datasets", [])
        else:
            print(f"데이터셋 검색 실패 (상태 코드: {response.status_code})")
            print(f"응답: {response.text}")
            return []
    
    def get_dataset_info(self, dataset_id):
        """
        특정 데이터셋의 상세 정보 조회
        
        Args:
            dataset_id: 데이터셋 ID
        
        Returns:
            데이터셋 상세 정보
        """
        endpoint = f"{self.base_url}/datasets/{dataset_id}"
        
        response = requests.get(
            endpoint,
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"데이터셋 정보 조회 실패 (상태 코드: {response.status_code})")
            print(f"응답: {response.text}")
            return None
    
    def get_sign_categories(self):
        """
        수화 카테고리 목록 조회
        
        Returns:
            카테고리 목록
        """
        endpoint = f"{self.base_url}/categories"
        
        response = requests.get(
            endpoint,
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json().get("categories", [])
        else:
            print(f"카테고리 목록 조회 실패 (상태 코드: {response.status_code})")
            print(f"응답: {response.text}")
            return []
    
    def get_sign_data(self, dataset_id, word=None, limit=100, offset=0):
        """
        수화 데이터 조회
        
        Args:
            dataset_id: 데이터셋 ID
            word: 특정 단어 검색 (선택사항)
            limit: 최대 반환 데이터 수
            offset: 시작 오프셋
        
        Returns:
            수화 데이터 목록
        """
        endpoint = f"{self.base_url}/datasets/{dataset_id}/signs"
        params = {
            "limit": limit,
            "offset": offset
        }
        
        if word:
            params["word"] = word
        
        response = requests.get(
            endpoint,
            headers=self.headers,
            params=params
        )
        
        if response.status_code == 200:
            return response.json().get("signs", [])
        else:
            print(f"수화 데이터 조회 실패 (상태 코드: {response.status_code})")
            print(f"응답: {response.text}")
            return []
    
    def download_sign_landmark(self, sign_id):
        """
        수화 랜드마크 데이터 다운로드
        
        Args:
            sign_id: 수화 데이터 ID
        
        Returns:
            랜드마크 데이터
        """
        endpoint = f"{self.base_url}/signs/{sign_id}/landmarks"
        
        response = requests.get(
            endpoint,
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json().get("landmarks", [])
        else:
            print(f"랜드마크 데이터 다운로드 실패 (상태 코드: {response.status_code})")
            print(f"응답: {response.text}")
            return []
    
    def collect_dataset(self, words=None, dataset_id=None, samples_per_word=5, max_words=20):
        """
        여러 단어에 대한 수화 데이터셋 수집
        
        Args:
            words: 수집할 단어 목록 (기본값: 자주 사용되는 단어 목록)
            dataset_id: 사용할 데이터셋 ID
            samples_per_word: 단어별 최대 샘플 수
            max_words: 최대 단어 수
        
        Returns:
            수집된 데이터셋
        """
        # 기본 단어 목록
        if not words:
            words = [
                "안녕하세요", "감사합니다", "미안합니다", "이름", 
                "만나서 반갑습니다", "도움이 필요합니다", "예", "아니오", 
                "괜찮습니다", "사랑합니다", "어디", "언제", "누구", 
                "무엇", "왜", "어떻게", "학교", "집", "병원", "식당"
            ]
        
        # 최대 단어 수 제한
        if len(words) > max_words:
            print(f"단어 수를 {max_words}개로 제한합니다.")
            words = words[:max_words]
        
        # 데이터셋 ID가 없는 경우 검색
        if not dataset_id:
            print("사용 가능한 수화 데이터셋을 검색합니다...")
            datasets = self.search_datasets(query="수화", limit=5)
            
            if not datasets:
                print("사용 가능한 데이터셋을 찾을 수 없습니다.")
                return None
            
            dataset_id = datasets[0]["id"]
            print(f"데이터셋 ID: {dataset_id} ({datasets[0]['name']})을 사용합니다.")
        
        # 결과 데이터셋 초기화
        dataset = {word: [] for word in words}
        
        # 각 단어별로 데이터 수집
        print(f"{len(words)}개 단어에 대한 수화 데이터를 수집합니다...")
        
        for word in tqdm(words, desc="단어 처리 중"):
            signs = self.get_sign_data(dataset_id, word=word, limit=samples_per_word)
            
            if not signs:
                print(f"'{word}'에 대한 수화 데이터를 찾을 수 없습니다.")
                continue
            
            word_samples = []
            
            for sign in tqdm(signs, desc=f"'{word}' 샘플 처리 중", leave=False):
                sign_id = sign["id"]
                landmarks = self.download_sign_landmark(sign_id)
                
                if not landmarks:
                    print(f"'{word}'의 랜드마크 데이터를 다운로드할 수 없습니다.")
                    continue
                
                # 랜드마크 데이터를 모델 입력 형식으로 변환
                # (일반적으로 시퀀스 데이터를 2D 리스트로 변환)
                sequence = self.process_landmarks(landmarks)
                word_samples.append(sequence)
                
                # API 호출 간 간격
                time.sleep(0.5)
            
            dataset[word] = word_samples
            print(f"'{word}' 단어에 대해 {len(word_samples)}개 샘플을 수집했습니다.")
        
        # 샘플이 없는 단어 제거
        empty_words = [word for word, samples in dataset.items() if not samples]
        for word in empty_words:
            del dataset[word]
        
        # 데이터셋 저장
        self.save_dataset(dataset)
        
        return dataset
    
    def process_landmarks(self, landmarks):
        """
        랜드마크 데이터를 모델 입력 형식으로 변환
        
        Args:
            landmarks: API에서 받은 랜드마크 데이터
        
        Returns:
            처리된 시퀀스 데이터
        """
        # 참고: 실제 AI Hub API의 응답 형식에 맞게 코드를 수정해야 함
        # 여기서는 가상의 데이터 형식을 가정하고 처리합니다.
        
        sequence = []
        
        try:
            for frame in landmarks:
                frame_data = []
                
                # 왼손 랜드마크 처리 (21개 x 3차원)
                left_hand = frame.get("leftHand", [])
                if left_hand:
                    for point in left_hand:
                        frame_data.extend([point["x"], point["y"], point["z"]])
                else:
                    frame_data.extend([0.0] * 21 * 3)
                
                # 오른손 랜드마크 처리 (21개 x 3차원)
                right_hand = frame.get("rightHand", [])
                if right_hand:
                    for point in right_hand:
                        frame_data.extend([point["x"], point["y"], point["z"]])
                else:
                    frame_data.extend([0.0] * 21 * 3)
                
                # 포즈 랜드마크 처리 (33개 x 3차원)
                pose = frame.get("pose", [])
                if pose:
                    for point in pose:
                        frame_data.extend([point["x"], point["y"], point["z"]])
                else:
                    frame_data.extend([0.0] * 33 * 3)
                
                sequence.append(frame_data)
        except Exception as e:
            print(f"랜드마크 처리 중 오류 발생: {str(e)}")
            return []
        
        return sequence
    
    def save_dataset(self, dataset):
        """
        데이터셋을 파일에 저장
        
        Args:
            dataset: 저장할 데이터셋
        
        Returns:
            성공 여부
        """
        try:
            with open(self.output_path, 'w', encoding='utf-8') as f:
                json.dump(dataset, f, ensure_ascii=False, indent=2)
            
            print(f"데이터셋이 '{self.output_path}'에 저장되었습니다.")
            return True
        except Exception as e:
            print(f"데이터셋 저장 중 오류 발생: {str(e)}")
            return False
    
    def load_dataset(self):
        """
        저장된 데이터셋 로드
        
        Returns:
            로드된 데이터셋
        """
        if not os.path.exists(self.output_path):
            print(f"데이터셋 파일 '{self.output_path}'이 존재하지 않습니다.")
            return None
        
        try:
            with open(self.output_path, 'r', encoding='utf-8') as f:
                dataset = json.load(f)
            
            print(f"데이터셋이 '{self.output_path}'에서 로드되었습니다.")
            return dataset
        except Exception as e:
            print(f"데이터셋 로드 중 오류 발생: {str(e)}")
            return None

def simulate_aihub_data(output_path="data/aihub_ksl_dataset.json", num_words=10, samples_per_word=5):
    """
    AI Hub API가 없는 환경에서 테스트용 가상 데이터 생성
    
    Args:
        output_path: 출력 파일 경로
        num_words: 생성할 단어 수
        samples_per_word: 단어별 샘플 수
    
    Returns:
        생성된 데이터셋
    """
    # 가상 단어 목록
    words = [
        "안녕하세요", "감사합니다", "미안합니다", "이름", 
        "만나서 반갑습니다", "도움이 필요합니다", "예", "아니오", 
        "괜찮습니다", "사랑합니다", "어디", "언제", "누구", 
        "무엇", "왜", "어떻게", "학교", "집", "병원", "식당"
    ]
    
    # 단어 수 제한
    words = words[:num_words]
    
    # 가상 데이터셋 생성
    dataset = {}
    
    for word in words:
        samples = []
        
        for _ in range(samples_per_word):
            # 시퀀스 길이 (프레임 수)
            sequence_length = np.random.randint(25, 35)
            
            # 특성 수 (랜드마크 좌표)
            feature_count = 159  # 왼손(21*3) + 오른손(21*3) + 포즈(33*3)
            
            # 가상 시퀀스 생성
            sequence = []
            for _ in range(sequence_length):
                # 각 프레임의 랜드마크 데이터
                frame_data = list(np.random.uniform(-1, 1, feature_count))
                sequence.append(frame_data)
            
            samples.append(sequence)
        
        dataset[word] = samples
    
    # 데이터셋 저장
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)
        
        print(f"가상 데이터셋이 '{output_path}'에 저장되었습니다.")
    except Exception as e:
        print(f"데이터셋 저장 중 오류 발생: {str(e)}")
    
    return dataset

def main():
    parser = argparse.ArgumentParser(description='AI Hub에서 한국어 수화 데이터셋 수집')
    parser.add_argument('--api-key', type=str, help='AI Hub API 키')
    parser.add_argument('--output', type=str, default='data/aihub_ksl_dataset.json',
                      help='데이터셋 저장 경로 (기본값: data/aihub_ksl_dataset.json)')
    parser.add_argument('--dataset-id', type=str, help='수집할 데이터셋 ID')
    parser.add_argument('--words', type=str, nargs='+', help='수집할 단어 목록')
    parser.add_argument('--samples', type=int, default=5,
                      help='단어별 최대 샘플 수 (기본값: 5)')
    parser.add_argument('--max-words', type=int, default=20,
                      help='최대 단어 수 (기본값: 20)')
    parser.add_argument('--simulate', action='store_true',
                      help='AI Hub API 없이 가상 데이터 생성')
    args = parser.parse_args()
    
    if args.simulate:
        print("가상 데이터를 생성합니다. 실제 API 요청을 수행하지 않습니다.")
        dataset = simulate_aihub_data(
            output_path=args.output,
            num_words=args.max_words,
            samples_per_word=args.samples
        )
    else:
        try:
            collector = AIHubCollector(api_key=args.api_key, output_path=args.output)
            dataset = collector.collect_dataset(
                words=args.words,
                dataset_id=args.dataset_id,
                samples_per_word=args.samples,
                max_words=args.max_words
            )
        except ValueError as e:
            print(f"오류: {str(e)}")
            print("가상 데이터로 대체합니다...")
            dataset = simulate_aihub_data(
                output_path=args.output,
                num_words=args.max_words,
                samples_per_word=args.samples
            )
    
    # 데이터셋 통계 출력
    if dataset:
        total_samples = sum(len(samples) for samples in dataset.values())
        print("\n데이터셋 통계:")
        print(f"- 단어 수: {len(dataset)}")
        print(f"- 총 샘플 수: {total_samples}")
        print(f"- 단어별 샘플 수:")
        for word, samples in sorted(dataset.items()):
            print(f"  - {word}: {len(samples)}개")

if __name__ == "__main__":
    main() 