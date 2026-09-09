# Posts API

## 1. 개요

블로그 게시글 CRUD 기능을 위한 REST API를 정의한다.

게시글 API는 다음 기능을 제공한다.

* 게시글 생성
* 게시글 목록 조회
* 게시글 단건 조회
* 게시글 수정
* 게시글 삭제

게시글 생성, 수정, 삭제 API에는 JWT 인증 및 작성자 권한 검사가 적용되어 있다.

게시글 조회 API는 인증 없이 사용할 수 있다.

### 요청 처리 구조

```text
HTTP Request
     ↓
PostsController
     ↓
JWT Guard
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

| Method   | Endpoint     | 인증  | 권한      | 설명        |        성공 Status |
| -------- | ------------ | --- | ------- | --------- | ---------------: |
| `POST`   | `/posts`     | 필요  | 로그인 사용자 | 게시글 생성    |    `201 Created` |
| `GET`    | `/posts`     | 불필요 | -       | 게시글 목록 조회 |         `200 OK` |
| `GET`    | `/posts/:id` | 불필요 | -       | 게시글 단건 조회 |         `200 OK` |
| `PATCH`  | `/posts/:id` | 필요  | 작성자 본인  | 게시글 수정    |         `200 OK` |
| `DELETE` | `/posts/:id` | 필요  | 작성자 본인  | 게시글 삭제    | `204 No Content` |

---

# 3. 인증

인증이 필요한 API는 HTTP Authorization Header에 JWT Access Token을 전달한다.

```http
Authorization: Bearer <accessToken>
```

JWT 인증이 완료되면 인증된 사용자의 정보가 요청 객체에 전달된다.

```text
JWT
 ↓
JwtAuthGuard
 ↓
JwtStrategy
 ↓
