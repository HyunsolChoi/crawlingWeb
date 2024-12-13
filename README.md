# Assignment_3

## 프로젝트 개요
**Assignment_3**는 사람인 채용 공고 크롤링, 데이터베이스 처리, 그리고 API를 통해 다양한 채용 정보를 제공하는 시스템입니다. 이 프로젝트는 2024 웹 서비스 설계 과제 3 으로 진행되었습니다.

---

## 주요 기능

### 1. 채용 데이터 크롤링
- `crawlData.js` 파일을 통해 사람인에서 데이터를 크롤링하여 저장합니다.
- [Saramin](https://www.saramin.co.kr/zf_user/?srsltid=AfmBOoq0B1un_d-EvhWVbj0XZThlX_KHCz52arCFnuLC0XL8xzRCixd3)

### 2. 데이터베이스 관리
- `createTables.js`를 사용하여 필요한 테이블을 생성합니다.
- `insertData.js`를 통해 크롤링된 데이터를 데이터베이스에 삽입합니다.

### 3. API 제공
#### 인증
- 회원 가입, 로그인 및 인증 처리 (`authAPI.js`)

#### 채용 공고
- 채용 공고 조회 및 상세 정보 제공 (`jobsAPI.js`)
- 추천 공고 제공 (`recommendationsAPI.js`)

#### 북마크 및 지원
- 북마크 관리 (`bookmarksAPI.js`)
- 지원 정보 관리 (`applicationsAPI.js`)

### API 세부 설명 
- [Swagger 링크](https://113.198.66.75:17109/api-docs/#/)


---
## 의존성 설치
```
npm install
```
---
## 빌드 명령어 및 순서 
### *( 명령어 상단의 실행 순서 엄수 )*
### mysql 환경
```
-- 1
CREATE DATABASE crawlDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3
UPDATE job_postings
SET employment_type_id = (
    SELECT employment_type_id 
    FROM employment_types 
    WHERE employment_type_name = '정보없음'
)
WHERE employment_type_id IS NULL;

-- 4 ( 1번 기본 사용자를 생성 후 크롤링한 공고들의 작성자로 지정함, 비밀번호는 base64로 인코딩 된 값을 입력해야함 )
INSERT INTO users (email, password, name)
VALUES ('admin@example.com', '?', 'Admin');

```
### ubuntu 환경 
```
-- 2
node createTables.js

-- 5
node insertData.js

-- 6
sudo node server.js
```
---

## 기술 스택
- **Node.js**: 서버 런타임 환경
- **Express.js**: 웹 프레임워크
- **MySQL**: 관계형 데이터베이스
- **Swagger**: API 문서화 및 테스트 기능 구현
- **moment.js**: 날짜 및 시간 처리
- **crypto**: 데이터 해싱 및 암호화
---

## 디렉토리 구조

```
Assignment_3/
├── node_modules/             # 프로젝트의 의존성 모듈
├── Control/                  # API 관련 파일
│   ├── applicationsAPI.js    # 지원서 관련 API
│   ├── authAPI.js            # 인증 및 사용자 관리 API
│   ├── bookmarksAPI.js       # 북마크 관련 API
│   ├── jobsAPI.js            # 채용 공고 관련 API
│   ├── recommendationsAPI.js # 추천 공고 API
├── Model/                    # 데이터베이스 관련 파일
│   ├── DB_setup/             # 데이터베이스 설정 스크립트 (초기에 수행)
│   │   ├── crawlData.js      # 채용 데이터 크롤링 스크립트
│   │   ├── createTables.js   # 테이블 생성 스크립트
│   │   ├── insertData.js     # 데이터 삽입 스크립트
│   ├── executeDB.js          # 데이터베이스 실행 관련 파일
├── dist/                     # Swagger UI 담은 관련 디렉토리 (Swagger 제공)
├── HTTPS-KEY/                # HTTPS 인증 키
│   ├── server.cert           # SSL 인증서
│   ├── server.key            # SSL 키 파일
├── Middlewares/              # 미들웨어 파일
│   ├── authenticate.js       # JWT 인증 미들웨어
├── Swagger/                  # Swagger 설정 파일
│   ├── swagger.js            # Swagger API 문서 설정
├── Utils/                    # 유틸리티 파일
│   ├── config.js             # Secret-KEY 설정 파일
│   ├── connectDB.js          # 데이터베이스 연결 설정
├── View/                     # 응답 관련 처리 파일
│   ├── response.js           # 클라이언트 응답 관련 로직
├── package.json              # 프로젝트 설정 및 의존성
├── package-lock.json         # 의존성 잠금 파일
├── README.md                 # 프로젝트 설명 문서
├── server.js                 # 메인 서버 파일
```
---

# **감사합니다!**