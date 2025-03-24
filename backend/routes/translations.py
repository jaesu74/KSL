from flask import Blueprint, request, jsonify
import os
import datetime
import pymongo
from bson.objectid import ObjectId
from routes.auth import token_required

translations_bp = Blueprint('translations', __name__)

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

# 번역 결과 저장
@translations_bp.route('', methods=['POST'])
@token_required
def save_translation():
    data = request.json
    
    if not data:
        return jsonify({'message': '데이터가 없습니다.'}), 400
    
    word = data.get('word')
    image = data.get('image')
    
    if not word:
        return jsonify({'message': '번역 결과가 없습니다.'}), 400
    
    # 번역 결과 저장
    db = get_db()
    translation_id = db.translations.insert_one({
        'user_id': request.user_id,
        'word': word,
        'image': image,
        'is_saved': False,
        'created_at': datetime.datetime.now()
    }).inserted_id
    
    return jsonify({
        'id': str(translation_id),
        'message': '번역 결과가 저장되었습니다.'
    }), 201

# 최근 번역 내역 조회
@translations_bp.route('/recent', methods=['GET'])
@token_required
def get_recent_translations():
    # 최근 20개 번역 내역 조회
    db = get_db()
    translations = list(db.translations.find(
        {'user_id': request.user_id}
    ).sort('created_at', -1).limit(20))
    
    # ObjectId를 문자열로 변환
    for t in translations:
        t['id'] = str(t['_id'])
        del t['_id']
        t['date'] = t['created_at'].strftime('%Y-%m-%d')
        t['time'] = t['created_at'].strftime('%H:%M:%S')
        # 이미지는 너무 커서 응답에 포함시키지 않음 (필요시 별도 API 구현)
        if 'image' in t:
            t['has_image'] = True
            del t['image']
    
    return jsonify({
        'translations': translations
    }), 200

# 번역 결과 저장 상태 토글
@translations_bp.route('/<translation_id>/toggle-save', methods=['POST'])
@token_required
def toggle_save_status(translation_id):
    try:
        db = get_db()
        translation = db.translations.find_one({
            '_id': ObjectId(translation_id),
            'user_id': request.user_id
        })
        
        if not translation:
            return jsonify({'message': '번역 결과를 찾을 수 없습니다.'}), 404
        
        # 저장 상태 반전
        new_status = not translation.get('is_saved', False)
        
        db.translations.update_one(
            {'_id': ObjectId(translation_id)},
            {'$set': {'is_saved': new_status}}
        )
        
        # 저장된 수어에도 추가/제거
        if new_status:
            # 이미 저장된 경우 중복 방지
            existing = db.saved_signs.find_one({
                'translation_id': ObjectId(translation_id),
                'user_id': request.user_id
            })
            
            if not existing:
                db.saved_signs.insert_one({
                    'user_id': request.user_id,
                    'translation_id': ObjectId(translation_id),
                    'word': translation['word'],
                    'image': translation.get('image'),
                    'saved_at': datetime.datetime.now()
                })
        else:
            # 저장 목록에서 제거
            db.saved_signs.delete_one({
                'translation_id': ObjectId(translation_id),
                'user_id': request.user_id
            })
        
        return jsonify({
            'is_saved': new_status,
            'message': '저장 상태가 업데이트되었습니다.'
        }), 200
    except Exception as e:
        return jsonify({'message': f'오류가 발생했습니다: {str(e)}'}), 500

# 번역 결과 삭제
@translations_bp.route('/<translation_id>', methods=['DELETE'])
@token_required
def delete_translation(translation_id):
    try:
        db = get_db()
        result = db.translations.delete_one({
            '_id': ObjectId(translation_id),
            'user_id': request.user_id
        })
        
        if result.deleted_count == 0:
            return jsonify({'message': '번역 결과를 찾을 수 없습니다.'}), 404
        
        # 저장된 수어에서도 제거
        db.saved_signs.delete_one({
            'translation_id': ObjectId(translation_id),
            'user_id': request.user_id
        })
        
        return jsonify({
            'message': '번역 결과가 삭제되었습니다.'
        }), 200
    except Exception as e:
        return jsonify({'message': f'오류가 발생했습니다: {str(e)}'}), 500 