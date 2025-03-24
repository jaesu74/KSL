// API 엔드포인트 설정

// 개발 환경
export const DEV_API_URL = 'http://localhost:5000';

// 프로덕션 환경
export const PROD_API_URL = 'https://api.sueorang.com';

// 현재 사용할 API URL
export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// API 엔드포인트
export const API_ENDPOINTS = {
  translate: '/api/translate',
  health: '/api/health',
};

// API 호출 타임아웃 (밀리초)
export const API_TIMEOUT = 10000; 