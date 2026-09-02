# Posts API

## 1. 개요

블로그 게시글 CRUD 기능을 위한 REST API 설계를 정의한다.

게시글 API는 다음 기능을 제공한다.

- 게시글 생성
- 게시글 목록 조회
- 게시글 단건 조회
- 게시글 수정
- 게시글 삭제

게시글 API의 기본 요청 처리 구조는 다음과 같다.

```text
HTTP Request
     ↓
PostsController
     ↓
DTO / Validation
     ↓
PostsService
     ↓
PostRepository
     ↓
TypeORM
     ↓
PostgreSQL
```

> PostgreSQL 및 TypeORM 기본 환경 구성은 #12에서 완료된 상태를 전제로 한다.

---

# 2. API Endpoint

| Method | Endpoint | 설명 | 성공 Status |
|---|---|---|---:|
| `POST` | `/posts` | 게시글 생성 | `201 Created` |
| `GET` | `/posts` | 게시글 목록 조회 | `200 OK` |
| `GET` | `/posts/:id` | 게시글 단건 조회 | `200 OK` |
| `PATCH` | `/posts/:id` | 게시글 수정 | `200 OK` |
| `DELETE` | `/posts/:id` | 게시글 삭제 | `204 No Content` |

---

# 3. 게시글 생성

## POST `/posts`

새로운 게시글을 생성한다.

현재 인증 기능이 구현되어 있지 않으므로 작성자 정보는 Request Body에 포함하지 않는다.

향후 JWT 인증/인가 구현 후 인증된 사용자를 기반으로 작성자를 연결한다.

## Request

### Headers

```http
Content-Type: application/json
```

### Body

```json
{
  "title": "첫 번째 게시글",
  "content": "게시글 내용입니다."
}
```

### Request Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | O | 게시글 제목 |
| `content` | `string` | O | 게시글 본문 |

## Response

### `201 Created`

```json
{
  "id": 1,
  "title": "첫 번째 게시글",
  "content": "게시글 내용입니다.",
  "createdAt": "2026-08-28T10:00:00.000Z",
  "updatedAt": "2026-08-28T10:00:00.000Z"
}
```

---

# 4. 게시글 목록 조회

## GET `/posts`

게시글 목록을 조회한다.

게시글은 생성일을 기준으로 최신 게시글부터 조회한다.

```text
ORDER BY createdAt DESC
```

## Request

Pagination을 Query Parameter로 전달한다.

```http
GET /posts?page=1&limit=10
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---:|---|
| `page` | `number` | X | `1` | 페이지 번호 |
| `limit` | `number` | X | `10` | 페이지당 게시글 수 |

## Response

### `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "title": "첫 번째 게시글",
      "content": "게시글 내용입니다.",
      "createdAt": "2026-08-28T10:00:00.000Z",
      "updatedAt": "2026-08-28T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `data` | `Post[]` | 게시글 목록 |
| `meta.page` | `number` | 현재 페이지 |
| `meta.limit` | `number` | 페이지당 게시글 수 |
| `meta.total` | `number` | 전체 게시글 수 |
| `meta.totalPages` | `number` | 전체 페이지 수 |

---

# 5. 게시글 단건 조회

## GET `/posts/:id`

게시글 ID를 이용하여 특정 게시글을 조회한다.

## Request

```http
GET /posts/1
```

### Path Parameter

| Parameter | Type | Description |
|---|---|---|
| `id` | `number` | 조회할 게시글 ID |

## Response

### `200 OK`

```json
{
  "id": 1,
  "title": "첫 번째 게시글",
  "content": "게시글 내용입니다.",
  "createdAt": "2026-08-28T10:00:00.000Z",
  "updatedAt": "2026-08-28T10:00:00.000Z"
}
```

### 존재하지 않는 게시글

```http
404 Not Found
```

```json
{
  "statusCode": 404,
  "message": "Post not found",
  "error": "Not Found"
}
```

---

# 6. 게시글 수정

## PATCH `/posts/:id`

기존 게시글의 내용을 수정한다.

`PATCH`를 사용하므로 수정할 필드만 전달할 수 있다.

## Request

```http
PATCH /posts/1
Content-Type: application/json
```

### Body

```json
{
  "title": "수정된 제목",
  "content": "수정된 내용입니다."
}
```

일부 필드만 수정하는 것도 허용한다.

```json
{
  "title": "수정된 제목"
}
```

### Request Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | X | 수정할 게시글 제목 |
| `content` | `string` | X | 수정할 게시글 본문 |

## Response

### `200 OK`

```json
{
  "id": 1,
  "title": "수정된 제목",
  "content": "게시글 내용입니다.",
  "createdAt": "2026-08-28T10:00:00.000Z",
  "updatedAt": "2026-08-28T10:30:00.000Z"
}
```

수정이 완료되면 `updatedAt`이 갱신되어야 한다.

### 존재하지 않는 게시글

```http
404 Not Found
```

---

# 7. 게시글 삭제

## DELETE `/posts/:id`

특정 게시글을 삭제한다.

## Request

```http
DELETE /posts/1
```

### Path Parameter

