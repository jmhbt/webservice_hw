백엔드 프레임워크 실습 과제용 Express 프로젝트입니다.  
POST / GET / PUT / DELETE 각각 2개씩 총 8개의 REST API를 구현하고,  
표준화된 JSON 응답 포맷과 미들웨어(요청 로그, 에러 핸들러)를 적용했습니다.


## 프로젝트 구조

webservice
├─ src
│ ├─ app.js
│ ├─ middlewares
│ │ ├─ logger.js
│ │ └─ errorHandler.js
│ ├─ routes
│ │ ├─ posts.js
│ │ ├─ comments.js
│ │ └─ todo.js
├─ package.json
└─ README.md


## 실행 방법

패키지 설치
```bash
npm install
npm run dev
```

서버 주소:
http://localhost:3000

모든 API는 아래 JSON 포맷을 따릅니다:

json
{
  "status": "success | error",
  "data": {},
  "message": "설명 메시지"
}

미들웨어
✔ logger.js
모든 요청에 대해 [시간] METHOD URL 형태로 로그 출력

✔ errorHandler.js
발생한 에러를 통합 처리

기본적으로 500 또는 503 응답 반환

title === "maintenance" 요청 시
랜덤/조건적 503 에러 생성(과제 5xx 응답용)

503의 경우 Retry-After: 10 헤더 포함

API 목록 (총 8개 — 과제 조건 충족)
POST (2)
Method	Endpoint	설명
POST	/posts	새 글 생성
POST	/comments	새 댓글 생성

GET (2)
Method	Endpoint	설명
GET	/posts	글 전체 목록 조회
GET	/comments/posts/:postId	특정 글의 댓글 목록 조회

PUT (2)
Method	Endpoint	설명
PUT	/posts/:id	글 전체 수정
PUT	/todos/:id	할 일 수정 (maintenance → 503 에러)

DELETE (2)
Method	Endpoint	설명
DELETE	/posts/:id	글 삭제
DELETE	/comments/:id	댓글 삭제