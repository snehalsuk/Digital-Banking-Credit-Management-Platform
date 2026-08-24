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

### 1. Start MySQL

```bash
docker-compose up -d
```

This starts a MySQL 8 container (`bankapp` database) on `localhost:3306`. Default dev credentials are in `docker-compose.yml` / `backend/src/main/resources/application-dev.yml` — override via environment variables for anything beyond local dev.

### 2. Run the backend

```bash
cd backend
./mvnw spring-boot:run     # or: mvn spring-boot:run
```

The backend runs on `http://localhost:8080` by default, with the `dev` Spring profile active (see `application-dev.yml`). Flyway applies migrations automatically on startup.

Key environment variables (all have dev-only defaults in `application-dev.yml`; production requires them explicitly — see `application-prod.yml`):

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | JWT signing key (base64, ≥256 bit) |
| `PAN_ENCRYPTION_KEY` | AES-256-GCM key for PAN-at-rest encryption (base64, 256 bit) |
| `PAN_HASH_PEPPER` | HMAC pepper for the deterministic PAN lookup hash |
| `BUREAU_PROVIDER` | `mock` (default) or `real` — see `docs/COMPLIANCE_BOUNDARIES.md` |

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default and expects the backend at `http://localhost:8080/api` (override via `VITE_API_BASE_URL`).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — module design, repo layout, data model
- [`docs/SECURITY.md`](docs/SECURITY.md) — JWT, PAN encryption/masking, consent, rate limiting, RBAC
- [`docs/COMPLIANCE_BOUNDARIES.md`](docs/COMPLIANCE_BOUNDARIES.md) — **read this first** — what's real vs. simulated/mocked, and what this codebase does not certify
- [`docs/API.md`](docs/API.md) — endpoint reference, updated as modules are built

## Build status

This project is being built in phases. Completed so far:

1. **Scaffolding** — repo structure, Docker Compose (MySQL), backend/frontend skeletons, docs.
2. **Auth + Customer/KYC** — registration/login/refresh, JWT, PAN encryption at rest, KYC profile workflow.

Not yet implemented (package skeletons exist, ready for later phases): accounts, transactions, loans/EMI, credit score + bureau integration, admin/audit views, and the corresponding test suite.
