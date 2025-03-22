import os
import json
import numpy as np
import tensorflow as tf
import random
from sample_dataset import generate_sample_dataset

def load_model_and_vocabulary():
    """
    저장된 모델과 어휘 사전을 로드합니다.
    """
    model_path = os.path.join('models', 'model')
    vocab_path = os.path.join('models', 'vocabulary.json')
    
    # 모델과 어휘 사전 존재 여부 확인
    if not os.path.exists(model_path) or not os.path.exists(vocab_path):
        print("오류: 학습된 모델 또는 어휘 사전을 찾을 수 없습니다.")
        print("먼저 'train_sample_model.py'를 실행하여 모델을 학습하세요.")
        return None, None
    
    # 모델 로드
    try:
        model = tf.keras.models.load_model(model_path)
        print("모델 로드 성공!")
    except Exception as e:
        print(f"모델 로드 실패: {str(e)}")
        return None, None
    
    # 어휘 사전 로드
    try:
        with open(vocab_path, 'r', encoding='utf-8') as f:
            vocabulary = json.load(f)
        print(f"어휘 사전 로드 성공! ({len(vocabulary)} 단어)")
    except Exception as e:
        print(f"어휘 사전 로드 실패: {str(e)}")
        return model, None
    
    return model, vocabulary

def predict_sign_language(model, vocabulary, sample_data, test_samples=5):
    """
    학습된 모델을 사용해 수화 제스처를 한국어로 번역합니다.
    """
    if not model or not vocabulary:
        return False
    
    # 첫 번째 인덱스는 <UNK> 토큰
    vocab_with_unk = ['<UNK>'] + vocabulary
    
    print("\n수화 제스처 테스트 시작:")
    print("-" * 50)
    
    correct_count = 0
    
    # 무작위 샘플 선택
    test_words = random.sample(vocabulary, min(len(vocabulary), test_samples))
    
    for word in test_words:
        # 단어에 대한 샘플 가져오기
        samples = sample_data[word]
        test_sequence = random.choice(samples)
        
        # 모델 입력을 위한 전처리
        sequence_length = model.input_shape[1]
        feature_dim = model.input_shape[2]
        
        # 시퀀스 길이 조정
        padded_sequence = test_sequence.copy()
        if len(padded_sequence) > sequence_length:
            padded_sequence = padded_sequence[-sequence_length:]
        
        # 패딩 추가
        while len(padded_sequence) < sequence_length:
            padded_sequence.append([0.0] * feature_dim)
        
        # 모델 예측
        input_tensor = np.array([padded_sequence])
        prediction = model.predict(input_tensor, verbose=0)
        
        # 예측 결과 해석
        predicted_idx = np.argmax(prediction[0])
        predicted_word = vocab_with_unk[predicted_idx] if predicted_idx < len(vocab_with_unk) else '<UNK>'
        
        # 결과 출력
        is_correct = predicted_word == word
        if is_correct:
            correct_count += 1
        
        status = "✓" if is_correct else "✗"
        print(f"{status} 실제: '{word}', 예측: '{predicted_word}'")
    
    # 정확도 계산
    accuracy = correct_count / len(test_words) * 100
    print("-" * 50)
    print(f"테스트 정확도: {accuracy:.2f}% ({correct_count}/{len(test_words)})")
    
    return True

def run_inference_test():
    """
    모델 추론 테스트를 실행합니다.
    """
    print("KSL 번역 모델 테스트 시작")
    print("=" * 50)
    
    # 모델 및 어휘 사전 로드
    model, vocabulary = load_model_and_vocabulary()
    
    if not model or not vocabulary:
        return False
    
    # 테스트용 샘플 데이터셋 생성 (임시)
    sample_data = generate_sample_dataset('data/test_dataset.json')
    
    # 수화 인식 테스트
    success = predict_sign_language(model, vocabulary, sample_data)
    
    return success

if __name__ == "__main__":
    run_inference_test() 