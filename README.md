# Blog Backend

개인 블로그에 사용할 백엔드 프로젝트입니다.

NestJS와 PostgreSQL을 사용하여 회원가입, 로그인, 게시글 작성·조회·수정·삭제 기능을 구현했습니다. 프론트엔드는 별도 저장소에서 개발하고 있으며, 이 저장소에서는 API와 데이터베이스를 관리합니다.

기능을 하나씩 구현하면서 인증 처리, 작성자 권한 확인, 데이터베이스 변경 과정을 정리하고 있습니다. 현재 구현된 내용과 실행 방법은 아래와 같습니다.

- [프론트엔드 저장소](https://github.com/SuperNova080710/Blog-frontend)
- [인증 API 문서](docs/api/auth.md)
- [게시글 API 문서](docs/api/posts.md)

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 실행 환경 | Node.js 24, npm (컨테이너/CI) |
| 언어 | TypeScript 6 |
| 서버 | NestJS 11, Express 5 |
| 데이터베이스 | PostgreSQL 16 |
| ORM | TypeORM 0.3 |
| 인증 | Passport, JWT, bcrypt |
| 입력값 검증 | class-validator, class-transformer |
| 환경 변수 검증 | @nestjs/config, Joi |
| 컨테이너 | Docker, Docker Compose |

Node.js와 PostgreSQL 버전은 저장소의 Docker 설정을 기준으로 작성했습니다. CI와 배포 이미지 준비 과정은 [컨테이너·CI 가이드](docs/container-ci.md)에 기록하며, GitHub Actions 및 K3s 실제 운영 배포 성공 여부는 별도 검증합니다. 패키지의 버전 범위는 [package.json](package.json), 고정된 의존성 정보는 [package-lock.json](package-lock.json)에서 확인할 수 있습니다.

## 구현한 기능

### 사용자 인증

- 이메일과 비밀번호로 회원가입하고 로그인할 수 있습니다.
- 중복된 이메일은 가입할 수 없으며, 비밀번호는 bcrypt로 해시하여 저장합니다.
- 로그인하면 Access Token과 Refresh Token을 반환합니다.
- Access Token으로 현재 사용자 정보를 조회하고 인증이 필요한 API를 호출합니다.
- Refresh Token은 해시하여 데이터베이스에 저장합니다.
- 토큰 갱신 시 일치하는 활성 Refresh Token 기록을 폐기하고 토큰을 다시 발급하는 구조입니다.
- 로그아웃 시 요청에 사용된 Refresh Token 기록을 폐기합니다.

토큰 만료 시간은 환경 변수로 설정합니다. `.env.example`에서는 Access Token을 1시간, Refresh Token을 7일로 설정했습니다.

현재 로그아웃은 이미 발급된 Access Token을 즉시 무효화하지 않습니다. Access Token은 만료 전까지 사용할 수 있습니다. Refresh Token 재사용을 탐지하여 해당 사용자의 모든 세션을 폐기하는 기능도 별도로 구현되어 있지 않습니다.

### 게시글

- 로그인한 사용자는 게시글을 작성할 수 있습니다.
- 게시글 목록과 상세 내용은 로그인하지 않아도 조회할 수 있습니다.
- 목록은 작성일 내림차순으로 조회하며 페이지네이션을 지원합니다.
- 게시글 수정과 삭제는 작성자 본인만 할 수 있습니다.
- 작성자 정보는 요청 본문으로 받지 않고 인증된 사용자 정보로 연결합니다.

제목은 1~200자, 내용은 1자 이상이어야 합니다. 목록 조회는 기본적으로 `page=1`, `limit=10`을 사용하며, 한 페이지에 최대 100개까지 조회할 수 있습니다.

### 공통 처리

- DTO에 정의한 규칙으로 요청 데이터를 검증합니다.
- DTO에 없는 필드가 전달되면 요청을 거부합니다.
- 일반적인 성공 응답은 `data`로 감싸서 반환합니다.
- 데이터베이스 스키마는 마이그레이션으로 관리하며 `synchronize`는 사용하지 않습니다.

## 로컬 실행 방법

아래 명령은 Bash 기준이며, 저장소 루트에서 실행합니다. 검증 대상 환경은 Node.js 24와 npm, PostgreSQL 16입니다. PostgreSQL을 Docker로 실행하려면 Docker도 준비되어 있어야 합니다.

### 1. 저장소와 의존성 준비

```bash
git clone https://github.com/SuperNova080710/Blog-backend.git
cd Blog-backend
npm ci
cp .env.example .env
```

### 2. 환경 변수 설정

`.env`의 데이터베이스 정보와 JWT 서명 키를 본인 환경에 맞게 수정합니다.

| 변수 | 설명 | 로컬 설정 예시 |
| --- | --- | --- |
| `NODE_ENV` | 실행 환경 | `development` |
| `PORT` | API 서버 포트 | `3000` |
| `DB_HOST` | 데이터베이스 호스트 | `localhost` |
| `DB_PORT` | 데이터베이스 포트 | `5432` |
| `DB_USERNAME` | 데이터베이스 사용자 | `blog` |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | 직접 설정 |
| `DB_DATABASE` | 데이터베이스 이름 | `blog` |
| `JWT_ACCESS_SECRET` | Access Token 서명 키 | 직접 생성 |
| `JWT_ACCESS_EXPIRES_IN` | Access Token 만료 시간 | `1h` |
| `JWT_REFRESH_SECRET` | Refresh Token 서명 키 | 별도로 생성 |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 만료 시간 | `7d` |

JWT 서명 키는 아래 명령을 각각 실행하여 서로 다른 값으로 설정합니다. `.env.example`의 예시 문자열을 실제 키로 사용하지 않습니다.

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Refresh Token 만료 시간은 현재 코드에서 `30m`, `12h`, `7d`처럼 숫자와 `s`, `m`, `h`, `d` 중 하나를 조합한 형식으로 처리합니다. `.env`는 Git에 포함하지 않습니다.

### 3. 데이터베이스 준비

이미 사용 중인 PostgreSQL이 있다면 `.env`에 설정한 사용자와 데이터베이스를 준비합니다.

별도의 로컬 개발용 DB가 필요하면 다음과 같이 실행할 수 있습니다. 아래 비밀번호는 실행 전에 직접 정한 값으로 바꾸고, `.env`에도 같은 값을 입력합니다. 호스트의 5432 포트가 비어 있어야 합니다.

```bash
docker run -d \
  --name blog-postgres-local \
  -e POSTGRES_USER=blog \
  -e POSTGRES_PASSWORD='CHANGE_ME_LOCAL_DB_PASSWORD' \
  -e POSTGRES_DB=blog \
  -p 127.0.0.1:5432:5432 \
  -v blog-postgres-local-data:/var/lib/postgresql/data \
  postgres:16
```

데이터베이스가 연결을 받을 준비가 되었는지 확인합니다.

```bash
docker exec blog-postgres-local pg_isready -U blog -d blog
```

### 4. 마이그레이션과 서버 실행

`.env`의 `NODE_ENV=development` 상태에서 실행합니다.

```bash
npm run migration:run
npm run migration:show
npm run dev
```

기본 API 주소는 `http://localhost:3000`입니다. 다른 터미널에서 응답을 확인합니다.

```bash
curl http://localhost:3000/health-check
curl 'http://localhost:3000/posts?page=1&limit=10'
```

`/health-check`는 상태 문자열과 시간을 반환하는 엔드포인트입니다. 별도로 데이터베이스 상태까지 점검하는 기능은 아닙니다.

## 주요 API

| Method | Endpoint | 인증 및 권한 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | 불필요 | 회원가입 |
| `POST` | `/auth/login` | 불필요 | 로그인 및 토큰 발급 |
| `GET` | `/auth/me` | Access Token | 현재 사용자 조회 |
| `POST` | `/auth/refresh` | 본문에 Refresh Token | 토큰 갱신 |
| `POST` | `/auth/logout` | 본문에 Refresh Token | Refresh Token 폐기 |
| `GET` | `/posts` | 불필요 | 게시글 목록 조회 |
| `GET` | `/posts/:id` | 불필요 | 게시글 상세 조회 |
| `POST` | `/posts` | Access Token | 게시글 작성 |
| `PATCH` | `/posts/:id` | Access Token, 작성자 본인 | 게시글 수정 |
| `DELETE` | `/posts/:id` | Access Token, 작성자 본인 | 게시글 삭제 |
| `GET` | `/health-check` | 불필요 | 서버 응답 확인 |

Access Token은 다음 헤더로 전달합니다.

```http
Authorization: Bearer <accessToken>
```

Refresh Token은 쿠키가 아닌 JSON 요청 본문으로 전달합니다.

```json
{
  "refreshToken": "<refreshToken>"
}
```

단건 조회와 로그인 등의 응답은 `{ "data": ... }` 형태입니다. 게시글 목록은 `{ "data": [...], "meta": { ... } }` 형태로 페이지 정보를 함께 반환합니다. 게시글 삭제는 `204 No Content`이며 응답 본문이 없습니다.

요청과 응답의 상세 예시는 [인증 API](docs/api/auth.md)와 [게시글 API](docs/api/posts.md) 문서에서 확인할 수 있습니다. 일부 오류 메시지 예문은 설명용 한국어이며, 실제 메시지는 현재 코드와 다를 수 있습니다.

## Docker 구성

[Dockerfile](Dockerfile)은 Node.js 22 Alpine 기반의 멀티 스테이지 빌드를 사용합니다. 빌드 단계에서 TypeScript를 컴파일하고, 실행 단계에서는 운영 의존성과 `dist`를 사용합니다.

[docker/docker-compose.yml](docker/docker-compose.yml)은 앱과 PostgreSQL 16을 함께 실행하는 구성입니다.

- 앱은 데이터베이스에 `DB_HOST=db`로 접속합니다.
- PostgreSQL 데이터는 `docker/data/postgres`에 저장합니다.
- DB에는 `pg_isready`를 사용하는 Health Check가 설정되어 있습니다.
- 앱과 DB에는 `restart: unless-stopped`가 설정되어 있습니다.
- 앱의 3000 포트는 컨테이너 네트워크 내부에만 노출합니다.
- `proxy-network`는 외부 네트워크이므로 실행 전에 준비되어 있어야 합니다.

이 Compose 파일은 별도의 리버스 프록시 환경을 전제로 합니다. 파일 자체에 Nginx, HTTPS 인증서, 호스트 포트 공개 설정은 포함되어 있지 않습니다. Compose로 실행하는 것만으로 `localhost:3000`에 접속할 수 있는 구성은 아닙니다.

환경 변수는 저장소 루트의 `.env`를 명시해서 전달합니다. 외부 네트워크와 프록시, DB 스키마 준비가 끝난 환경에서는 다음 명령으로 앱과 DB를 실행합니다.

```bash
docker compose --env-file .env -f docker/docker-compose.yml up -d --build
```

앱 시작 시 마이그레이션은 자동 실행되지 않습니다. 운영 이미지에는 개발용 TypeScript 실행 도구도 포함하지 않으므로, 로컬 개발용 `npm run migration:run`을 운영 컨테이너에서 그대로 실행하는 방식으로 배포하지 않습니다. 운영 DB 마이그레이션과 복구 절차는 후속 문서화 작업에 포함합니다.

## 주요 경로

| 경로 | 역할 |
| --- | --- |
| `src/main.ts` | 서버 실행, 공통 입력 검증 및 응답 처리 |
| `src/app.module.ts` | 모듈 등록, 환경 변수 검증, DB 연결 |
| `src/modules/auth/` | 회원가입, 로그인, JWT 인증 |
| `src/modules/refresh-tokens/` | Refresh Token 기록 저장과 폐기 |
| `src/modules/users/` | 사용자 조회 및 저장 |
| `src/modules/posts/` | 게시글 API와 작성자 권한 검사 |
| `src/entities/` | TypeORM 엔티티 |
| `src/database/data-source.ts` | 마이그레이션용 데이터베이스 설정 |
| `src/migrations/` | 데이터베이스 변경 이력 |
| `docs/api/` | 인증 및 게시글 API 문서 |
| `docker/docker-compose.yml` | 앱과 데이터베이스 컨테이너 구성 |

## 주요 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 변경 사항을 감지하는 개발 서버 실행 |
| `npm start` | Nest 서버 실행 |
| `npm run build` | TypeScript 빌드 |
| `npm run start:prod` | 빌드된 서버 실행 |
| `npm run migration:show` | 마이그레이션 적용 상태 확인 |
| `npm run migration:run` | 적용되지 않은 마이그레이션 실행 |
| `npm run migration:revert` | 마지막 마이그레이션 되돌리기 |

새 마이그레이션은 변경 내용을 구분할 수 있는 이름으로 생성합니다.

```bash
npm run typeorm -- migration:generate src/migrations/DescribeYourChange
```

자동 생성된 SQL은 적용 전에 확인합니다. 운영 데이터베이스에서 되돌리기를 실행할 때는 데이터 손실 여부와 백업 상태도 먼저 확인해야 합니다.

## 현재 남은 작업

인증과 게시글 API, 마이그레이션, Docker 구성은 구현되어 있습니다. 다만 저장소에 구현된 내용과 운영 환경에서 검증된 결과는 구분해서 관리합니다.

- `npm test`는 현재 실패 메시지를 출력하는 기본 스크립트입니다. 자동 테스트는 아직 구성되어 있지 않습니다.
- GitHub Actions 기반 CI/CD는 [Issue #9](https://github.com/SuperNova080710/Blog-backend/issues/9)에서 관리합니다.
- 로그 관리, 앱 컨테이너 Health Check, DB 백업, 장애 복구와 롤백 절차는 [Issue #10](https://github.com/SuperNova080710/Blog-backend/issues/10)에서 관리합니다.
- 현재 `src/main.ts`에는 CORS 허용 설정이 없습니다. 브라우저에서 다른 출처의 API를 호출하려면 프록시 경로나 CORS 구성을 확인해야 합니다.

큰 작업은 이슈와 브랜치를 나누어 진행하고, 세부 작업과 확인 결과는 해당 이슈와 PR에 남깁니다.
