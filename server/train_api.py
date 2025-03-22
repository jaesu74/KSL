import os
import json
import time
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS

# 환경 변수 설정
MODEL_DIR = os.environ.get('MODEL_DIR', './models')
API_KEYS = os.environ.get('API_KEYS', '').split(',')
PORT = int(os.environ.get('PORT', 5000))

# 모델 저장 디렉토리 생성
os.makedirs(MODEL_DIR, exist_ok=True)

# Flask 앱 초기화
app = Flask(__name__)
CORS(app)  # CORS 활성화 (크로스 도메인 요청 허용)

# 인증 함수
def authenticate(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    
    token = auth_header.split(' ')[1]
    if not API_KEYS or token in API_KEYS:
        return True
    
    return False

# 모델 생성 함수
def build_model(config):
    sequence_length = config.get('sequenceLength', 30)
    input_features = config.get('inputFeatures', 126)
    vocab_size = config.get('vocabSize', 10)
    model_type = config.get('modelType', 'lstm').lower()
    hidden_units = config.get('hiddenUnits', 64)
    
    # 입력 계층
    inputs = tf.keras.layers.Input(shape=(sequence_length, input_features))
    
    # 시퀀스 처리 계층
    if model_type == 'lstm':
        x = tf.keras.layers.LSTM(hidden_units, return_sequences=True)(inputs)
        x = tf.keras.layers.LSTM(hidden_units)(x)
    elif model_type == 'gru':
        x = tf.keras.layers.GRU(hidden_units, return_sequences=True)(inputs)
        x = tf.keras.layers.GRU(hidden_units)(x)
    else:
        raise ValueError(f"지원하지 않는 모델 타입: {model_type}")
    
    # 드롭아웃 적용
    x = tf.keras.layers.Dropout(0.2)(x)
    
    # 출력 계층
    outputs = tf.keras.layers.Dense(vocab_size, activation='softmax')(x)
    
    # 모델 컴파일
    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

# 데이터 준비 함수
def prepare_data(dataset, options):
    sequence_length = options.get('sequenceLength', 30)
    labels = list(dataset.keys())
    vocab_size = len(labels) + 1  # <UNK> 토큰 포함
    
    # 샘플 수 계산
    samples = []
    for label in labels:
        samples.extend(dataset[label])
    
    total_samples = len(samples)
    
    # 첫 번째 샘플로 특성 차원 계산
    feature_dim = len(samples[0][0])
    
    # 입력 데이터 준비
    X = np.zeros((total_samples, sequence_length, feature_dim))
    y = np.zeros((total_samples, vocab_size))
    
    # 데이터 처리
    sample_idx = 0
    for label_idx, label in enumerate(labels):
        sequences = dataset[label]
        for sequence in sequences:
            # 시퀀스 길이 조정
            padded_sequence = sequence.copy()
            if len(padded_sequence) > sequence_length:
                padded_sequence = padded_sequence[-sequence_length:]
            
            # 패딩 추가
            while len(padded_sequence) < sequence_length:
                padded_sequence.append([0.0] * feature_dim)
            
            # 데이터 설정
            X[sample_idx] = padded_sequence
            y[sample_idx, label_idx + 1] = 1.0  # 첫 번째 인덱스는 <UNK>
            
            sample_idx += 1
    
    return X, y, labels

# 어휘 사전 저장 함수
def save_vocabulary(labels):
    vocab_path = os.path.join(MODEL_DIR, 'vocabulary.json')
    with open(vocab_path, 'w', encoding='utf-8') as f:
        json.dump(labels, f, ensure_ascii=False)

# 모델 버전 파일 업데이트 함수
def update_model_version():
    version_path = os.path.join(MODEL_DIR, 'version.txt')
    version = int(time.time())
    with open(version_path, 'w') as f:
        f.write(str(version))
    return version

# 가장 최근 모델 버전 확인 함수
def get_latest_model_version():
    version_path = os.path.join(MODEL_DIR, 'version.txt')
    if not os.path.exists(version_path):
        return None
    
    with open(version_path, 'r') as f:
        version = f.read().strip()
    
    return version

# 모델 학습 API 엔드포인트
@app.route('/train', methods=['POST'])
def train_model():
    # 인증 확인
    if API_KEYS and not authenticate(request):
        return jsonify({'error': '인증 실패'}), 401
    
    try:
        # 요청 데이터 파싱
        data = request.json
        dataset = data.get('dataset', {})
        options = data.get('options', {})
        
        # 데이터셋 검증
        if not dataset or len(dataset) < 2:
            return jsonify({'error': '최소 2개 이상의 레이블이 필요합니다'}), 400
        
        # 데이터 준비
        X, y, labels = prepare_data(dataset, options)
        
        # 모델 설정 업데이트
        options['vocabSize'] = len(labels) + 1
        
        # 모델 빌드
        model = build_model(options)
        
        # 콜백 설정
        callbacks = [
            tf.keras.callbacks.EarlyStopping(
                monitor='val_accuracy', 
                patience=5, 
                restore_best_weights=True
            )
        ]
        
        # 모델 학습
        history = model.fit(
            X, y, 
            epochs=options.get('epochs', 50),
            batch_size=options.get('batchSize', 16),
            validation_split=options.get('validationSplit', 0.2),
            callbacks=callbacks,
            verbose=1
        )
        
        # 모델 저장
        model_path = os.path.join(MODEL_DIR, 'model')
        model.save(model_path)
        
        # 어휘 사전 저장
        save_vocabulary(labels)
        
        # 버전 업데이트
        version = update_model_version()
        
        # 학습 결과
        accuracy = float(history.history['accuracy'][-1])
        val_accuracy = float(history.history['val_accuracy'][-1])
        
        return jsonify({
            'success': True,
            'version': version,
            'accuracy': accuracy,
            'val_accuracy': val_accuracy,
            'vocabulary': labels,
            'samples': len(X)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 모델 다운로드 API 엔드포인트
@app.route('/model', methods=['GET'])
def get_model():
    # 인증 확인
    if API_KEYS and not authenticate(request):
        return jsonify({'error': '인증 실패'}), 401
    
    try:
        # 모델 파일 확인
        model_path = os.path.join(MODEL_DIR, 'model')
        vocab_path = os.path.join(MODEL_DIR, 'vocabulary.json')
        
        if not os.path.exists(model_path) or not os.path.exists(vocab_path):
            return jsonify({'error': '사용 가능한 모델이 없습니다'}), 404
        
        # 모델 로드
        model = tf.keras.models.load_model(model_path)
        
        # 모델 가중치 추출
        weights = model.get_weights()
        
        # 어휘 사전 로드
        with open(vocab_path, 'r', encoding='utf-8') as f:
            vocabulary = json.load(f)
        
        # 모델 구성 정보
        model_info = {
            'input_shape': model.input_shape,
            'output_shape': model.output_shape,
            'layers': [layer.name for layer in model.layers]
        }
        
        return jsonify({
            'success': True,
            'version': get_latest_model_version(),
            'modelInfo': model_info,
            'vocabulary': vocabulary,
            'modelWeights': weights
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 모델 버전 확인 API 엔드포인트
@app.route('/model/version', methods=['GET'])
def get_model_version():
    # 인증 확인
    if API_KEYS and not authenticate(request):
        return jsonify({'error': '인증 실패'}), 401
    
    version = get_latest_model_version()
    if not version:
        return jsonify({'error': '모델 버전 정보가 없습니다'}), 404
    
    return jsonify({
        'success': True,
        'version': version
    })

# 지원 언어 목록 API 엔드포인트
@app.route('/languages', methods=['GET'])
def get_languages():
    return jsonify({
        'success': True,
        'languages': ['ko', 'en']  # 한국어, 영어 지원
    })

# 메인 함수
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=False) 