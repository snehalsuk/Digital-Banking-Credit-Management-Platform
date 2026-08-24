# API Reference

Full OpenAPI/Swagger docs are also served at runtime from `/api/v3/api-docs` (JSON) and `/api/swagger-ui.html` (UI) once the backend is running. This document is the hand-maintained, human-readable equivalent, pulled directly from the controllers.

Every error response uses a consistent shape (`GlobalExceptionHandler`):

```json
{
  "timestamp": "2026-08-24T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable description",
  "path": "/api/auth/login"
}
```

Unless noted "public", every endpoint requires a valid JWT access token in `Authorization: Bearer <token>`. Roles: `CUSTOMER`, `LOAN_OFFICER`, `ADMIN`. Where an endpoint's row says "own data only", the ownership check happens inside the service layer (not `@PreAuthorize`) because it depends on the resource being accessed, not a static role.

## Auth — `com.bankapp.auth` (`AuthController`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | public | `{ username, email, password }` | `201` `JwtResponse { accessToken, refreshToken, tokenType, username, role }`. New users default to role `CUSTOMER`. |
| POST | `/api/auth/login` | public | `{ username, password }` | `200` `JwtResponse`. `401` on bad credentials. |
| POST | `/api/auth/refresh` | public (valid refresh token) | `{ refreshToken }` | `200` `JwtResponse` (fresh access + refresh token pair). `401` if the refresh token is invalid/expired/not a refresh token. |

## Customer / KYC — `com.bankapp.customer` (`CustomerController`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/customers/me` | authenticated, own profile | — | `200` `CustomerProfileResponse` (PAN shown unmasked — caller is the owner). `404` if no profile exists yet. |
| PUT | `/api/customers/me` | authenticated, own profile | `CustomerProfileRequest { fullName, dob, pan, addressLine1, addressLine2, city, state, pincode, phone, consentGiven }` | `200` `CustomerProfileResponse`. Creates the profile on first call, updates thereafter. `409` if the PAN is already registered to a different profile. |
| POST | `/api/customers/{id}/kyc-status` | `LOAN_OFFICER`, `ADMIN` | `{ kycStatus: PENDING\|VERIFIED\|REJECTED }` | `200` `CustomerProfileResponse`. |

## Accounts — `com.bankapp.account` (`AccountController`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/accounts` | `CUSTOMER` | `{ accountType: SAVINGS\|CURRENT }` | `201` `AccountResponse`. Requires a completed KYC profile. |
| GET | `/api/accounts` | authenticated | query `customerId` (optional, `LOAN_OFFICER`/`ADMIN` only) | `200` `AccountResponse[]`. Without `customerId`, returns the caller's own accounts. |
| GET | `/api/accounts/{id}` | authenticated, own account (or officer/admin) | — | `200` `AccountResponse`. `403` if a `CUSTOMER` requests an account they don't own. |

## Transactions — `com.bankapp.transaction` (`TransactionController`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/accounts/{id}/deposit` | authenticated, own account | `{ amount, description? }` | `200` `TransactionResponse`. |
| POST | `/api/accounts/{id}/withdraw` | authenticated, own account | `{ amount, description? }` | `200` `TransactionResponse`. `409` on insufficient funds. |
| POST | `/api/transfers` | authenticated, own source account | `{ fromAccountId, toAccountId, amount, description? }` | `200` `TransactionResponse[]` (the paired TRANSFER_OUT/TRANSFER_IN rows). |
| GET | `/api/accounts/{id}/transactions` | authenticated, own account | query `page`, `size` (Pageable) | `200` `Page<TransactionResponse>`, newest first. |

All balance mutations run under a pessimistic row lock (`AccountRepository#findByIdForUpdate`) inside a single transaction, so concurrent operations on the same account never lose an update; `transfer` locks both accounts in ascending-id order to avoid deadlocks.