req.user
```

인증된 사용자 정보는 다음과 같은 형태로 사용한다.

```typescript
{
    id: number,
    email: string
}
```

게시글 생성 시 `req.user.id`를 이용하여 게시글 작성자를 서버에서 지정한다.

클라이언트가 `authorId`를 직접 전달하는 방식은 사용하지 않는다.

---

# 4. 게시글 생성

## POST `/posts`

로그인한 사용자가 새로운 게시글을 생성한다.

게시글의 작성자는 JWT Access Token에 포함된 인증 사용자로 자동 연결된다.

## Request

### Headers

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

### Body

```json
{
    "title": "첫 번째 게시글",
    "content": "게시글 내용입니다."
}
```

### Request Fields

| Field     | Type     | Required | Description |
| --------- | -------- | -------- | ----------- |
| `title`   | `string` | O        | 게시글 제목      |
| `content` | `string` | O        | 게시글 본문      |

`authorId`는 Request Body에 포함하지 않는다.

작성자는 JWT 인증 정보를 기반으로 서버에서 결정한다.

## Response

### `201 Created`

```json
{
    "data": {
        "title": "첫 번째 게시글",
        "content": "게시글 내용입니다.",
        "author": {
            "id": 1,
            "email": "test@test.com"
        },
        "id": 1,
        "createdAt": "2026-09-09T10:00:00.000Z",
        "updatedAt": "2026-09-09T10:00:00.000Z"
    }
}
```

### 인증 없이 요청

JWT Access Token 없이 요청하면 다음 응답을 반환한다.

```http
401 Unauthorized
```

---

# 5. 게시글 목록 조회

## GET `/posts`

게시글 목록을 조회한다.

인증이 필요하지 않다.

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

| Parameter | Type     | Required | Default | Description |
| --------- | -------- | -------- | ------: | ----------- |
| `page`    | `number` | X        |     `1` | 페이지 번호      |
| `limit`   | `number` | X        |    `10` | 페이지당 게시글 수  |

## Response

### `200 OK`

```json
{
    "data": [
        {
            "id": 1,
            "title": "첫 번째 게시글",
            "content": "게시글 내용입니다.",
            "createdAt": "2026-09-09T10:00:00.000Z",
            "updatedAt": "2026-09-09T10:00:00.000Z",
            "author": {
                "id": 1,
                "email": "test@test.com"
            }
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

| Field                 | Type     | Description |
| --------------------- | -------- | ----------- |
| `data`                | `Post[]` | 게시글 목록      |
| `data[].id`           | `number` | 게시글 ID      |
| `data[].title`        | `string` | 게시글 제목      |
| `data[].content`      | `string` | 게시글 본문      |
| `data[].createdAt`    | `string` | 게시글 생성 시간   |
| `data[].updatedAt`    | `string` | 게시글 수정 시간   |
| `data[].author.id`    | `number` | 작성자 ID      |
| `data[].author.email` | `string` | 작성자 이메일     |
| `meta.page`           | `number` | 현재 페이지      |
| `meta.limit`          | `number` | 페이지당 게시글 수  |
| `meta.total`          | `number` | 전체 게시글 수    |
| `meta.totalPages`     | `number` | 전체 페이지 수    |

> 게시글 작성자 정보에는 `password`가 포함되지 않는다.

---

# 6. 게시글 단건 조회

## GET `/posts/:id`

게시글 ID를 이용하여 특정 게시글을 조회한다.

인증이 필요하지 않다.

## Request

```http
GET /posts/1
```

### Path Parameter

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `id`      | `number` | 조회할 게시글 ID  |

## Response

### `200 OK`

```json
{
    "data": {
        "id": 1,
        "title": "첫 번째 게시글",
        "content": "게시글 내용입니다.",
        "createdAt": "2026-09-09T10:00:00.000Z",
        "updatedAt": "2026-09-09T10:00:00.000Z",
        "author": {
            "id": 1,
            "email": "test@test.com"
        }
    }
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

# 7. 게시글 수정

## PATCH `/posts/:id`

기존 게시글을 수정한다.

JWT 인증이 필요하며, **게시글 작성자 본인만 수정할 수 있다.**

`PATCH`를 사용하므로 수정할 필드만 전달할 수 있다.

## Request

### Headers

```http
Content-Type: application/json
Authorization: Bearer <accessToken>
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

| Field     | Type     | Required | Description |
| --------- | -------- | -------- | ----------- |
| `title`   | `string` | X        | 수정할 게시글 제목  |
| `content` | `string` | X        | 수정할 게시글 본문  |

## Response

### `200 OK`

```json
{
    "data": {
        "id": 1,
        "title": "수정된 제목",
        "content": "수정된 내용입니다.",
        "createdAt": "2026-09-09T10:00:00.000Z",
        "updatedAt": "2026-09-09T10:30:00.000Z",
        "author": {
            "id": 1,
            "email": "test@test.com"
        }
    }
}
```

수정이 완료되면 `updatedAt`이 갱신된다.

### 인증 없이 요청

```http
401 Unauthorized
```

### 작성자가 아닌 사용자의 요청

다른 사용자가 게시글을 수정하려는 경우:

```http
403 Forbidden
```

```json
{
    "statusCode": 403,
    "message": "게시글을 수정할 권한이 없습니다.",
    "error": "Forbidden"
}
```

### 존재하지 않는 게시글

```http
404 Not Found
```

---

# 8. 게시글 삭제

## DELETE `/posts/:id`

특정 게시글을 삭제한다.

JWT 인증이 필요하며, **게시글 작성자 본인만 삭제할 수 있다.**

## Request

### Headers

```http
Authorization: Bearer <accessToken>
```

```http
DELETE /posts/1
```

### Path Parameter

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `id`      | `number` | 삭제할 게시글 ID  |

## Response

### `204 No Content`

삭제가 정상적으로 완료되면 Response Body를 반환하지 않는다.

삭제 후:

```http
GET /posts/1
```

요청을 수행하면:

```http
404 Not Found
```

를 반환한다.

### 인증 없이 요청

```http
401 Unauthorized
```

### 작성자가 아닌 사용자의 요청

```http
403 Forbidden
```

```json
{
    "statusCode": 403,
    "message": "게시글을 삭제할 권한이 없습니다.",
    "error": "Forbidden"
}
```

---

# 9. Validation

## 게시글 생성

### title

* 필수 값
* 문자열
* 최소 1자
* 최대 200자

### content

* 필수 값
* 문자열
* 최소 1자 이상

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

또는:

```json
{
    "content": "수정된 내용"
}
```

처럼 일부 필드만 수정할 수 있다.

단, 전달된 필드에 대해서는 생성 API와 동일한 Validation 규칙을 적용한다.

---

# 10. 게시글 ID Validation

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

# 11. HTTP Status Code

게시글 API에서는 다음 Status Code를 사용한다.

|                 Status Code | 의미              | 사용 상황                  |
| --------------------------: | --------------- | ---------------------- |
|                    `200 OK` | 요청 성공           | 조회, 수정                 |
|               `201 Created` | 리소스 생성 성공       | 게시글 생성                 |
|            `204 No Content` | 요청 성공, 응답 내용 없음 | 게시글 삭제                 |
|           `400 Bad Request` | 잘못된 요청          | Validation 실패, 잘못된 ID  |
|          `401 Unauthorized` | 인증 필요 또는 인증 실패  | JWT 누락, 잘못된 JWT        |
|             `403 Forbidden` | 권한 없음           | 게시글 작성자가 아닌 사용자의 수정/삭제 |
|             `404 Not Found` | 리소스 없음          | 존재하지 않는 게시글            |
| `500 Internal Server Error` | 서버 내부 오류        | 처리되지 않은 서버/DB 오류       |

---

# 12. 예외 응답

## 400 Bad Request

잘못된 Request Body 또는 게시글 ID 형식 등의 경우 사용한다.

```json
{
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request"
}
```

실제 Validation 오류의 상세 `message`는 요청 데이터에 따라 달라질 수 있다.

---

## 401 Unauthorized

인증이 필요한 API에 JWT가 없거나 유효하지 않은 경우 사용한다.

```json
{
    "statusCode": 401,
    "message": "Unauthorized"
}
```

적용 API:

* `POST /posts`
* `PATCH /posts/:id`
* `DELETE /posts/:id`

---

## 403 Forbidden

JWT 인증은 성공했지만 해당 게시글에 대한 권한이 없는 경우 사용한다.

게시글 수정:

```json
{
    "statusCode": 403,
    "message": "게시글을 수정할 권한이 없습니다.",
    "error": "Forbidden"
}
```

게시글 삭제:

```json
{
    "statusCode": 403,
    "message": "게시글을 삭제할 권한이 없습니다.",
    "error": "Forbidden"
}
```

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

---

# 13. User와 Post 관계

User와 Post는 `1:N` 관계를 가진다.

```text
User 1 ───── N Post
```

하나의 User는 여러 개의 Post를 작성할 수 있으며, 하나의 Post는 하나의 작성자를 가진다.

Post Entity의 구조는 다음과 같다.

```text
Post

├── id
├── title
├── content
├── author
├── createdAt
└── updatedAt
```

데이터베이스에서는 `posts.authorId`를 통해 작성자와 연결된다.

```text
users
  │
  │ id
  ▼
posts.authorId
```

게시글 생성 시 `authorId`를 Request Body로 직접 전달하지 않는다.

JWT 인증을 통해 현재 사용자를 확인한 후 서버에서 작성자를 연결한다.

```text
JWT
 ↓
JwtAuthGuard
 ↓
JwtStrategy
 ↓
req.user.id
 ↓
UsersService.findById()
 ↓
Post.author
 ↓
posts.authorId
```

이를 통해 클라이언트가 다른 사용자의 ID를 전달하여 게시글 작성자를 임의로 지정하는 것을 방지한다.

---

# 14. 게시글 수정 및 삭제 권한

게시글 수정과 삭제는 작성자 본인만 수행할 수 있다.

```text
Request
  ↓
JWT 인증
  ↓
현재 사용자 ID 확인
  ↓
게시글 조회
  ↓
게시글 작성자 ID 확인
  ↓
┌─────────────────────┐
│ 사용자 ID == 작성자 ID │
└─────────────────────┘
       │
   ┌───┴───┐
   ↓       ↓
  일치    불일치
   ↓       ↓
 처리    403 Forbidden
```

권한 검사는 `PostsService`에서 수행한다.

따라서 Controller에서 인증된 사용자 정보를 전달하고 Service에서 실제 비즈니스 권한을 검증하는 구조를 사용한다.

---

# 15. 사용자 정보 보안

게시글 조회 시 작성자의 이메일과 ID만 반환한다.

```json
{
    "author": {
        "id": 1,
        "email": "test@test.com"
    }
}
```

사용자의 `password`는 API 응답에 포함하지 않는다.

`UserEntity`의 password 컬럼은 기본 조회에서 제외한다.

```typescript
@Column({ select: false })
password!: string;
```

로그인 과정에서 비밀번호 검증이 필요한 경우에만 password 컬럼을 명시적으로 조회한다.

이를 통해 게시글 작성자 정보 조회 과정에서 비밀번호 해시가 외부에 노출되는 것을 방지한다.

---

# 16. 전체 API 흐름

```text
                    ┌─ POST /posts
                    │     ↓
                    │  JWT 인증
                    │     ↓
                    │  작성자 연결
                    │     ↓
                    │  게시글 생성
                    │
Client ─────────────┼─ GET /posts
                    │     ↓
                    │  게시글 목록 조회
                    │
                    ├─ GET /posts/:id
                    │     ↓
                    │  게시글 상세 조회
                    │
                    ├─ PATCH /posts/:id
                    │     ↓
                    │  JWT 인증
                    │     ↓
                    │  작성자 권한 검사
                    │     ↓
                    │  게시글 수정
                    │
                    └─ DELETE /posts/:id
                          ↓
                       JWT 인증
                          ↓
                       작성자 권한 검사
                          ↓
                       게시글 삭제
```

---

# 17. 구현 구조

게시글 기능은 Controller → Service → Repository 계층 구조로 구현한다.

```text
Client
  ↓
PostsController
  ↓
JWT Guard
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

* HTTP 요청 수신
* Path / Query / Body 처리
* JWT 인증 Guard 적용
* 인증 사용자 정보 전달
* Service 호출
* HTTP Response 반환

### DTO

* Request 데이터 구조 정의
* 입력값 Validation

### Guard / Strategy

* JWT 인증
* Access Token 검증
* 인증된 사용자 정보 생성

### Service

* 게시글 관련 비즈니스 로직
* 게시글 존재 여부 확인
* 게시글 작성자 확인
* 게시글 수정/삭제 권한 검증
* Repository 호출

### Repository

* PostgreSQL 데이터 접근
* TypeORM을 이용한 CRUD 처리

### PostgreSQL

* 게시글 데이터 영속화
* User와 Post 관계 저장

Controller에서 직접 데이터베이스에 접근하지 않는다.