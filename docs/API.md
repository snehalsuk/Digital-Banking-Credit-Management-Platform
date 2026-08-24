# API Reference

This document is filled in incrementally as each module is built. Full OpenAPI/Swagger docs are also served at runtime from `/api/v3/api-docs` (JSON) and `/api/swagger-ui.html` (UI) once the backend is running.

## Auth — `com.bankapp.auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Register a new user. Defaults to role `CUSTOMER` unless created by an admin flow. |
| POST | `/api/auth/login` | public | Authenticate with username/password; returns a JWT access + refresh token pair. |
| POST | `/api/auth/refresh` | public (valid refresh token required) | Exchange a refresh token for a new access token. |

## Customer / KYC — `com.bankapp.customer`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/customers/me` | authenticated | Fetch the caller's own customer profile (unmasked PAN, since the caller is the owner). |
| PUT | `/api/customers/me` | authenticated | Create/update the caller's own customer profile, including PAN and KYC-relevant fields. |
| POST | `/api/customers/{id}/kyc-status` | `LOAN_OFFICER`, `ADMIN` | Set the KYC status (`PENDING`/`VERIFIED`/`REJECTED`) for a given customer profile. |

## Planned — added in later build phases

- **Accounts** (`/api/accounts/...`) — create/list/view bank accounts.
- **Transactions** (`/api/transactions/...`) — deposit, withdraw, transfer, statement/history.
- **Loans / EMI** (`/api/loans/...`, `/api/emi/...`) — loan application, amortization schedule, EMI payments.
- **Credit score** (`POST /api/credit-score/lookup`) — PAN-based combined bureau + internal credit score and pending/overdue EMI lookup. PAN is sent in the request body, never in the URL, so it never lands in access logs. Requires explicit consent in the payload. See `docs/COMPLIANCE_BOUNDARIES.md` — bureau data is mocked by default.
- **Admin / audit** (`/api/admin/audit/...`) — paginated view of bureau lookup audit trail, admin-only.

All error responses use a consistent shape (`GlobalExceptionHandler`):

```json
{
  "timestamp": "2026-08-24T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable description",
  "path": "/api/auth/login"
}
```
