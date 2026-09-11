# Auth API

## 1. 개요

사용자 인증을 위한 API이다.

JWT Access Token을 사용하여 API 인증을 처리하며, Refresh Token을 이용하여 Access Token을 갱신한다.

제공하는 기능은 다음과 같다.

* 회원가입
* 로그인
* JWT Access Token 발급
* JWT 인증
* 현재 인증 사용자 조회
* Refresh Token 발급
* Access Token 갱신
* Refresh Token Rotation
* Logout

---

## 2. API Endpoint

| Method | Endpoint        | 인증  | 설명                            |
| ------ | --------------- | --- | ----------------------------- |
| `POST` | `/auth/signup`  | 불필요 | 회원가입                          |
| `POST` | `/auth/login`   | 불필요 | 로그인 및 Access/Refresh Token 발급 |
| `GET`  | `/auth/me`      | 필요  | 현재 인증 사용자 조회                  |
| `POST` | `/auth/refresh` | 불필요 | Refresh Token을 이용한 Token 갱신   |
| `POST` | `/auth/logout`  | 불필요 | Refresh Token 폐기              |

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

이메일과 비밀번호를 검증하고 JWT Access Token과 Refresh Token을 발급한다.

### Request

```json
{
    "email": "test@test.com",
    "password": "password123"
}
```

### Response

#### `201 Created`

```json
{
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

Access Token은 인증이 필요한 API 요청에 사용한다.

```http
Authorization: Bearer <accessToken>
```

Refresh Token은 Access Token이 만료되었을 때 새로운 Access Token을 발급받기 위해 사용한다.

### 로그인 처리 과정

```text
이메일 조회
    ↓
비밀번호 Hash 조회
    ↓
bcrypt.compare()
    ↓
Access Token 발급
    ↓
Refresh Token 발급
    ↓
Refresh Token bcrypt Hash
    ↓
DB 저장
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

### 7.1 Access Token Payload

Access Token에는 다음 정보를 저장한다.

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

```text
JWT_ACCESS_EXPIRES_IN=1h
```

Access Token은 `JWT_ACCESS_SECRET`을 사용하여 서명한다.

### 7.2 Refresh Token Payload

Refresh Token에는 다음 정보를 저장한다.

```json
{
    "sub": 1
}
```

| Field | Description |
| ----- | ----------- |
| `sub` | 사용자 ID      |

Refresh Token에는 Access Token보다 적은 정보를 저장하며, 인증에 필요한 최소한의 사용자 식별 정보만 포함한다.

Refresh Token은 `JWT_REFRESH_SECRET`을 사용하여 서명한다.

기본 만료 시간은 **7일**이다.

```text
JWT_REFRESH_EXPIRES_IN=7d
```

Access Token과 Refresh Token은 서로 다른 Secret과 만료 시간을 사용한다.

---

## 8. Refresh Token

Refresh Token은 Access Token을 갱신하기 위해 사용한다.

### 8.1 Refresh Token 저장

Refresh Token은 데이터베이스에 평문으로 저장하지 않는다.

```text
Refresh Token
     ↓
bcrypt.hash()
     ↓
Token Hash
     ↓
refresh_tokens
```

`refresh_tokens` 테이블에는 다음 정보를 저장한다.

| Field       | Description               |
| ----------- | ------------------------- |
| `id`        | Refresh Token 식별자         |
| `userId`    | 사용자 ID                    |
| `tokenHash` | bcrypt로 해시된 Refresh Token |
| `expiresAt` | Refresh Token 만료 시간       |
| `createdAt` | 생성 시간                     |
| `revokedAt` | Refresh Token 폐기 시간       |

사용자와 Refresh Token은 `1:N` 관계를 가진다.

사용자가 삭제되면 연결된 Refresh Token도 `CASCADE`로 삭제된다.

### 8.2 Access Token 갱신

### POST `/auth/refresh`

Refresh Token을 이용하여 새로운 Access Token과 Refresh Token을 발급한다.

### Request

