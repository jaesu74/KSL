import os
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import pymongo
import json
import base64
import pickle
from urllib.parse import quote_plus
import sys

# models 디렉토리를 PATH에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)
CORS(app)

# 데이터 경로 설정
DATA_PATH = os.getenv('DATA_PATH', os.path.join(os.path.dirname(__file__), 'data', 'sign_data'))
ANNOTATION_PATH = os.getenv('ANNOTATION_PATH', os.path.join(os.path.dirname(__file__), 'data', 'annotation.xlsx'))

# 라우터 등록
from routes.auth import auth_bp
from routes.translations import translations_bp
from routes.signs import signs_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(translations_bp, url_prefix='/api/translations')
app.register_blueprint(signs_bp, url_prefix='/api/signs')

# MongoDB 연결
def get_mongodb_connection():
    try:
        mongo_user = os.getenv('MONGO_USER', '')
        mongo_password = os.getenv('MONGO_PASSWORD', '')
        mongo_host = os.getenv('MONGO_HOST', 'localhost')
        mongo_port = os.getenv('MONGO_PORT', '27017')
        
        if mongo_user and mongo_password:
            uri = f"mongodb://{quote_plus(mongo_user)}:{quote_plus(mongo_password)}@{mongo_host}:{mongo_port}/"
        else:
            uri = f"mongodb://{mongo_host}:{mongo_port}/"
            
        client = pymongo.MongoClient(uri)
        return client
    except Exception as e:
        print(f"MongoDB 연결 오류: {e}")
        return None

# MediaPipe Hands 설정
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.5
)

# 모델 로드
def load_model():
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'sign_language_model.h5')
    word_dict_path = os.path.join(os.path.dirname(__file__), 'models', 'word_dict.pickle')
    
    try:
        # 모델 파일이 존재하는지 확인
        if not os.path.exists(model_path):
            print(f"모델 파일이 존재하지 않습니다. 새 모델을 생성합니다.")
            
            # 모델 빌드 코드 import
            from models.Sonmin_DNN_model import build_sign_language_model
            model = build_sign_language_model()
            
            # 모델 저장
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            model.save(model_path)
            print(f"모델이 {model_path}에 저장되었습니다.")
            
            # 기본 단어 사전 생성
            word_dict = {
                "안녕하세요": 0,
                "감사합니다": 1,
                "반갑습니다": 2,
                "도와주세요": 3,
                "이해했습니다": 4
            }
            
            # 단어 사전 저장
            with open(word_dict_path, 'wb') as f:
                pickle.dump(word_dict, f)
            
            print(f"단어 사전이 {word_dict_path}에 저장되었습니다.")
        else:
            # 기존 모델 로드
            model = tf.keras.models.load_model(model_path)
            
            # 단어 사전 로드
            if os.path.exists(word_dict_path):
                with open(word_dict_path, 'rb') as f:
                    word_dict = pickle.load(f)
            else:
                # 기본 단어 사전 생성
                word_dict = {
                    "안녕하세요": 0,
                    "감사합니다": 1,
                    "반갑습니다": 2,
                    "도와주세요": 3,
                    "이해했습니다": 4
                }
                
                # 단어 사전 저장
                with open(word_dict_path, 'wb') as f:
                    pickle.dump(word_dict, f)
        
        return model, word_dict
    except Exception as e:
        print(f"모델 로드 오류: {e}")
        return None, None

# 이미지 시퀀스 전처리 (zero-padding)
def zero_padding_4d(img_seq, max_len, xlen=120, ylen=67):
    """
    이미지 시퀸스들 앞에 0으로 된 이미지들 padding
    텐서플로 모델에 넣기 위해서는 이미지 시퀸스의 길이를 모두 맞춰야 함
    """
    if len(img_seq) == 0:
        return np.zeros((max_len, ylen, xlen, 3))
    
    img_seq = np.array(img_seq)
    # 각 이미지 한 장의 크기
    img_shape = img_seq.shape[1:]
    # zero-padding으로 만들어야하는 이미지 개수
    img_augment_len = max_len - img_seq.shape[0]
    
    if img_augment_len <= 0:
        # 이미지가 최대 길이보다 길면 최대 길이만큼만 사용
        return img_seq[:max_len]
    
    # 해당하는 이미지의 크기를 가진 0 배열 생성
    img_zero = np.zeros((img_augment_len, *img_shape))
    img_seq = np.concatenate([img_zero, img_seq], axis=0)
    return img_seq

