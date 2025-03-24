from flask import Blueprint, request, jsonify
import os
import datetime
import pymongo
from bson.objectid import ObjectId
from routes.auth import token_required

signs_bp = Blueprint('signs', __name__)

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

# 저장된 수어 목록 조회
@signs_bp.route('/saved', methods=['GET'])
@token_required
def get_saved_signs():
    db = get_db()
    saved_signs = list(db.saved_signs.find(
        {'user_id': request.user_id}
    ).sort('saved_at', -1))
    
    # ObjectId를 문자열로 변환
    for sign in saved_signs:
        sign['id'] = str(sign['_id'])
        del sign['_id']
        sign['translation_id'] = str(sign['translation_id'])
        sign['savedAt'] = sign['saved_at'].strftime('%Y-%m-%d')
        
        # 이미지는 너무 커서 응답에 포함시키지 않음 (필요시 별도 API 구현)
        if 'image' in sign:
            sign['has_image'] = True
            del sign['image']
    
    return jsonify({
        'signs': saved_signs
    }), 200

# 저장된 수어 상세 조회
@signs_bp.route('/saved/<sign_id>', methods=['GET'])
@token_required
def get_saved_sign_detail(sign_id):
    try:
        db = get_db()
        sign = db.saved_signs.find_one({
            '_id': ObjectId(sign_id),
            'user_id': request.user_id
        })
        
        if not sign:
            return jsonify({'message': '저장된 수어를 찾을 수 없습니다.'}), 404
        
        # ObjectId를 문자열로 변환
        sign['id'] = str(sign['_id'])
        del sign['_id']
        sign['translation_id'] = str(sign['translation_id'])
        sign['savedAt'] = sign['saved_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        return jsonify({
            'sign': sign
        }), 200
    except Exception as e:
        return jsonify({'message': f'오류가 발생했습니다: {str(e)}'}), 500

# 저장된 수어 삭제
@signs_bp.route('/saved/<sign_id>', methods=['DELETE'])
@token_required
def delete_saved_sign(sign_id):
    try:
        db = get_db()
        sign = db.saved_signs.find_one({
            '_id': ObjectId(sign_id),
            'user_id': request.user_id
        })
        
        if not sign:
            return jsonify({'message': '저장된 수어를 찾을 수 없습니다.'}), 404
        
        # 저장된 수어 삭제
        db.saved_signs.delete_one({
            '_id': ObjectId(sign_id)
        })
        
        # 번역 결과 테이블의 저장 상태도 업데이트
        if 'translation_id' in sign:
            db.translations.update_one(
                {'_id': sign['translation_id']},
                {'$set': {'is_saved': False}}
            )
        
        return jsonify({
            'message': '저장된 수어가 삭제되었습니다.'
        }), 200
    except Exception as e:
        return jsonify({'message': f'오류가 발생했습니다: {str(e)}'}), 500

# 이미지 가져오기 API
@signs_bp.route('/image/<sign_id>', methods=['GET'])
@token_required
def get_sign_image(sign_id):
    try:
        db = get_db()
        sign = db.saved_signs.find_one({
            '_id': ObjectId(sign_id),
            'user_id': request.user_id
        })
        
        if not sign or 'image' not in sign:
            return jsonify({'message': '이미지를 찾을 수 없습니다.'}), 404
        
        return jsonify({
            'image': sign['image']
        }), 200
    except Exception as e:
        return jsonify({'message': f'오류가 발생했습니다: {str(e)}'}), 500 