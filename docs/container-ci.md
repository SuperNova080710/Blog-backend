# 백엔드 컨테이너·CI/CD 준비 및 검증 기록 (#23 / #30)

> 2026-10-30 · 상태: CI 작성, **프로덕션 npm audit 7건(Critical 1)으로 첫 CI FAIL**. 보안 개선 후 재검증 필요; GHCR 미게시·K3s 미배포
> 연계: [2차 네트워크 프로젝트 #23](https://github.com/SuperNova080710/2nd-project-docs/issues/23) · [#30](https://github.com/SuperNova080710/2nd-project-docs/issues/30)

## 1. 구성 개요

- Node.js 24 `bookworm-slim` 기반 멀티스테이지 Dockerfile: 빌더에서 `npm ci`·NestJS 컴파일, 실행 이미지에서 `npm ci --omit=dev`와 `dist`만 배포.
- 컨테이너는 기본 `node` 사용자로 실행. 포트 3000, `node dist/main.js`.
- `.dockerignore`는 `.env`·인증서/비밀키·`docker/data`·Git 기록·빌드 캐시를 빌드 컨텍스트에서 제외.
- 운영 DB 연결 정보 및 JWT 서명 값은 이미지에 포함하지 않고 **실행 시 환경변수 또는 Kubernetes Secret**으로 주입.
- 운영 이미지 베이스 `node:24-bookworm-slim`은 현재 버전 계열 태그이며 **digest 고정 전**. 운영 반영 전 정확한 sha256 digest를 검토한다.

## 2. 런타임 환경변수 계약

| 변수 | 용도 | 보관 방식 |
| --- | --- | --- |
| `NODE_ENV`, `PORT` | 실행 모드(예: production), 포트(3000) | 일반 설정 |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE` | 프로젝트 테스트 PostgreSQL 위치/DB | 일반 설정 또는 필요 시 Secret |
| `DB_USERNAME`, `DB_PASSWORD` | DB 로그인 | Kubernetes Secret |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Access/Refresh 서명 | 각각 별도 Secret |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | 토큰 만료 주기 | 일반 설정 |

위 값은 `src/app.module.ts`의 Joi 스키마와 `.env.example`에서 확인한 필드입니다. 보안 키 및 비밀번호의 **실제 값은 Git, CI 로그 및 Docker 빌드 인자에 게시하지 않습니다.**

**DB 마이그레이션:** `synchronize: false`이며 이미지 시작 명령은 마이그레이션을 실행하지 않습니다. 새 프로젝트 전용 DB가 결정된 뒤, 승인된 별도 Job/명시적 절차에서만 실행하고 실패하면 배포 중단. `/health-check`는 기존 구현상 HTTP 애플리케이션 응답만 확인하며 DB 테이블·스키마 검증은 아닙니다.

## 3. GitHub Actions 정책

워크플로: [backend-ci.yml](../.github/workflows/backend-ci.yml)

| 이벤트 | 검사/행동 | 서버 영향 |
| --- | --- | --- |
| `main` 대상 PR 생성/갱신 | Node.js 24 `npm ci`, `npm run build`; 독립 보안 Job의 프로덕션/전체 `npm audit --audit-level=high`; Docker 빌드, 임시 PostgreSQL 및 `/health-check` 확인 | GitHub-hosted runner에 한정 |
| `main` push | 품질·독립 보안·컨테이너 검사 모두 성공하면 GHCR에 `ghcr.io/supernova080710/blog-backend:sha-<전체 커밋 SHA>` 게시 | 이미지 레지스트리에 게시, **K3s에는 배포하지 않음** |
| 수동 `workflow_dispatch` | 품질 및 컨테이너 테스트 | GHCR 게시/K3s 배포 없음 |
| 자동 K3s 배포 | **미구현** | SSH 복구 및 BoatingDuck 보안 승인 전 비활성 |

- 워크플로 기본 GitHub 토큰: `contents: read`; `main` 이미지 게시 Job만 `packages: write`.
- `actions/checkout`, `actions/setup-node`, `docker/login-action`은 확인된 git commit SHA로 고정.
- 임시 PostgreSQL은 테스트 전용 Docker 네트워크에서 실행하며 호스트 포트를 공개하지 않는다. 백엔드만 `127.0.0.1:3101`으로 연결해 HTTP 스모크한다.
- 테스트 DB/JWT 값은 CI에서 일회성으로 생성하여 임시 파일에 저장하고 Job 종료 시 제거. **운영 DB/실제 키 사용 금지**.
- 스모크 검사는 DB 서버 연결, API 기동, HTTP 상태, 비-root 실행 및 일부 파일 부재까지만 확인한다. ORM Migration, 로그인/게시글 E2E, 통합 비밀정보 스캔, 배포 롤백은 아직 검증하지 않는다.
- 저장소의 `npm test`는 실제 자동 테스트가 아닌 종료 코드 1의 placeholder이므로 **단위 테스트 실행 성공을 주장하지 않으며**, 후속 테스트 도입 전까지 CI에는 호출하지 않는다.
- PR 이벤트에서는 GHCR 패키지를 게시하지 않는다. GHCR 접근 정책·패키지 공개 설정 및 이미지 digest 관리 여부는 `main` 병합 후 따로 점검한다.

## 4. 수행/검증 상태

- [x] 기존 Dockerfile의 비권한 실행 미설정·빌드/실행 단계·파일 복사 구조 점검
- [x] `.dockerignore`의 `docker/data` 누락 및 환경값 제외 규칙 확인·보완
- [x] CI 품질 검사·임시 PostgreSQL 스모크 및 `main` GHCR 게시 **코드 작성**
- [x] 첫 GitHub Actions 실행에서 프로덕션 감사 실패 확인: [Run 41024482260](https://github.com/SuperNova080710/Blog-backend/actions/runs/41024482260)
- [ ] GitHub Actions `quality`, `security`, `container-smoke` **모두 실제 PASS**
- [ ] 프로덕션 취약점 7건(Critical 1/High 5/Moderate 1) 해결 및 전체 감사 0건 확인 ([보안 이슈 #31](../issues/31))
- [ ] 이미지 내부 의도치 않은 환경변수·비밀정보 여부 전수 검사
- [ ] GHCR 실제 push 후 digest 및 접근권한 검증
- [ ] 프로젝트 전용 DB 마이그레이션·인증/게시글 통합 검증
- [ ] K3s/Flannel/UFW·Ingress/WAF 안전 승인 후 CD 연결

**현재 판정:** CI SECURITY FAIL(원인 확인) / BACKEND BUILD & CONTAINER RE-TEST PENDING / GHCR PUBLISH BLOCKED / K3S DEPLOYMENT BLOCKED.

## 5. 운영 서버 보호

현재 Ubuntu 서버는 SSH 접속만 확인됐고 독립 복구 경로가 확보되지 않았습니다. `docker build/run`, `ufw`, `iptables`, NetworkManager 또는 K3s 서비스 활성화는 해당 서버에서 수행하지 않습니다. CI의 GitHub-hosted runner를 사용하여 서버 환경과 격리합니다. Docker `compose`의 기존 `proxy-network`는 Kubernetes 배포용이 아닙니다. 프론트엔드 WAF/Ingress와 프로젝트 전용 PostgreSQL 분리는 후속 #21/#26 작업에서 확정합니다.