| Parameter | Type | Description |
|---|---|---|
| `id` | `number` | 삭제할 게시글 ID |

## Response

### `204 No Content`

삭제가 정상적으로 완료되면 Response Body를 반환하지 않는다.

삭제 후 다음 요청을 수행했을 때:

```http
GET /posts/1
```

다음 응답이 반환되어야 한다.

```http
404 Not Found
```

---

# 8. Validation

## 게시글 생성

### title

- 필수 값
- 문자열
- 최소 1자
- 최대 200자

### content

- 필수 값
- 문자열
- 최소 1자 이상

예를 들어 다음 요청은 유효하지 않다.

```json
{
  "title": "",
  "content": ""
}
```

응답:

```http
400 Bad Request
```

---

## 게시글 수정

`PATCH`의 특성에 따라 `title`과 `content`는 선택적으로 전달한다.

```json
{
  "title": "수정된 제목"
}
```

또는

```json
{
  "content": "수정된 내용"
}
```

처럼 일부 필드만 수정할 수 있다.

단, 전달된 필드에 대해서는 생성 API와 동일한 Validation 규칙을 적용한다.

---

# 9. 게시글 ID Validation

`/posts/:id`의 ID는 숫자로 처리한다.

### 정상 요청

```http
GET /posts/1
```

### 잘못된 ID 형식

```http
GET /posts/abc
```

응답:

```http
400 Bad Request
```

ID의 형식은 올바르지만 해당 게시글이 존재하지 않는 경우에는 `404 Not Found`를 반환한다.

```text
abc
 ↓
400 Bad Request

999
 ↓
게시글 존재 여부 확인
 ↓
404 Not Found
```

---

# 10. HTTP Status Code

게시글 API에서는 다음 Status Code를 사용한다.

| Status Code | 의미 | 사용 상황 |
|---:|---|---|
| `200 OK` | 요청 성공 | 조회, 수정 |
| `201 Created` | 리소스 생성 성공 | 게시글 생성 |
| `204 No Content` | 요청 성공, 응답 내용 없음 | 게시글 삭제 |
| `400 Bad Request` | 잘못된 요청 | Validation 실패, 잘못된 ID |
| `404 Not Found` | 리소스 없음 | 존재하지 않는 게시글 |
| `500 Internal Server Error` | 서버 내부 오류 | 처리되지 않은 서버/DB 오류 |

---

# 11. 예외 응답

## 400 Bad Request

잘못된 Request Body 또는 게시글 ID 형식 등의 경우 사용한다.

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

실제 Validation 오류의 상세 `message` 형식은 NestJS ValidationPipe 적용 후 확인하고 조정한다.

---

## 404 Not Found

존재하지 않는 게시글을 요청한 경우 사용한다.

```json
{
  "statusCode": 404,
  "message": "Post not found",
  "error": "Not Found"
}
```

---

## 500 Internal Server Error

서버 내부 오류 또는 처리되지 않은 데이터베이스 오류가 발생한 경우 사용한다.

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

> 공통 API 응답 형식과 Global Exception Filter 적용 여부는 CRUD 구현 완료 후 전체 API 응답을 검토하여 최종 결정한다.

---

# 12. User와 Post 관계

현재 CRUD 단계에서는 인증 기능을 구현하지 않는다.

이후 User와 Post의 관계를 다음과 같이 구성한다.

```text
User 1 ───── N Post
```

Post에는 작성자를 나타내는 관계를 추가한다.

```text
Post
├── id
├── title
├── content
├── author
├── createdAt
└── updatedAt
```

현재 API에서는 `authorId`를 Request Body로 직접 전달하지 않는다.

향후 JWT 인증 구현 후:

```text
JWT
 ↓
현재 사용자 확인
 ↓
User
 ↓
Post.author
```

형태로 작성자를 연결한다.

---

# 13. 전체 API 흐름

게시글 CRUD의 전체 흐름은 다음과 같다.

```text
POST /posts
     ↓
게시글 생성
     ↓
GET /posts
     ↓
게시글 목록 조회
     ↓
GET /posts/:id
     ↓
게시글 상세 조회
     ↓
PATCH /posts/:id
     ↓
게시글 수정
     ↓
DELETE /posts/:id
     ↓
게시글 삭제
     ↓
GET /posts/:id
     ↓
404 Not Found
```

---

# 14. 구현 구조

게시글 기능은 다음 계층 구조로 구현한다.

```text
Client
  ↓
PostsController
  ↓
DTO / Validation
  ↓
PostsService
  ↓
PostRepository
  ↓
TypeORM
  ↓
PostgreSQL
```

각 계층의 책임을 분리한다.

### Controller

- HTTP 요청 수신
- Path / Query / Body 처리
- HTTP Response 반환
- Service 호출

### DTO

- Request 데이터 구조 정의
- 입력값 Validation

### Service

- 게시글 관련 비즈니스 로직
- 게시글 존재 여부 확인
- Repository 호출

### Repository

- PostgreSQL 데이터 접근
- TypeORM을 이용한 CRUD 처리

### PostgreSQL

- 게시글 데이터 영속화

Controller에서 직접 데이터베이스에 접근하지 않는다.