# Security Design

## Authentication — JWT

- Stateless authentication via JSON Web Tokens, signed HS256 with a base64-encoded 256-bit+ secret (`security.jwt.secret`, env var `JWT_SECRET`).
- **Access tokens**: short-lived, ~15 minutes (`JWT_ACCESS_EXPIRATION_MS`, default `900000`).
- **Refresh tokens**: longer-lived, ~7 days (`JWT_REFRESH_EXPIRATION_MS`, default `604800000`).
- `JwtTokenProvider` (`com.bankapp.common.security`) generates, validates, and parses both token types.
- `JwtAuthenticationFilter`, a `OncePerRequestFilter`, extracts the bearer token from `Authorization: Bearer <token>`, validates it, and populates the Spring Security `SecurityContext`.
- Frontend stores tokens (localStorage), attaches the access token to every request via an Axios interceptor, and on a 401 attempts exactly one silent refresh before forcing re-login.

## Password storage

- `BCryptPasswordEncoder` at strength 12. Passwords are never logged, never returned in any API response.

## Authorization — RBAC

- Three roles: `CUSTOMER`, `LOAN_OFFICER`, `ADMIN`.
- Enforced with Spring Security 6 `@PreAuthorize` (`@EnableMethodSecurity`) at the controller/service layer — not just hidden client-side.
- General rule: `CUSTOMER` can only access their own data; `LOAN_OFFICER`/`ADMIN` can access any customer's data, but every such access to PAN-linked data is unconditionally audit-logged.

## PAN encryption at rest

- India's PAN (Permanent Account Number, the standard bank/credit-bureau customer identifier) is sensitive PII and is **never stored or logged in plaintext**.
- `PanAttributeConverter` (`com.bankapp.common.security.crypto`) is a JPA `AttributeConverter<String, String>` that encrypts PAN with **AES-256-GCM** before it is written to the `customer_profile.pan_encrypted` column, and decrypts on read.
  - Key: base64-encoded 256-bit key from `security.crypto.pan-key`, env var `PAN_ENCRYPTION_KEY`.
  - A random IV is generated per encryption and prepended to the ciphertext; the combined `IV || ciphertext || GCM tag` bytes are base64-encoded for storage.
- Because the encrypted column is not searchable, a separate **deterministic** lookup value is maintained: `PanHasher` computes `HMAC-SHA256(pan, pepper)` (hex-encoded) into `customer_profile.pan_hash`, a unique indexed column. The pepper is a separate secret from the AES key (`security.crypto.pan-pepper`, env var `PAN_HASH_PEPPER`), so a compromise of one secret alone does not compromise the other property.
- All lookups by PAN (e.g. the credit score module, added in a later phase) hash the incoming PAN and query by `pan_hash` — the encrypted column is decrypted only after the row is found, and only for authorized responses.

## Masking

- `MaskingUtil` (`com.bankapp.common.util`) masks PAN and account numbers in any response or log line that isn't going to the data's owner (or an officer/admin performing an authorized, audited lookup), e.g. `maskPan("ABCPD1234F")` → `"XXXXXX234F"` (last 4 characters visible).

## Consent

- Every credit bureau lookup (added in a later phase) requires an explicit `consentConfirmed=true` flag in the request; requests without it are rejected before any bureau call is made.
- Consent state and timestamp are captured on the customer profile (`consent_given`, `consent_timestamp`).

## Audit logging

- Every PAN-based bureau lookup (added in a later phase) is unconditionally logged — success, failure, or consent-denied — via `AuditService`, viewable by admins only.

## Rate limiting

- Bucket4j-based rate limiting (added in a later phase) on the login endpoint and the credit-score lookup endpoint, to blunt credential-stuffing and lookup-abuse.

## Transport / CORS

- `SecurityConfig` configures stateless sessions (no server-side session state), registers the JWT filter, and permits only `/api/auth/**` and the OpenAPI docs endpoints without authentication — every other endpoint requires a valid JWT.
- CORS is scoped to the frontend dev origin (`http://localhost:5173`); production origins should be added via configuration, not hardcoded.

## Secrets

All cryptographic secrets and the DB password are supplied via environment variables, never hardcoded in source:

| Env var | Purpose |
|---|---|
| `JWT_SECRET` | HS256 signing key for JWT access/refresh tokens (base64, ≥256 bit) |
| `PAN_ENCRYPTION_KEY` | AES-256-GCM key for PAN-at-rest encryption (base64, 256 bit) |
| `PAN_HASH_PEPPER` | HMAC-SHA256 pepper for the deterministic PAN lookup hash |
| `DB_USERNAME` / `DB_PASSWORD` | MySQL credentials |
| `MYSQL_ROOT_PASSWORD` | Root password for the docker-compose MySQL container |

`application-dev.yml` ships with clearly-marked, non-production default values for local development convenience. `application-prod.yml` has **no defaults** for these — the application fails to start if they are not supplied.

See `docs/COMPLIANCE_BOUNDARIES.md` for what these mechanisms do and do **not** establish from a regulatory/compliance standpoint.
