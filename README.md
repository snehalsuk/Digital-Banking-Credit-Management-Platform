# Banking Application

A full-stack banking application: React (Vite + TypeScript) frontend, Java 17 / Spring Boot 3.x backend, MySQL 8 database with Flyway migrations. Core feature (built in a later phase): PAN-based (India tax ID) credit score and pending-EMI lookup, combining the bank's own repayment history with a swappable, mock-by-default credit bureau client.

> **Before you evaluate this for production or real customer data, read [`docs/COMPLIANCE_BOUNDARIES.md`](docs/COMPLIANCE_BOUNDARIES.md).** Credit bureau data is 100% simulated by default, and this codebase does not constitute a banking license, NBFC registration, or formal RBI/DPDP Act compliance certification.

## Stack

- **Frontend**: React + TypeScript, built with Vite
- **Backend**: Java 17, Spring Boot 3.x, Maven
- **Database**: MySQL 8, schema managed by Flyway
- **Auth**: JWT (access + refresh tokens), BCrypt, role-based access control

## Repo layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full module breakdown.

```
banking-application/
├── docker-compose.yml   # MySQL 8 for local dev
├── docs/                # Architecture, security, compliance, API docs
├── backend/              # Spring Boot backend (Maven)
└── frontend/             # Vite + React + TypeScript frontend
```

## Running locally

Two ways to run this: the full containerized stack (one command, closest to how it would actually deploy), or local dev (MySQL in Docker, backend/frontend run natively with hot reload). Both read the same environment variables — copy `.env.example` to `.env` first if you want to override any dev default (neither path strictly requires it; every variable has a dev-safe default).

```bash
cp .env.example .env   # optional for local dev; edit values as needed
```

### Option A — full stack via Docker Compose

```bash
docker-compose up --build
```

This builds and starts three services:

- `db` — MySQL 8 (`bankapp` database), with a healthcheck the backend waits on before starting.
- `backend` — Spring Boot API, built via a multi-stage Maven/JDK 17 → JRE 17 `backend/Dockerfile`, on `http://localhost:8080`. Flyway migrations run automatically on startup.
- `frontend` — the Vite production build served by nginx (`frontend/Dockerfile` + `frontend/nginx.conf`), on `http://localhost:5173`. nginx reverse-proxies `/api/*` to the `backend` service and falls back to `index.html` for client-side routes.

Open `http://localhost:5173` once all three containers are up. Stop everything with `docker-compose down` (add `-v` to also drop the MySQL data volume).

### Option B — local dev (hot reload)

#### 1. Start MySQL

```bash
docker-compose up -d db
```

This starts just the MySQL 8 container (`bankapp` database) on `localhost:3306`. Default dev credentials are in `docker-compose.yml` / `backend/src/main/resources/application-dev.yml` — override via environment variables (or `.env`) for anything beyond local dev.

#### 2. Run the backend

```bash
cd backend
./mvnw spring-boot:run     # or: mvn spring-boot:run
```

The backend runs on `http://localhost:8080` by default, with the `dev` Spring profile active (see `application-dev.yml`). Flyway applies migrations automatically on startup.

Key environment variables (all have dev-only defaults in `application-dev.yml`; production requires them explicitly — see `application-prod.yml`; see `.env.example` for the full list with descriptions):

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | JWT signing key (base64, ≥256 bit) |
| `PAN_ENCRYPTION_KEY` | AES-256-GCM key for PAN-at-rest encryption (base64, 256 bit) |
| `PAN_HASH_PEPPER` | HMAC pepper for the deterministic PAN lookup hash |
| `BUREAU_PROVIDER` | `mock` (default) or `real` — see `docs/COMPLIANCE_BOUNDARIES.md` |

#### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default and expects the backend at `http://localhost:8080/api` (override via `VITE_API_BASE_URL`).

## Running the tests

```bash
cd backend
mvn test      # fast unit tests only (EmiCalculator, InternalScoringService, MaskingUtil, PanAttributeConverter, ...) — no Docker required
mvn verify    # also runs Testcontainers-backed integration tests (*IT.java) against a real MySQL container with real Flyway migrations — requires a running Docker daemon
```

```bash
cd frontend
npx tsc -b && npm run build   # type-checks and production-builds the frontend
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — module design, repo layout, data model
- [`docs/SECURITY.md`](docs/SECURITY.md) — JWT, PAN encryption/masking, consent, rate limiting, RBAC
- [`docs/COMPLIANCE_BOUNDARIES.md`](docs/COMPLIANCE_BOUNDARIES.md) — **read this first** — what's real vs. simulated/mocked, and what this codebase does not certify
- [`docs/API.md`](docs/API.md) — endpoint reference, updated as modules are built

## Build status

All planned phases are complete:

1. **Scaffolding** — repo structure, Docker Compose (MySQL), backend/frontend skeletons, docs.
2. **Auth + Customer/KYC** — registration/login/refresh, JWT, PAN encryption at rest, KYC profile workflow.
3. **Accounts + Transactions** — account opening, deposit/withdraw/transfer with pessimistic-lock concurrency safety, transaction history.
4. **Loans + EMI** — loan application/approval/disbursement, reducing-balance amortization schedule, EMI payments, scheduled overdue-marking job.
5. **Credit score** — internal repayment-history scoring, mock credit bureau client, combined score + pending-EMI lookup by PAN, unconditional audit logging.
6. **Admin/audit views** — admin-only paginated audit trail UI/API, RBAC pass across all controllers.
7. **Tests + full stack** — unit + Testcontainers integration tests, Dockerfiles for backend/frontend, full `docker-compose` stack.

See `docs/API.md` for the complete endpoint reference.
