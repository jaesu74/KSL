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
from urllib.parse import quote_plus

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)
CORS(app)

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
    try:
        if os.path.exists(model_path):
            model = tf.keras.models.load_model(model_path)
            return model
        else:
            print(f"모델 파일이 존재하지 않습니다: {model_path}")
            return None
    except Exception as e:
        print(f"모델 로드 오류: {e}")
        return None

# 수어 인식 함수
def process_sign_language(frame_data):
    # Base64 디코딩 및 이미지 변환
    try:
        img_data = base64.b64decode(frame_data.split(',')[1])
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # MediaPipe를 사용한 손 랜드마크 추출
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            landmarks = []
            for hand_landmarks in results.multi_hand_landmarks:
                # 각 랜드마크의 x, y, z 좌표 추출
                for landmark in hand_landmarks.landmark:
                    landmarks.append([landmark.x, landmark.y, landmark.z])
                
            # 여기서 모델을 사용하여 예측 진행
            # 실제 구현은 모델에 따라 다를 수 있음
            model = load_model()
            if model:
                # 예시: 랜드마크를 모델 입력 형태로 변환
                landmarks_array = np.array(landmarks).flatten().reshape(1, -1)
                # 실제로는 모델에 맞게 입력 형태를 조정해야 함
                prediction = model.predict(landmarks_array)
                predicted_class = np.argmax(prediction, axis=1)[0]
                
                # 예측 결과를 문자열로 변환
                # 실제로는 클래스 인덱스에 해당하는 수어 단어를 반환해야 함
                return {"predicted_word": f"수어_{predicted_class}"}
            else:
                return {"error": "모델을 로드할 수 없습니다."}
        else:
            return {"error": "손 랜드마크를 감지할 수 없습니다."}
    except Exception as e:
        return {"error": f"처리 중 오류 발생: {str(e)}"}

@app.route('/api/translate', methods=['POST'])
def translate_sign():
    if 'frame' not in request.json:
        return jsonify({"error": "프레임 데이터가 없습니다."}), 400
    
    frame_data = request.json['frame']
    result = process_sign_language(frame_data)
    
    return jsonify(result)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False) 