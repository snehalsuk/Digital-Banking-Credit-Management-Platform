# Architecture

## Overview

A full-stack banking application: React (Vite + TypeScript) frontend, Java 17 / Spring Boot 3.x (Maven) backend, MySQL 8 database with Flyway-managed schema migrations. The headline feature is a PAN-based (India tax ID) credit score and pending-EMI lookup, built on top of standard banking primitives (auth, KYC, accounts, transactions, loans).

## Repo layout

```
banking-application/
├── docker-compose.yml       # MySQL 8 for local dev
├── docs/                    # This file, SECURITY.md, COMPLIANCE_BOUNDARIES.md, API.md
├── backend/                 # Spring Boot 3.x, Java 17, Maven
│   ├── pom.xml
│   ├── src/main/java/com/bankapp/
│   │   ├── BankingApplication.java
│   │   ├── common/          # config, security, security.crypto, exception, util
│   │   ├── auth/             # entity, repository, service, controller, dto
│   │   ├── customer/         # entity, repository, service, controller, dto (KYC/PAN)
│   │   ├── account/          # accounts (scaffolded, implemented in a later phase)
│   │   ├── transaction/      # ledger (scaffolded, implemented in a later phase)
│   │   ├── loan/              # loans + EMI (scaffolded, implemented in a later phase)
│   │   ├── creditscore/      # credit score + bureau integration (scaffolded)
│   │   └── audit/             # audit logging (scaffolded)
│   └── src/main/resources/
│       ├── application.yml, application-dev.yml, application-prod.yml
│       └── db/migration/     # Flyway V1, V2, ... migrations
└── frontend/                 # Vite + React + TypeScript
    └── src/{main.tsx, App.tsx, api/, auth/, pages/, components/, types/, routes/}
```

## Backend modules

- **common** — cross-cutting infrastructure: Spring Security configuration, JWT issuing/validation, AES-256-GCM PAN encryption (`PanAttributeConverter`), deterministic PAN hashing for lookups (`PanHasher`), global exception handling, PAN/account-number masking utilities.
- **auth** — user accounts, roles (`CUSTOMER`, `LOAN_OFFICER`, `ADMIN`), registration/login/refresh issuing JWT access + refresh token pairs.
- **customer** — customer KYC profile: encrypted PAN at rest, hashed PAN for indexed lookup, consent capture, KYC status workflow (`PENDING` → `VERIFIED`/`REJECTED`).
- **account** — bank accounts and balances.
- **transaction** — ledger-style deposit/withdraw/transfer with pessimistic row-level locking to prevent race conditions (proven under concurrency by `TransactionServiceIT`).
- **loan** — loan origination, reducing-balance EMI amortization (`EmiCalculator`), a scheduled job marking overdue installments.
- **creditscore** — internal scoring from the bank's own repayment history, combined with a swappable credit bureau client (mock by default; see `docs/COMPLIANCE_BOUNDARIES.md`).
- **audit** — immutable audit log of every PAN-based bureau lookup (success, failure, or consent-denied), queryable by admins via `AdminAuditController`.

## Data model

Each module owns its own Flyway migration(s):

- `V1__init_users_and_roles.sql` — `users`
- `V2__customer_profile.sql` — `customer_profile` (PAN encrypted + hashed, KYC status, consent)
- `V3__accounts.sql` — `accounts`
- `V4__transactions.sql` — `transactions` (ledger)
- `V5__loans_and_emi.sql` — `loans`, `emi_schedule`
- `V6__credit_score.sql` — `credit_score_snapshot`, `bureau_lookup_audit`

PAN is never stored or logged in plaintext. Only the deterministic `pan_hash` column is ever used in `WHERE` clauses; the `pan_encrypted` column is AES-256-GCM ciphertext, decrypted only when returning data to its owner or an authorized officer/admin.

## Security

See `docs/SECURITY.md` for the full design: JWT auth, BCrypt password hashing, RBAC via `@PreAuthorize`, PAN encryption/masking, consent capture, and rate limiting.

## Frontend

Vite + React + TypeScript SPA. `api/apiClient.ts` wraps Axios with a JWT request interceptor and a 401-triggered refresh flow. `auth/AuthContext.tsx` holds session state; `ProtectedRoute` and `RoleGuard` gate routes client-side (the backend is the real authority — every route is also enforced server-side).

## Build phases

All 7 planned phases are complete: scaffolding; auth + customer/KYC; accounts + transactions; loans + EMI; credit score; admin/audit views; tests + full Docker stack. See the root `README.md` "Build status" section and `docs/API.md` for the full endpoint reference.

## Testing

- **Unit tests** (`backend/src/test/java/...`, run by `mvn test`, no Docker needed): `EmiCalculatorTest` (amortization correctness), `InternalScoringServiceTest` (score clamping/formula, Mockito), `MaskingUtilTest`, `PanAttributeConverterTest` (encrypt/decrypt round-trip, random IV, deterministic hash).
- **Integration tests** (`*IT.java`, run by `mvn verify` via maven-failsafe-plugin, require Docker): `AuthControllerIT` (register→login→refresh against a real MySQL Testcontainers instance with real Flyway migrations), `TransactionServiceIT` (concurrent withdrawals/transfers proving the pessimistic-lock scheme has no lost updates), `CreditScoreControllerIT` (full lookup flow — success, consent-denied, PAN-not-found — each asserted to write the correct `bureau_lookup_audit` row).
- `AbstractIntegrationTest` (`backend/src/test/java/com/bankapp/`) is the shared Testcontainers MySQL base every `*IT` class extends, via `@DynamicPropertySource`.
