# Assignment_3

## 프로젝트 개요
**Assignment_3**는 사람인 채용 공고 크롤링, 데이터베이스 처리, API 를 통해 다양한 채용 정보를 제공하는 시스템입니다.  
해당 프로젝트는 **2024 웹 서비스 설계 과제 3** 으로 진행되었습니다.

---

## 주요 기능

### 1. 채용 데이터 크롤링
- `crawlData.js` 파일을 통해 사람인에서 데이터를 크롤링하여 저장합니다.
- [Saramin](https://www.saramin.co.kr/zf_user/?srsltid=AfmBOoq0B1un_d-EvhWVbj0XZThlX_KHCz52arCFnuLC0XL8xzRCixd3)

### 2. 데이터베이스 관리
- `createTables.js`를 사용하여 필요한 테이블을 생성하고, 관리자 계정 데이터를 삽입합니다.
- `insertData.js`를 통해 크롤링된 데이터를 데이터베이스에 삽입합니다.

### 3. API 파일별 엔드포인트
#### applicationsAPI.js 
- POST   /applications      : 공고 지원
- GET    /applications      : 지원 내역 조회
- DELETE /applications/{id} : 지원 취소 ( 지원 ID )

#### authAPI.js 
- POST   /auth/register     : 회원가입
- POST   /auth/login        : 로그인
- POST   /auth/refresh      : 토큰 갱신
- PUT    /auth/modify       : 회원 정보 수정
- GET    /auth/profile      : 회원 정보 조회
- DELETE /auth/delete       : 회원탈퇴

#### bookmarksAPI.js
- POST   /bookmarks         : 북마크 추가/제거 (토글)
- GET    /bookmarks         : 북마크 목록 조회

#### jobsAPI.js
- POST   /jobs              : 공고 조회
- POST   /jobs/create       : 채용 공고 등록
- POST   /jobs/sectors      : 직무 관련 공고 조회
- PUT    /jobs/{id}         : 채용 공고 수정 (공고 ID)
- GET    /jobs/{id}         : 공고 상세 조회 및 관련 공고 추천 (공고 ID)
- DELETE /jobs/{id}         : 채용 공고 삭제 (공고 ID)

#### applicationsAPI.js
- GET    /recommendations          : 추천 공고 조회
- GET    /recommendations/popular  : 인기 공고 조회
- GET    /recommendations/pay      : 급여 순 공고 조회

### API 세부 설명 및 테스트
- [Swagger 링크](https://113.198.66.75:17109/api-docs/#/)

### **연결이 비공개로 설정되어 있지 않습니다** 가 뜰 경우, 
 **thisisunsafe** 를 타이핑 해주세요.


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
```
### ubuntu 환경 
```
-- 2
node createTables.js

-- 3
node insertData.js

-- 4 
sudo node server.js

-- 4 ( 백그라운드 실행 )
sudo forever start -a -l forever.log -o out.log -e err.log server.js
```

### 환경 변수 설정 (.env)
DB_HOST= 호스트 주소  
DB_PORT= 포트 번호  
DB_USER= DB 사용자 ID  
DB_PASSWORD= DB 비밀번호  
DB_DATABASE= DB 이름   
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
node_modules/               # 프로젝트의 의존성 모듈
Control/                    # API 관련 파일
├── applicationsAPI.js      # 지원서 관련 API
├── authAPI.js              # 인증 및 사용자 관리 API
├── bookmarksAPI.js         # 북마크 관련 API
├── jobsAPI.js              # 채용 공고 관련 API
├── recommendationsAPI.js   # 추천 공고 API
Model/                      # 데이터베이스 관련 파일
├── executeDB.js            # 데이터베이스 실행 관련 파일
├── DB_setup/               # 데이터베이스 설정 스크립트 (초기에 수행)
│   ├── crawlData.js        # 채용 데이터 크롤링 스크립트
│   ├── createTables.js     # 테이블 생성 스크립트
│   ├── insertData.js       # 데이터 삽입 스크립트
dist/                       # Swagger UI 담은 관련 디렉토리 (Swagger 제공)
HTTPS-KEY/                  # HTTPS 인증 키
├── server.cert             # SSL 인증서
├── server.key              # SSL 키 파일
Middlewares/                # 미들웨어 파일
├── authenticate.js         # JWT 인증 미들웨어
Swagger/                    # Swagger 설정 파일
├── swagger.js              # Swagger API 문서 설정
Utils/                      # 유틸리티 파일
├── config.js               # Secret-KEY 설정 파일
├── connectDB.js            # 데이터베이스 연결 설정
View/                       # 응답 관련 처리 파일
├── response.js             # 클라이언트 응답 관련 로직
package.json                # 프로젝트 설정 및 의존성
package-lock.json           # 의존성 잠금 파일
README.md                   # 프로젝트 설명 문서
server.js                   # 메인 서버 파일
.env                        # 환경 변수 
```
---

# **감사합니다!**
