# Compliance Boundaries — Read This Before Evaluating This Codebase for Production

This document exists to make unambiguous what this codebase **is** and **is not**, from a regulatory and data standpoint. Read it before assuming any capability described elsewhere (`docs/SECURITY.md`, `docs/ARCHITECTURE.md`) implies formal compliance or a production-ready credit bureau integration.

## 1. Credit bureau data is 100% simulated by default

- This application does **not** ship with a real integration to CIBIL, Experian, Equifax, CRIF, or any other credit bureau.
- The `creditscore.bureau` package (added in a later build phase) defines a `CreditBureauClient` interface with a `MockCreditBureauClient` as the **default, active implementation** — it returns deterministic, synthetic data derived from the input PAN. No real bureau is ever contacted with this default configuration.
- A `RealCreditBureauClientStub` will document, in code comments, exactly what a real integration requires (endpoint, auth scheme, request/response contract) but will deliberately throw `UnsupportedOperationException` rather than silently behave like a real integration.
- **Going live with a real bureau requires the business operating this application to independently obtain a licensing/API agreement with that bureau.** This is a legal and commercial step outside the scope of this codebase. Once such an agreement exists:
  1. Set `bureau.provider=real` (env var `BUREAU_PROVIDER=real`).
  2. Populate `bureau.base-url`, `bureau.client-id`, `bureau.client-secret` (env vars `BUREAU_BASE_URL`, `BUREAU_CLIENT_ID`, `BUREAU_CLIENT_SECRET`) with credentials issued by the bureau.
  3. Implement a real `CreditBureauClient` against that bureau's actual API contract (the stub documents the expected shape but is not itself a working implementation).
- Any response surfaced to a user for a credit score or bureau-reported delinquency **must** carry a data-source indicator (`dataSource: "MOCK"`) so it is never mistaken for a real bureau result. This UI/API behavior is part of a later build phase.

## 2. This codebase does not constitute a banking license, NBFC registration, or formal regulatory compliance certification

- Building and running this software does **not** grant, imply, or substitute for:
  - A banking license or NBFC (Non-Banking Financial Company) registration in India, or an equivalent license in any other jurisdiction.
  - Formal certification of compliance with RBI (Reserve Bank of India) regulations governing banking, lending, or credit information.
  - Formal certification of compliance with India's Digital Personal Data Protection Act, 2023 (DPDP Act) or any other data protection law.
- Obtaining these is a **legal and business prerequisite** that the operating business must pursue independently — through legal counsel, regulatory filings, and audits — before this software (or any derivative of it) is used to serve real customers with real money or real credit decisions.
- Nothing in this repository's code, documentation, or test suite should be represented to a regulator, auditor, partner bank, or customer as evidence of such compliance.

## 3. What IS implemented in code — compliance-supporting infrastructure, not compliance itself

The following mechanisms exist in this codebase because they are good engineering practice and are consistent with the *spirit* of data-protection and financial-services regulation. They reduce risk and make a genuine compliance program easier to build — but by themselves they are infrastructure, not a substitute for legal certification:

| Mechanism | Where | What it does |
|---|---|---|
| PAN encryption at rest | `common.security.crypto.PanAttributeConverter` (AES-256-GCM) | PAN is never stored in plaintext in the database. |
| PAN masking | `common.util.MaskingUtil` | PAN and account numbers are masked in every API response and log line except to the data's verified owner (or an audited officer/admin lookup). |
| Consent capture | `customer` module fields (`consent_given`, `consent_timestamp`) + a later-phase requirement that bureau lookups include `consentConfirmed=true` | No bureau lookup proceeds without an explicit, recorded consent flag. |
| Audit logging | `audit` module (added in a later phase) | Every PAN-based bureau lookup — success, failure, or consent-denied — is logged immutably and is queryable by admins only. |
| RBAC | Spring Security `@PreAuthorize` across controllers | Customers can only reach their own data; officer/admin access to other customers' data is always audited. |
| JWT-based stateless auth, BCrypt password hashing | `common.security` | Standard authentication hardening. |
| Rate limiting | Bucket4j on login and credit-score endpoints (added in a later phase) | Blunts credential-stuffing and bureau-lookup abuse. |

## Summary

If you are evaluating this project for real-world/production use with real customer PAN data or real money movement: treat everything above the line as **engineering scaffolding that supports a future compliance program**, not as the compliance program itself. Obtain the necessary licenses, bureau agreements, and legal/regulatory sign-off before doing so.
