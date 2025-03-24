# 클라우드 서비스 설정 가이드

이 문서는 수어 하자 앱의 백엔드 서비스를 클라우드에 배포하기 위한 설정 가이드입니다.

## MongoDB Atlas 설정

### 1. MongoDB Atlas 계정 생성

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)에 접속하여 무료 계정을 만드세요.
2. Sign Up 버튼을 클릭하고 이메일, 비밀번호를 입력하여 계정을 생성합니다.

### 2. 클러스터 생성

1. "Build a Cluster" 버튼을 클릭합니다.
2. FREE Tier 옵션을 선택합니다 (무료 티어는 512MB 스토리지를 제공합니다).
3. 클라우드 제공자 및 리전을 선택합니다 (지연 시간을 최소화하기 위해 가장 가까운 리전 선택).
4. 클러스터 이름을 입력하고 "Create Cluster" 버튼을 클릭합니다.

### 3. 데이터베이스 액세스 설정

1. 좌측 메뉴에서 "Database Access"를 클릭합니다.
2. "Add New Database User" 버튼을 클릭합니다.
3. 사용자 이름과 비밀번호를 설정하고 적절한 권한을 부여합니다 (ReadWrite 권한 추천).
4. "Add User" 버튼을 클릭하여 사용자를 생성합니다.

### 4. 네트워크 액세스 설정

1. 좌측 메뉴에서 "Network Access"를 클릭합니다.
2. "Add IP Address" 버튼을 클릭합니다.
3. "Allow Access from Anywhere"를 선택하거나 특정 IP를 입력합니다 (개발 중에는 Anywhere 선택 가능).
4. "Confirm" 버튼을 클릭하여 설정을 저장합니다.

### 5. 연결 문자열 가져오기

1. 클러스터 화면에서 "Connect" 버튼을 클릭합니다.
2. "Connect your application"을 선택합니다.
3. Driver로 "Python"을 선택하고 버전을 "3.6 or later"로 선택합니다.
4. 연결 문자열을 복사하여 백엔드 .env 파일에 설정합니다.

## Google Cloud Platform 설정

### 1. GCP 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 상단의 프로젝트 선택 드롭다운을 클릭하고 "새 프로젝트"를 선택합니다.
3. 프로젝트 이름을 입력하고 "만들기" 버튼을 클릭합니다.

### 2. 서비스 계정 생성 (GitHub Actions용)

1. 좌측 메뉴에서 "IAM 및 관리자" > "서비스 계정"을 선택합니다.
2. "서비스 계정 만들기" 버튼을 클릭합니다.
3. 서비스 계정 이름과 설명을 입력합니다 (예: "github-actions").
4. "만들기 및 계속" 버튼을 클릭합니다.
5. 역할에서 "Cloud Run Admin", "Storage Admin", "Service Account User" 역할을 추가합니다.
6. "완료" 버튼을 클릭합니다.

### 3. 서비스 계정 키 생성

1. 생성된 서비스 계정을 클릭합니다.
2. "키" 탭을 선택합니다.
3. "키 추가" > "새 키 만들기"를 클릭합니다.
4. JSON 형식을 선택하고 "만들기" 버튼을 클릭합니다.
5. 키 파일이 자동으로 다운로드됩니다. 이 파일은 안전하게 보관하세요.

### 4. GitHub Secrets 설정

GitHub Repository에 다음 보안 변수를 설정합니다:

1. `GCP_PROJECT_ID`: Google Cloud 프로젝트 ID
2. `GCP_SA_KEY`: 다운로드한 서비스 계정 키 파일의 전체 내용 (JSON)
3. `GCP_REGION`: 배포할 GCP 리전 (예: "asia-northeast3")
4. `MONGO_USER`: MongoDB 사용자 이름
5. `MONGO_PASSWORD`: MongoDB 비밀번호
6. `MONGO_HOST`: MongoDB 호스트 (예: "cluster0.mongodb.net")
7. `MONGO_PORT`: MongoDB 포트 (보통 "27017")
8. `API_URL`: 백엔드 API URL (Cloud Run 배포 후 생성된 URL)

### 5. Cloud Run API 활성화

1. [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com) 페이지로 이동합니다.
2. "사용" 버튼을 클릭하여 API를 활성화합니다.

### 6. 비용 모니터링 설정 (선택 사항)

1. 좌측 메뉴에서 "결제"를 선택합니다.
2. "결제 알림" 탭을 선택합니다.
3. "예산 및 알림 만들기"를 클릭합니다.
4. 월별 예산 금액을 설정하고 알림 임계값을 설정합니다 (예: 예산의 50%, 90%, 100%).
5. 알림을 받을 이메일 주소를 추가하고 "저장"을 클릭합니다.

## 앱 배포 프로세스

1. 코드를 GitHub 저장소에 푸시합니다.
2. GitHub Actions 워크플로우가 자동으로 실행됩니다:
   - 백엔드: Docker 이미지 빌드 > GCR 업로드 > Cloud Run 배포
   - 프론트엔드: Android APK 빌드 > Artifacts에 업로드
3. Cloud Run 서비스 URL을 확인하고 모바일 앱의 API_URL 설정을 업데이트합니다.
4. 앱 스토어에 수동으로 APK 파일을 업로드합니다. 