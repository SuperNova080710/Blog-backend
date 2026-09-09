# Auth API

## 1. 개요

사용자 인증을 위한 API이다.

현재 JWT Access Token을 사용하여 인증을 처리한다.

제공하는 기능은 다음과 같다.

* 회원가입
* 로그인
* JWT Access Token 발급
* JWT 인증
* 현재 인증 사용자 조회

---

## 2. API Endpoint

| Method | Endpoint       | 인증  | 설명                    |
| ------ | -------------- | --- | --------------------- |
| `POST` | `/auth/signup` | 불필요 | 회원가입                  |
| `POST` | `/auth/login`  | 불필요 | 로그인 및 Access Token 발급 |
| `GET`  | `/auth/me`     | 필요  | 현재 인증 사용자 조회          |

---

## 3. 회원가입

### POST `/auth/signup`

이메일과 비밀번호를 이용하여 사용자를 생성한다.

비밀번호는 `bcrypt`를 사용하여 해시한 후 데이터베이스에 저장한다.

### Request

```json
{
    "email": "test@test.com",
    "password": "password123"
}
```

### Request Fields

| Field      | Type     | Required | Description |
| ---------- | -------- | -------- | ----------- |
| `email`    | `string` | O        | 사용자 이메일     |
| `password` | `string` | O        | 사용자 비밀번호    |

### Validation

* `email`: 유효한 이메일 형식
* `password`: 문자열, 최소 8자

### Response

#### `201 Created`

```json
{
    "data": {
        "id": 1,
        "email": "test@test.com"
    }
}
```

비밀번호는 응답에 포함하지 않는다.

### 중복 이메일

이미 가입된 이메일을 사용하는 경우:

```http
409 Conflict
```

```json
{
    "statusCode": 409,
    "message": "이미 사용 중인 이메일입니다.",
    "error": "Conflict"
}
```

---

## 4. 로그인

### POST `/auth/login`

이메일과 비밀번호를 검증하고 JWT Access Token을 발급한다.

### Request

```json
{
    "email": "test@test.com",
    "password": "password123"
}
```

### Response

#### `200 OK`

```json
{
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

발급받은 Access Token은 인증이 필요한 API 요청에 사용한다.

```http
Authorization: Bearer <accessToken>
```

### 로그인 실패

이메일이 존재하지 않거나 비밀번호가 일치하지 않는 경우:

```http
401 Unauthorized
```

```json
{
    "statusCode": 401,
    "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "error": "Unauthorized"
}
```

---

## 5. JWT 인증

인증이 필요한 API는 Authorization Header에 JWT Access Token을 전달한다.

```http
Authorization: Bearer <accessToken>
```

인증 처리 과정은 다음과 같다.

```text
Request
  ↓
JwtAuthGuard
  ↓
JwtStrategy
  ↓
JWT 검증
  ↓
사용자 조회
  ↓
req.user
```

인증이 완료되면 `req.user`에 다음 정보가 전달된다.

```typescript
{
    id: number;
    email: string;
}
```

---

## 6. 현재 사용자 조회

### GET `/auth/me`

JWT Access Token으로 인증된 사용자의 정보를 조회한다.

### Request

```http
Authorization: Bearer <accessToken>
```

### Response

#### `200 OK`

```json
{
    "data": {
        "id": 1,
        "email": "test@test.com"
    }
}
```

---

## 7. JWT Payload

JWT에는 다음 정보를 저장한다.

```json
{
    "sub": 1,
    "email": "test@test.com"
}
```

| Field   | Description |
| ------- | ----------- |
| `sub`   | 사용자 ID      |
| `email` | 사용자 이메일     |

Access Token의 만료 시간은 **1시간**이다.

```typescript
signOptions: {
    expiresIn: "1h",
}
```

---

## 8. 인증 실패

JWT 인증이 필요한 API에 인증 정보가 없거나 유효하지 않은 경우 `401 Unauthorized`를 반환한다.

### Access Token 없음

```http
401 Unauthorized
```

### 잘못된 Access Token

```http
401 Unauthorized
```

### 만료된 Access Token

```http
401 Unauthorized
```

JWT Strategy에서는 만료된 토큰을 허용하지 않는다.

```typescript
ignoreExpiration: false
```

---

## 9. 비밀번호 보안

사용자 비밀번호는 평문으로 저장하지 않는다.

회원가입 시 `bcrypt`를 이용하여 비밀번호를 해시한다.

```text
비밀번호
  ↓
bcrypt.hash()
  ↓
Password Hash
  ↓
Database
```

`UserEntity`의 password 컬럼은 기본 조회에서 제외한다.

```typescript
@Column({ select: false })
password!: string;
```

로그인 시 비밀번호 검증을 위해서만 password 컬럼을 명시적으로 조회한다.

```text
로그인 요청
  ↓
사용자 조회
  ↓
Password Hash 조회
  ↓
bcrypt.compare()
  ↓
JWT 발급
```

따라서 일반적인 사용자 조회나 게시글 조회 응답에는 비밀번호가 포함되지 않는다.

---

## 10. 게시글 API와 인증

JWT 인증은 게시글 생성, 수정, 삭제에 사용한다.

| Method   | Endpoint     | 인증  | 권한      |
| -------- | ------------ | --- | ------- |
| `POST`   | `/posts`     | 필요  | 로그인 사용자 |
| `GET`    | `/posts`     | 불필요 | -       |
| `GET`    | `/posts/:id` | 불필요 | -       |
| `PATCH`  | `/posts/:id` | 필요  | 작성자 본인  |
| `DELETE` | `/posts/:id` | 필요  | 작성자 본인  |

게시글 생성 시 작성자를 Request Body에서 전달하지 않는다.

JWT로 인증된 사용자의 ID를 이용하여 서버에서 작성자를 연결한다.

```text
JWT
 ↓
req.user.id
 ↓
Post.author
 ↓
posts.authorId
```

게시글 수정 및 삭제 시에는 인증된 사용자와 게시글 작성자를 비교하여 권한을 확인한다.

```text
인증 사용자 ID
      ↓
게시글 작성자 ID 비교
      ↓
 ┌────┴────┐
 ↓         ↓
일치      불일치
 ↓         ↓
처리      403 Forbidden
```

자세한 게시글 API는 `posts.md`를 참고한다.