```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response

#### `201 Created`

```json
{
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

Refresh Token 검증 과정은 다음과 같다.

```text
Refresh Token
    ↓
JWT 서명 및 만료시간 검증
    ↓
사용자 조회
    ↓
DB의 활성 Refresh Token 조회
    ↓
bcrypt.compare()
    ↓
검증 성공
    ↓
기존 Refresh Token 폐기
    ↓
새로운 Access Token + Refresh Token 발급
```

---

## 9. Refresh Token Rotation

Refresh Token은 사용될 때마다 기존 Token을 폐기하고 새로운 Refresh Token을 발급한다.

예를 들어 최초 로그인에서 다음 Token이 발급되었다고 가정한다.

```text
Access Token  → AT-1
Refresh Token → RT-1
```

`RT-1`을 이용하여 `/auth/refresh`를 호출하면:

```text
RT-1
 ↓
/auth/refresh
 ↓
RT-1 폐기
 ↓
AT-2 + RT-2 발급
```

DB에서는 다음과 같이 관리된다.

```text
RT-1 → revoked
RT-2 → active
```

폐기된 `RT-1`을 다시 사용하는 경우:

```text
RT-1
 ↓
/auth/refresh
 ↓
활성 Refresh Token에 존재하지 않음
 ↓
401 Unauthorized
```

이를 통해 이미 사용된 Refresh Token의 재사용을 차단한다.

---

## 10. Logout

### POST `/auth/logout`

현재 사용 중인 Refresh Token을 폐기한다.

### Request

```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 처리 과정

```text
Refresh Token
    ↓
JWT 검증
    ↓
사용자 확인
    ↓
활성 Refresh Token 조회
    ↓
Token Hash 비교
    ↓
Refresh Token 폐기
```

로그아웃된 Refresh Token은 이후 `/auth/refresh`에서 사용할 수 없다.

```text
POST /auth/logout
    ↓
RT-1 revoked
    ↓
POST /auth/refresh
    ↓
401 Unauthorized
```

### Access Token Logout 정책

현재 구현에서는 Logout 시 Access Token을 별도로 폐기하지 않는다.

Access Token은 Stateless JWT로 동작하기 때문에 Logout 이후에도 기존 Access Token이 만료되기 전까지 유효하다.

즉:

```text
Logout
 ├── Refresh Token → 즉시 폐기
 └── Access Token  → 만료 시점까지 유효
```

Logout 이후에는 Refresh Token을 이용한 새로운 Access Token 발급이 차단된다.

---

## 11. 인증 실패

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

### Refresh Token 없음

```http
400 Bad Request
```

### 빈 Refresh Token

```http
400 Bad Request
```

### 잘못된 Refresh Token

```http
401 Unauthorized
```

### 만료된 Refresh Token

```http
401 Unauthorized
```

### 폐기된 Refresh Token

```http
401 Unauthorized
```

### Refresh Token 재사용

Rotation으로 이미 폐기된 Refresh Token을 다시 사용하는 경우:

```http
401 Unauthorized
```

### 존재하지 않는 사용자

Refresh Token의 사용자 정보에 해당하는 사용자가 존재하지 않는 경우:

```http
401 Unauthorized
```

---

## 12. 비밀번호 보안

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

## 13. 게시글 API와 인증

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

---

## 14. 전체 인증 흐름

전체 인증 흐름은 다음과 같다.

```text
                    Login
                      │
             ┌────────┴────────┐
             ↓                 ↓
       Access Token       Refresh Token
             │                 │
             │                 ↓
             │          bcrypt Hash 저장
             │                 │
             ↓                 │
       인증 API 요청            │
             │                 │
             │ Access Token     │
             │ 만료             │
             ↓                 │
        /auth/refresh ←────────┘
             │
             ↓
       기존 RT 폐기
             │
             ↓
   새로운 AT + 새로운 RT
             │
             ↓
          인증 계속
```

Logout 시에는 Refresh Token을 폐기한다.

```text
              Logout
                 │
                 ↓
        Refresh Token 폐기
                 │
        ┌────────┴────────┐
        ↓                 ↓
새로운 Token 발급      기존 Access Token
차단                   만료 전까지 유효
```

---

## 15. 보안 정책

현재 인증 구현에서는 다음 보안 정책을 적용한다.

* Access Token과 Refresh Token에 서로 다른 Secret 사용
* Access Token과 Refresh Token의 만료 시간 분리
* Refresh Token 평문 저장 금지
* Refresh Token bcrypt 해시 저장
* Refresh Token Rotation 적용
* 폐기된 Refresh Token 재사용 차단
* JWT Payload에 불필요한 정보 저장 금지
* 사용자 비밀번호 bcrypt 해시 저장
* `password` 컬럼 기본 조회 제외
* JWT Secret을 환경변수로 관리
* Access/Refresh Token을 로그에 출력하지 않음
* 사용자 삭제 시 Refresh Token `CASCADE` 삭제

현재 환경변수는 다음과 같이 관리한다.

```text
JWT_ACCESS_SECRET=your-access-secret
JWT_ACCESS_EXPIRES_IN=1h

JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

실제 운영 환경에서는 Secret을 안전하게 관리하고 소스 코드에 직접 포함하지 않는다.
