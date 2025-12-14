Webservice HW API Server

DB·API 설계를 기반으로 한 실전 API 서버 구현 과제입니다.
Express.js + MySQL 기반으로 구현되었으며, JCloud 환경에 배포되어 있습니다.

1. 프로젝트 개요

본 프로젝트는 다음 기능을 제공하는 REST API 서버입니다.

JWT 기반 인증/인가 (USER / ADMIN)

사용자 관리

게시글(Post) 관리

댓글(Comment) 관리

Todo 관리

통계 조회 API

페이지네이션 / 정렬 / 검색

공통 에러 응답 규격

Swagger 자동 문서화

Postman 테스트 컬렉션 제공

2. 기술 스택

Backend: Node.js, Express.js

ORM: Sequelize

Database: MySQL

Auth: JWT (Access / Refresh Token)

Docs: Swagger (OpenAPI 3.0)

Process Manager: PM2

Deployment: JCloud (Ubuntu)

3. 배포 정보 (JCloud)

Base URL
http://113.198.66.68:13137

Health Check
GET http://113.198.66.68:13137/health



4. 실행 방법
4-1. 로컬 실행
npm install
npm run dev

4-2. 서버 실행 (운영 환경)
npm install
pm2 start src/app.js --name webservice-hw
pm2 save

5. 프로세스 관리 (PM2)

본 서버는 PM2로 관리됩니다.

서버 재부팅 이후에도 자동으로 재시작됩니다.

pm2 list
pm2 logs webservice-hw

6. 환경 변수

민감 정보는 .env 파일로 관리되며 GitHub에는 포함되지 않습니다.
아래는 .env.example 기준 항목입니다.

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

PORT=3000
NODE_ENV=development

7. 인증 플로우 (JWT)

회원가입
POST /auth/register

로그인
POST /auth/login
→ Access Token / Refresh Token 발급

인증이 필요한 API 요청 시

Authorization: Bearer <ACCESS_TOKEN>


토큰 재발급
POST /auth/refresh

로그아웃
POST /auth/logout

8. 권한(Role) 구성
Role	설명
USER	일반 사용자
ADMIN	관리자
관리자 전용 API 예시

GET /users

GET /users/{id}

PATCH /users/{id}/deactivate

PATCH /users/{id}/role

GET /stats/*

9. 엔드포인트 요약
Swagger UI
http://113.198.66.68:13137/swagger-ui

총 엔드포인트 수: 35개

10. 공통 에러 응답 형식
{
  "timestamp": "2025-12-14T12:00:00Z",
  "path": "/posts/1",
  "status": 404,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Resource not found",
  "details": {}
}

11. Postman 컬렉션

Postman Collection(JSON)은 classroom 파일에 포함되어 있습니다.
환경 변수(baseUrl, accessToken)를 사용하여 테스트합니다.


12. DB 정보 (테스트용)

※ 실제 ID/비밀번호는 Classroom 제출 파일로만 제공

DB: MySQL

Host: localhost

Port: 3306

Database: webservice_hw

13. ERD
![alt text](image.png)