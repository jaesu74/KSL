from flask import Blueprint, request, jsonify
import os
import jwt
import datetime
import pymongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)

# MongoDB 연결
def get_db():
    mongo_user = os.getenv('MONGO_USER', '')
    mongo_password = os.getenv('MONGO_PASSWORD', '')
    mongo_host = os.getenv('MONGO_HOST', 'localhost')
    mongo_port = os.getenv('MONGO_PORT', '27017')
    
    if mongo_user and mongo_password:
        uri = f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/"
    else:
        uri = f"mongodb://{mongo_host}:{mongo_port}/"
        
    client = pymongo.MongoClient(uri)
    return client.sueorang_db

# JWT 비밀키
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'supersecretkey')

# 회원가입
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    if not data:
        return jsonify({'message': '데이터가 없습니다.'}), 400
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    gender = data.get('gender', 'female')  # 기본값 여성
    
    if not email or not password or not name:
        return jsonify({'message': '필수 항목이 누락되었습니다.'}), 400
    
    # 이메일 중복 확인
    db = get_db()
    if db.users.find_one({'email': email}):
        return jsonify({'message': '이미 사용 중인 이메일입니다.'}), 400
    
    # 비밀번호 해시화
    hashed_password = generate_password_hash(password)
    
    # 사용자 정보 저장
    user_id = db.users.insert_one({
        'email': email,
        'password': hashed_password,
        'name': name,
        'gender': gender,
        'created_at': datetime.datetime.now(),
        'updated_at': datetime.datetime.now()
    }).inserted_id
    
    return jsonify({
        'success': True,
        'message': '회원가입이 완료되었습니다.',
        'user_id': str(user_id)
    }), 201

# 로그인
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not data:
        return jsonify({'message': '데이터가 없습니다.'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': '이메일과 비밀번호를 입력해주세요.'}), 400
    
    # 사용자 확인
    db = get_db()
    user = db.users.find_one({'email': email})
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': '이메일 또는 비밀번호가 올바르지 않습니다.'}), 401
    
    # JWT 토큰 생성 (유효기간 7일)
    token = jwt.encode({
        'user_id': str(user['_id']),
        'email': user['email'],
        'exp': datetime.datetime.now() + datetime.timedelta(days=7)
    }, SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'gender': user['gender']
        }
    }), 200

# 현재 사용자 정보 조회
@auth_bp.route('/me', methods=['GET'])
def get_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'message': '인증 토큰이 필요합니다.'}), 401
    
    try:
        # 토큰 검증
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        
        db = get_db()
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'message': '사용자를 찾을 수 없습니다.'}), 404
        
        return jsonify({
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user['name'],
                'gender': user['gender']
            }
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': '만료된 토큰입니다.'}), 401
    except (jwt.InvalidTokenError, Exception) as e:
        return jsonify({'message': f'유효하지 않은 토큰입니다: {str(e)}'}), 401

# 인증 미들웨어 (다른 파일에서 사용)
def token_required(f):
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'message': '인증 토큰이 필요합니다.'}), 401
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user_id = payload['user_id']
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'message': '만료된 토큰입니다.'}), 401
        except (jwt.InvalidTokenError, Exception) as e:
            return jsonify({'message': f'유효하지 않은 토큰입니다: {str(e)}'}), 401
            
    return decorated 