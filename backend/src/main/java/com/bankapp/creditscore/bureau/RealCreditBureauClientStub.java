package com.bankapp.creditscore.bureau;

import com.bankapp.creditscore.bureau.dto.CreditBureauRequest;
import com.bankapp.creditscore.bureau.dto.CreditBureauResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Placeholder for a real credit bureau integration (CIBIL / Experian / Equifax / CRIF High Mark).
 * Intentionally unimplemented: this application ships without any real bureau credentials or
 * business agreement, so calling it always fails loudly rather than silently returning fabricated
 * data under a "real" label. See docs/COMPLIANCE_BOUNDARIES.md.
 *
 * <p>Active only when {@code bureau.provider=real} is explicitly set. Until then,
 * {@link MockCreditBureauClient} remains the active bean.
 */
@Service
@ConditionalOnProperty(name = "bureau.provider", havingValue = "real")
@RequiredArgsConstructor
public class RealCreditBureauClientStub implements CreditBureauClient {

    private final BureauApiProperties bureauApiProperties;

    @Override
    public CreditBureauResponse fetchCreditReport(CreditBureauRequest request) {
        throw new UnsupportedOperationException(
                "Real credit bureau integration is not implemented. To go live: "
                        + "(1) obtain a business API agreement with a bureau such as CIBIL/Experian/Equifax/CRIF High Mark, "
                        + "(2) implement this class against that bureau's actual API contract, "
                        + "(3) set bureau.provider=real and populate bureau.base-url/client-id/client-secret/member-id "
                        + "via environment variables or a secrets manager. "
                        + "Configured base-url=" + safe(bureauApiProperties.getBaseUrl())
                        + ", member-id=" + safe(bureauApiProperties.getMemberId()) + "."
        );
    }

    @Override
    public String getProviderName() {
        return "REAL-BUREAU-NOT-CONFIGURED";
    }

    private String safe(String value) {
        return (value == null || value.isBlank()) ? "<unset>" : "<set>";
    }
}