# 수어 인식 함수
def process_sign_language(frame_data):
    # Base64 디코딩 및 이미지 변환
    try:
        # MediaPipe를 사용한 손 랜드마크 추출
        img_data = base64.b64decode(frame_data.split(',')[1])
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 이미지를 RGB로 변환
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            # 손 랜드마크 시각화를 위한 이미지 복사
            annotated_frame = frame.copy()
            
            # 손 랜드마크 그리기
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    annotated_frame,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS
                )
            
            # 이미지 전처리 (120x67 크기로 리사이즈)
            resized_frame = cv2.resize(frame, (120, 67))
            
            # 시퀀스를 위한 배열 초기화
            img_seq = []
            
            # 현재 프레임 추가
            img_seq.append(resized_frame)
            
            # 모델 및 단어 사전 로드
            model, word_dict = load_model()
            
            if model is None or word_dict is None:
                # MediaPipe 기반의 간단한 손 제스처 인식
                # 손가락 끝 랜드마크 인덱스
                FINGER_TIPS = [mp_hands.HandLandmark.THUMB_TIP, mp_hands.HandLandmark.INDEX_FINGER_TIP,
                              mp_hands.HandLandmark.MIDDLE_FINGER_TIP, mp_hands.HandLandmark.RING_FINGER_TIP,
                              mp_hands.HandLandmark.PINKY_TIP]
                
                # 손가락 중간 랜드마크 인덱스
                FINGER_MID = [mp_hands.HandLandmark.THUMB_IP, mp_hands.HandLandmark.INDEX_FINGER_PIP,
                             mp_hands.HandLandmark.MIDDLE_FINGER_PIP, mp_hands.HandLandmark.RING_FINGER_PIP,
                             mp_hands.HandLandmark.PINKY_PIP]
                
                # 손바닥 기준점
                palm = results.multi_hand_landmarks[0].landmark[mp_hands.HandLandmark.WRIST]
                
                # 각 손가락이 펴져 있는지 확인
                is_open = []
                for i in range(5):
                    tip = results.multi_hand_landmarks[0].landmark[FINGER_TIPS[i]]
                    mid = results.multi_hand_landmarks[0].landmark[FINGER_MID[i]]
                    
                    # 손가락 끝이 손바닥보다 위에 있으면 펴진 것으로 간주
                    if tip.y < palm.y:
                        is_open.append(True)
                    else:
                        # 엄지는 다른 방향으로 확인
                        if i == 0:  # 엄지
                            if tip.x < mid.x:  # 왼손일 경우
                                is_open.append(True)
                            else:
                                is_open.append(False)
                        else:
                            is_open.append(False)
                
                # 간단한 제스처 분류
                gesture = ""
                if all(is_open):
                    gesture = "손바닥 위"
                    predicted_word = "안녕하세요"
                elif not any(is_open):
                    gesture = "주먹"
                    predicted_word = "반갑습니다"
                elif is_open[1] and is_open[2] and not is_open[0] and not is_open[3] and not is_open[4]:
                    gesture = "V자"
                    predicted_word = "감사합니다"
                elif is_open[0] and not any(is_open[1:]):
                    gesture = "엄지 위"
                    predicted_word = "좋아요"
                elif is_open[1] and not any([is_open[0], is_open[2], is_open[3], is_open[4]]):
                    gesture = "손가락 지시"
                    predicted_word = "저기"
                else:
                    gesture = "알 수 없는 제스처"
                    predicted_word = "알 수 없는 수어"
                
                # 시각화 이미지를 Base64로 인코딩
                _, buffer = cv2.imencode('.jpg', annotated_frame)
                annotated_image = base64.b64encode(buffer).decode('utf-8')
                
                return {
                    "predicted_word": predicted_word,
                    "gesture": gesture,
                    "annotated_image": f"data:image/jpeg;base64,{annotated_image}",
                    "model_used": "MediaPipe 손 랜드마크 (모델 없음)"
                }
            
            # 이미지 시퀀스를 모델 입력 형태로 변환
            # 모델 학습 시 사용된 최대 시퀀스 길이에 맞게 패딩
            seq_len = 30  # 모델이 학습된 시퀀스 길이 (bigdata-3team 프로젝트 기준)
            img_seq = zero_padding_4d(img_seq, seq_len)
            
            # 모델 입력 형태로 변환
            img_seq = img_seq.reshape(1, seq_len, 67, 120, 3)
            
            # 모델 예측
            prediction = model.predict(img_seq)[0]
            
            # 예측된 인덱스를 단어로 변환
            # 단어 사전 반전 (인덱스 -> 단어)
            idx_word_dict = {v: k for k, v in word_dict.items()}
            
            # 가장 높은 확률의 클래스 인덱스 찾기
            predicted_idx = np.argmax(prediction)
            predicted_word = idx_word_dict.get(predicted_idx, "알 수 없는 수어")
            confidence = float(prediction[predicted_idx])
            
            # 시각화 이미지를 Base64로 인코딩
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            annotated_image = base64.b64encode(buffer).decode('utf-8')
            
            return {
                "predicted_word": predicted_word,
                "confidence": confidence,
                "annotated_image": f"data:image/jpeg;base64,{annotated_image}",
                "model_used": "CNN+LSTM 기반 딥러닝 모델"
            }
        else:
            return {
                "error": "손 랜드마크를 찾을 수 없습니다.",
                "message": "화면에 손이 보이도록 위치시켜 주세요."
            }
    except Exception as e:
        print(f"수어 처리 오류: {e}")
        return {
            "error": f"처리 중 오류가 발생했습니다: {str(e)}"
        }

# 수어 번역 API
@app.route('/api/translate', methods=['POST'])
def translate():
    try:
        data = request.json
        if not data or 'frame' not in data:
            return jsonify({
                "error": "프레임 데이터가 없습니다."
            }), 400
        
        result = process_sign_language(data['frame'])
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "error": f"요청 처리 중 오류가 발생했습니다: {str(e)}"
        }), 500

# 서버 상태 확인 API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "version": "1.0.0"
    })

# 메인 실행
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true') 