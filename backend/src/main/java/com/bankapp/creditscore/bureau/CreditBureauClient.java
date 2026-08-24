package com.bankapp.creditscore.bureau;

import com.bankapp.creditscore.bureau.dto.CreditBureauRequest;
import com.bankapp.creditscore.bureau.dto.CreditBureauResponse;

/**
 * Swap-point interface for credit bureau integration. Exactly one implementation is active at a
 * time, selected via the {@code bureau.provider} config key:
 * <ul>
 *     <li>{@code mock} (default) — {@link MockCreditBureauClient}, deterministic simulated data</li>
 *     <li>{@code real} — {@link RealCreditBureauClientStub}, documents what real integration requires</li>
 * </ul>
 */
public interface CreditBureauClient {

    CreditBureauResponse fetchCreditReport(CreditBureauRequest request);

    /** Short identifier of the active provider, surfaced in audit rows and the API response's {@code dataSource}. */
    String getProviderName();
}
