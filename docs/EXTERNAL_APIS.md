# External APIs & Data Providers Needed for Production

This app currently runs entirely on **simulated data** — the credit score module uses `MockCreditBureauClient` (see `docs/COMPLIANCE_BOUNDARIES.md`). This document lists the real external APIs/services you would need to integrate, who provides them, and how access actually works, so going live is a scoped integration task rather than a mystery.

None of these are wired into the codebase. Each section below states whether it's required to launch, and roughly how hard it is to get access.

---

## 1. Credit bureaus (the core feature — PAN-based credit score)

India has exactly **four RBI-licensed Credit Information Companies (CICs)**. You need a commercial agreement with at least one of them (most lenders integrate two, for cross-checking/fallback).

| Bureau | Official site | Notes |
|---|---|---|
| **TransUnion CIBIL** | [transunioncibil.com](https://www.transunioncibil.com/product/cibil-commercial-report) | India's largest bureau, most widely used for retail + commercial credit reports. |
| **Experian India** | [developer.experian.com](https://developer.experian.com/) | First bureau in India to hold a full RBI CIC licence; has a proper self-serve developer portal. |
| **CRIF High Mark** | [crifhighmark.com](https://www.crifhighmark.com/) | Strongest coverage for microfinance/rural lending. |
| **Equifax India** | [developer.equifax.com](https://developer.equifax.com/products/apiproducts/credit-reports) | Global developer portal covers the India product too. |

### How access actually works — two paths

**Path A — Direct membership (what a real bank/NBFC does).**
You sign a member agreement directly with the bureau, get API credentials, and pay a per-pull rate. To be eligible, your business generally needs to be an **RBI-registered Credit Institution** (bank, NBFC, HFC, etc.) — this is a regulatory prerequisite, not a technical one. Setup takes weeks and involves legal/compliance review by the bureau.

**Path B — Aggregator/reseller APIs (faster, common for fintechs).**
Several licensed intermediaries resell bureau access via a single simpler API, without you needing your own CIC membership — useful if you're a fintech partnering with a lender rather than being one yourself. Examples that surfaced repeatedly in research: Surepass, Perfios, Karza (Perfios-owned), IDfy, Roopya. These are third-party commercial vendors, not the bureaus themselves — vet them yourself (data-sharing agreements, security posture, pricing) before choosing one; this list isn't an endorsement.

**Path C — Ride on a partner's membership.**
If you co-lend with or operate under a bank/NBFC partner, bureau pulls can happen under *their* CIC membership with data shared to you contractually. Common for early-stage lending fintechs.

### What to build when you're ready
`backend/src/main/java/com/bankapp/creditscore/bureau/RealCreditBureauClientStub.java` is the exact swap-in point — implement `CreditBureauClient` against whichever bureau/aggregator you sign with, set `BUREAU_PROVIDER=real` plus the `BUREAU_*` env vars, done.

### Governing law
Bureau data usage in India is governed by the **Credit Information Companies (Regulation) Act, 2005 (CICRA)**, RBI's Master Direction on Credit Information Reporting, and the **Digital Personal Data Protection Act, 2023 (DPDP)**.

---

## 2. PAN verification (confirm a PAN is real and matches a name)

Right now the app only validates PAN *format* (`^[A-Z]{5}[0-9]{4}[A-Z]$`) — it never checks the PAN actually exists or belongs to the stated person. For production KYC you need an actual verification call.

| Provider | Official site | Notes |
|---|---|---|
| **Protean eGov Technologies** (formerly NSDL e-Governance) | [proteantech.in/services/pan-opv](https://www.proteantech.in/services/pan-opv/) | Authorized by the Income Tax Department to run the official Online PAN Verification (OPV) service. |

**Integration specifics found**: registration requires a valid Protean user ID plus a **Class 2/3 Digital Signing Certificate** from a licensed Certificate Authority, used to sign JSON requests. The published technical spec (UAT/prod endpoints, request/response schema) is Protean's [PAN Verification API Integration Document](https://tinpan.proteantech.in/downloads/online-pan-verification/downloads/PAN%20Verification%20API%20Integration%20document%20V1.2.pdf). Protocol is HTTPS/POST/JSON.

An alternative is **UTIITSL**, the other Income-Tax-authorized PAN issuer/verifier — not researched in depth here, but worth comparing against Protean before committing.

---

## 3. Aadhaar eKYC (identity verification beyond PAN)

Not currently used by this app, but almost every real Indian bank/NBFC uses Aadhaar eKYC alongside PAN for full KYC. Flagging it because it's the natural next integration.

| What you need | Authority | Notes |
|---|---|---|
| **AUA** (Authentication User Agency) status, then **KUA** (KYC User Agency) status | [UIDAI](https://uidai.gov.in/en/ecosystem/authentication-ecosystem/authentication-requesting-agency.html) | AUA lets you use Aadhaar *authentication*; KUA (which requires AUA first) lets you pull actual demographic/eKYC data. |

This is a **much heavier lift** than the credit bureaus: you connect to UIDAI's CIDR through an **ASA (Authentication Service Agency)** intermediary, must pass a UIDAI-approved security audit of your infrastructure before going to production, and must meet eligibility criteria under UIDAI's "Schedule A." In practice, most fintechs become a **sub-AUA/sub-KUA** under an already-licensed partner rather than applying directly — same pattern as the "ride on a partner" path for credit bureaus. The formal AUA/KUA agreement text is public: [UIDAI AUA/KUA Agreement (PDF)](https://uidai.gov.in/images/resource/AUA_KUA_Agreement_v_40.pdf).

---

## 4. Account Aggregator framework (consented bank-statement / cash-flow data)

Also not currently used, but relevant if you ever want alternative-data credit scoring (e.g., scoring thin-file customers using their actual bank transaction history with their consent) rather than relying solely on bureau data.

| What it is | Official site | Notes |
|---|---|---|
| **Account Aggregator (AA) ecosystem** | [sahamati.org.in](https://sahamati.org.in/) | RBI-recognized open-finance framework; Sahamati is the RBI-designated Self-Regulatory Organisation for it. |

You'd integrate as a **Financial Information User (FIU)** against one of the live Account Aggregators (see [Sahamati's AA directory](https://sahamati.org.in/account-aggregators/)) using the standardized ReBIT API spec published at [api.rebit.org.in/schema](https://api.rebit.org.in/schema). One integration works across all AAs by design — that's the point of the framework. This is a genuinely good regulatory-grade alternative to scraping bank statements, and worth prioritizing over Aadhaar eKYC if the goal is *credit* decisioning rather than *identity* verification.

---

## 5. Other production infrastructure (not researched in depth — well-known, standard choices)

These aren't specific to banking/credit and weren't part of this research pass, but a real deployment will need them. Evaluate current pricing/terms yourself before committing to any:

- **SMS/OTP delivery** (login OTP, transaction alerts) — e.g. Twilio, MSG91, AWS SNS.
- **Transactional email** (statements, notifications) — e.g. AWS SES, SendGrid.
- **Payment rails for real money movement** — UPI via an NPCI-authorized PSP/bank partner, or a payment aggregator like Razorpay/Cashfree for card/netbanking rails. This is a separate, heavily regulated integration in its own right (PA/PG authorization from RBI) — out of scope of this app's current in-house ledger (`TransactionService`), which only moves money between accounts *within* this bank, not to/from the outside world.

---

## Summary: what's required to launch vs. nice-to-have

| Capability | Required to launch a real product? | Effort |
|---|---|---|
| One credit bureau (§1) | **Yes** — it's the core feature | High (RBI-registered entity, or aggregator/partner path) |
| PAN verification (§2) | **Yes** — currently only format-validated | Medium (Protean registration + digital signing cert) |
| Aadhaar eKYC (§3) | Recommended for full KYC, not strictly required | High (AUA/KUA audit process) |
| Account Aggregator (§4) | Optional — improves scoring for thin-file customers | Medium (standardized API, but new integration) |
| SMS/email/payments (§5) | Yes, for a usable product | Low–Medium (standard commercial vendors) |
| Banking license / NBFC registration | **Yes, and precedes all of the above** | Very high — legal/regulatory, not technical. See `docs/COMPLIANCE_BOUNDARIES.md`. |

---

## Sources

- [TransUnion CIBIL Enhanced Commercial Credit Information Report](https://www.transunioncibil.com/product/cibil-commercial-report)
- [Experian Global Developer Portal](https://developer.experian.com/)
- [CRIF High Mark — India's RBI Licensed Credit Bureau](https://www.crifhighmark.com/)
- [Equifax Developer — Credit Reports](https://developer.equifax.com/products/apiproducts/credit-reports)
- [Protean eGov — PAN OPV (Online PAN Verification)](https://www.proteantech.in/services/pan-opv/)
- [Protean PAN Verification API Integration Document (PDF)](https://tinpan.proteantech.in/downloads/online-pan-verification/downloads/PAN%20Verification%20API%20Integration%20document%20V1.2.pdf)
- [UIDAI — Authentication Requesting Agency / AUA-KUA ecosystem](https://uidai.gov.in/en/ecosystem/authentication-ecosystem/authentication-requesting-agency.html)
- [UIDAI AUA/KUA Agreement (PDF)](https://uidai.gov.in/images/resource/AUA_KUA_Agreement_v_40.pdf)
- [Sahamati — RBI-recognised SRO for the Account Aggregator Ecosystem](https://sahamati.org.in/)
- [Sahamati — How to join the Account Aggregator Network](https://sahamati.org.in/how-to-join-the-account-aggregator-network-to-share-and-access-financial-data/)
- [ReBIT Account Aggregator API schema](https://api.rebit.org.in/schema)
