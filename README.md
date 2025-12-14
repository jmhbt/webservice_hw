# Web Service API Server

Node.js + Express 기반의 REST API 서버입니다.  
JWT 인증을 기반으로 사용자, 게시글, 댓글 기능을 제공합니다.

---

## 주요 기능

- JWT 인증 / 인가 (Access Token, Refresh Token)
- 사용자(User) 관리
- 게시글(Post) 관리
- 댓글(Comment) 관리
- 게시글 좋아요(PostLike)
- 공통 에러 응답 규격
- Swagger(OpenAPI 3.0) 자동 문서화
- Postman 테스트 컬렉션 제공

---

## 기술 스택

- **Backend**: Node.js, Express.js  
- **ORM**: Sequelize  
- **Database**: MySQL 8.0 (Docker)  
- **Authentication**: JWT (Access / Refresh Token)  
- **API Docs**: Swagger (OpenAPI 3.0)  
- **Process Manager**: PM2  
- **Deployment**: JCloud (Ubuntu)

---

## 배포 정보 (JCloud)

- **Base URL**  
http://113.198.66.68:13137

markdown
코드 복사

- **Health Check**
GET /health

markdown
코드 복사

- **Swagger UI**
http://113.198.66.68:13137/swagger-ui

yaml
코드 복사

---

## 실행 방법

### 1. 로컬 실행 (개발)

```bash
npm install
npm run dev
.env 파일이 필요합니다.

.env.example 파일을 참고하여 환경 변수를 설정하세요.

2. 서버 실행 (운영 / 배포 - PM2)
bash
코드 복사
npm install
pm2 start src/app.js --name webservice-hw
pm2 save
PM2 프로세스 관리
bash
코드 복사
pm2 list
pm2 restart webservice-hw
pm2 logs webservice-hw
pm2 stop webservice-hw
pm2 delete webservice-hw
DB 설정 (MySQL + Docker)
JCloud 환경에서는 MySQL이 Docker 컨테이너로 실행됩니다.

Docker Volume을 사용하여 데이터가 유지됩니다.

DB 상태 확인
bash
코드 복사
docker ps
docker volume ls
환경 변수
.env.example 파일을 참고하여 .env 파일을 구성합니다.

인증 플로우 (JWT)
1. 회원가입
http
코드 복사
POST /auth/register
2. 로그인
http
코드 복사
POST /auth/login
Access Token / Refresh Token 발급

3. 인증이 필요한 요청
요청 헤더에 아래 형식으로 토큰을 포함합니다.

http
코드 복사
Authorization: Bearer <ACCESS_TOKEN>
4. 토큰 재발급
http
코드 복사
POST /auth/refresh
5. 로그아웃
http
코드 복사
POST /auth/logout
권한(Role)
USER: 일반 사용자

ADMIN: 관리자

관리자 전용 API 예시
http
코드 복사
GET    /users
GET    /users/{id}
PATCH  /users/{id}/deactivate
PATCH  /users/{id}/role
GET    /stats/*
API 문서
Swagger UI

arduino
코드 복사
http://113.198.66.68:13137/swagger-ui
공통 에러 응답 형식
json
코드 복사
{
  "timestamp": "2025-12-14T12:00:00Z",
  "path": "/posts/1",
  "status": 404,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Resource not found",
  "details": {}
}
Postman 컬렉션
Postman Collection(JSON)은 classroom 제공 파일에 포함되어 있습니다.

환경 변수:

baseUrl

accessToken

위 변수 설정 후 테스트 가능합니다.

ERD
![alt text](image.png)