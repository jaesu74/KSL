# 수화 통역사 (KSL Interpreter)

한국 수화를 실시간으로 인식하여 텍스트와 음성으로 변환해주는 모바일 앱입니다.

## 주요 기능

1. **한국 수화 인식**: 카메라로 수화를 녹화하면 인공지능이 동작을 인식하여 텍스트로 변환
2. **AI 머신러닝 활용**: TensorFlow.js를 활용한 딥러닝 모델로 정확한 수화 인식
3. **다국어 지원**: 한국어 수화(KSL)와 미국 수화(ASL)를 지원하며, 추후 다른 언어도 추가 예정
4. **사용자 설정**: 언어 선택, 인식 모드, 음성 출력 등 다양한 설정 옵션

## 기술 스택

- **프론트엔드**: React Native
- **AI/ML**: TensorFlow.js, TensorFlow Lite
- **상태 관리**: React Hooks, AsyncStorage
- **카메라 처리**: React Native Vision Camera

## 설치 및 실행 방법

### 요구 사항

- Node.js 14.0 이상
- React Native 개발 환경
- Android Studio 또는 Xcode (에뮬레이터 실행용)

### 설치

```bash
# 프로젝트 클론
git clone https://github.com/jaesu74/KSL.git
cd KSL

# 의존성 설치
npm install

# iOS 전용 의존성 설치 (macOS에서만 필요)
cd ios && pod install && cd ..
```

### 실행

```bash
# 안드로이드에서 실행
npm run android

# iOS에서 실행 (macOS에서만 가능)
npm run ios
```

## 프로젝트 구조

```
KSLInterpreter/
├── src/
│   ├── components/     # 재사용 가능한 UI 컴포넌트
│   ├── screens/        # 앱 화면 컴포넌트
│   ├── services/       # 비즈니스 로직 및 AI 관련 서비스
│   ├── navigation/     # 화면 네비게이션 설정
│   ├── utils/          # 유틸리티 함수
│   └── assets/         # 이미지, 폰트 등 정적 파일
├── android/            # 안드로이드 네이티브 코드
├── ios/                # iOS 네이티브 코드
└── ...
```

## 향후 계획

- 일본어, 중국어 등 더 많은 언어의 수화 지원
- 오프라인 모드 지원
- 수화 학습 기능 추가
- 웹 버전 개발

## 라이선스

MIT License

## 연락처

프로젝트에 관한 문의나 제안은 이슈를 등록하거나 이메일로 연락해주세요.
