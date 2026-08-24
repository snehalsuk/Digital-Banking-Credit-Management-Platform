package com.bankapp.creditscore.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * PAN goes in the request body (never a URL/query param), so it never lands in access logs.
 * {@code consentConfirmed} must be {@code true} or the lookup is rejected (and audit-logged as
 * CONSENT_DENIED) before any bureau call is made.
 */
public record CreditScoreLookupRequest(

        @NotBlank
        @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "PAN must match the format AAAAA9999A")
        String pan,

        boolean consentConfirmed,

        @Size(max = 128)
        String purpose
) {
}
