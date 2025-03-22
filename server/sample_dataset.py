import os
import json
import numpy as np

# 샘플 수화 데이터셋 생성 함수
def generate_sample_dataset(output_path='sample_dataset.json'):
    """
    간단한 한국어 수화 데이터셋을 생성하는 함수.
    실제 데이터셋을 대체하기 위한 가상 데이터입니다.
    
    각 제스처는 30프레임으로 구성되며, 각 프레임은 159개의 특성값(x, y, z 좌표)으로 이루어집니다.
    """
    # 한국어 수화 단어 목록 (기본 표현)
    ksl_words = [
        "안녕하세요",
        "감사합니다",
        "미안합니다",
        "이름",
        "만나서 반갑습니다",
        "도움이 필요합니다",
        "예",
        "아니오",
        "괜찮습니다",
        "사랑합니다"
    ]
    
    # 가상 데이터셋 초기화
    dataset = {}
    
    # 각 단어에 대한 가상 시퀀스 생성
    for word in ksl_words:
        # 각 단어당 5개의 다른 샘플 생성
        samples = []
        for _ in range(5):
            # 30 프레임, 159개 특성(42개 랜드마크 x 3좌표 + 33개 포즈 랜드마크)
            # 실제 미디어파이프 손 랜드마크 차원과 동일하게 설정
            sequence = []
            for _ in range(30):  # 30 프레임
                # 가상 랜드마크 생성 (실제 손동작과 유사하게 가중치 적용)
                frame_data = []
                
                # 왼손 랜드마크 (21개 x 3차원)
                for i in range(21):
                    # 자연스러운 손동작 시뮬레이션을 위한 가중치 적용
                    weight = (i % 5) * 0.05  # 손가락 관절마다 다른 가중치
                    noise = np.random.normal(0, 0.02, 3)  # 자연스러운 노이즈
                    
                    # 오일러 곡선을 사용한 가상 동작 생성
                    t = i / 21.0
                    x = 0.2 + 0.1 * np.sin(t * 2 * np.pi) + weight + noise[0]
                    y = 0.5 + 0.1 * np.cos(t * 2 * np.pi) + weight + noise[1]
                    z = 0.1 * t + noise[2]
                    
                    frame_data.extend([x, y, z])
                
                # 오른손 랜드마크 (21개 x 3차원)
                for i in range(21):
                    weight = (i % 5) * 0.05
                    noise = np.random.normal(0, 0.02, 3)
                    
                    t = i / 21.0
                    x = 0.8 - 0.1 * np.sin(t * 2 * np.pi) - weight + noise[0]
                    y = 0.5 + 0.1 * np.cos(t * 2 * np.pi) + weight + noise[1]
                    z = 0.1 * t + noise[2]
                    
                    frame_data.extend([x, y, z])
                
                # 포즈 랜드마크 (33개 x 3차원, 간소화된 데이터)
                for i in range(33):
                    noise = np.random.normal(0, 0.01, 3)
                    
                    # 간단한 상체 포즈
                    t = i / 33.0
                    x = 0.5 + 0.05 * np.sin(t * np.pi) + noise[0]
                    y = 0.2 + 0.3 * t + noise[1]
                    z = 0.05 * np.cos(t * np.pi) + noise[2]
                    
                    frame_data.extend([x, y, z])
                
                sequence.append(frame_data)
            
            samples.append(sequence)
        
        # 단어별 샘플 할당
        dataset[word] = samples
    
    # 데이터셋 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    
    print(f"샘플 데이터셋이 '{output_path}'에 저장되었습니다.")
    return dataset

# 메인 함수
if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    dataset = generate_sample_dataset('data/ksl_sample_dataset.json')
    print(f"생성된 단어 수: {len(dataset)}")
    print(f"총 샘플 수: {sum(len(samples) for samples in dataset.values())}") 