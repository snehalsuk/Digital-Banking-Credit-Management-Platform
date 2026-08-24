package com.bankapp.creditscore.bureau;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Binds the {@code bureau.*} config keys (see application.yml / application-prod.yml). Consumed
 * by {@link RealCreditBureauClientStub} — once a real bureau agreement exists, these are the
 * settings that would be populated (via environment variables or a secrets manager) to configure
 * the real integration.
 */
@Component
@ConfigurationProperties(prefix = "bureau")
@Getter
@Setter
public class BureauApiProperties {

    /** {@code mock} (default) or {@code real}; selects which {@link CreditBureauClient} bean is active. */
    private String provider;

    private String baseUrl;

    private String clientId;

    private String clientSecret;

    /** The bank's member/subscriber ID with the bureau, required by most bureau APIs alongside the client credentials. */
    private String memberId;

    private long timeoutMs = 5000;
}