## Loans — `com.bankapp.loan` (`LoanController`, `EmiController`, `AdminLoanController`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/loans/apply` | `CUSTOMER` | `{ accountId, loanType, principal, interestRateAnnual, tenureMonths }` | `201` `LoanResponse` (status `PENDING`). |
| POST | `/api/loans/{id}/approve` | `LOAN_OFFICER`, `ADMIN` | — | `200` `LoanResponse` (status `ACTIVE`). Generates the full amortization schedule (`EmiCalculator`) and credits the principal to the linked account. |
| GET | `/api/loans` | authenticated | query `customerId`, `status` (officer/admin only; ignored for `CUSTOMER`, who always gets their own loans) | `200` `LoanResponse[]`. |
| GET | `/api/loans/{id}` | authenticated, own loan (or officer/admin) | — | `200` `LoanResponse`. |
| GET | `/api/loans/{id}/emi-schedule` | authenticated, own loan (or officer/admin) | — | `200` `EmiScheduleResponse[]`, ordered by installment number. |
| POST | `/api/loans/{id}/emi/{installmentNumber}/pay` | authenticated, own loan (or officer/admin) | `{ amount }` | `200` `EmiScheduleResponse`. Debits the linked account; closes the loan once every installment is paid. |
| POST | `/api/admin/loans/run-overdue-check` | `ADMIN` | — | `200` `{ updatedCount }`. Manually triggers the same batch job the `@Scheduled` daily task runs (`PENDING`→`OVERDUE`→`DEFAULTED` transitions by due date). |

## Credit score — `com.bankapp.creditscore` (`CreditScoreController`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/credit-score/lookup` | authenticated — `CUSTOMER` may only look up their own PAN; `LOAN_OFFICER`/`ADMIN` may look up any PAN | `{ pan, consentConfirmed, purpose? }` | `200` `CreditScoreLookupResponse { bureauScore, internalScore, combinedScore, scoreBand, tradeLines[], delinquencySummary, pendingEmis[], dataSource, lastUpdated }`. `400` if `consentConfirmed` is false. `404` if no customer profile matches the PAN. `403` if a `CUSTOMER` requests a PAN that isn't their own. |

PAN is sent in the request **body**, never a URL/query parameter, so it never lands in access logs. `dataSource` is `"MOCK"` whenever the active bureau client is `MockCreditBureauClient` (the default — see `docs/COMPLIANCE_BOUNDARIES.md`); the frontend shows a persistent "MOCK BUREAU DATA" banner in that case. Every lookup attempt — success, PAN-not-found, forbidden, or consent-denied — writes a `bureau_lookup_audit` row unconditionally, before any error is returned to the caller.

## Admin / audit — `com.bankapp.audit` (`AdminAuditController`)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/admin/audit/bureau-lookups` | `ADMIN` | query `panHash?`, `from?` (ISO instant), `to?` (ISO instant), plus `page`/`size`/`sort` (Pageable, defaults to newest first) | `200` `Page<BureauLookupAuditResponse>` — `{ id, requesterUserId, customerId, panHash, purpose, consentConfirmed, bureauProvider, responseStatus, requestedAt }` per row. `panHash` is the one-way deterministic hash only; the plaintext PAN is never stored anywhere, so there is nothing to unmask. `responseStatus` is one of `SUCCESS`, `NOT_FOUND`, `FORBIDDEN`, `CONSENT_DENIED`. |

## RBAC summary

| Endpoint group | `CUSTOMER` | `LOAN_OFFICER` | `ADMIN` |
|---|---|---|---|
| `/api/auth/**` | public | public | public |
| `/api/customers/me` | own profile | own profile (as themselves) | own profile (as themselves) |
| `/api/customers/{id}/kyc-status` | ✗ | ✓ any customer | ✓ any customer |
| `/api/accounts`, `/api/accounts/{id}`, transactions | own accounts only | own + any (via `customerId`) | own + any (via `customerId`) |
| `/api/loans/apply` | ✓ (self) | ✗ | ✗ |
| `/api/loans/{id}/approve` | ✗ | ✓ | ✓ |
| `/api/loans`, `/api/loans/{id}`, EMI endpoints | own loans only | own + any | own + any |
| `/api/admin/loans/run-overdue-check` | ✗ | ✗ | ✓ |
| `/api/credit-score/lookup` | own PAN only | any PAN (audited) | any PAN (audited) |
| `/api/admin/audit/bureau-lookups` | ✗ | ✗ | ✓ |
