package com.bankapp.creditscore.bureau.dto;

/**
 * Request payload passed to a {@link com.bankapp.creditscore.bureau.CreditBureauClient}.
 *
 * @param pan               plaintext PAN (never logged; the client is responsible for masking
 *                          it in whatever it returns/logs)
 * @param consentReference  an opaque reference identifying the consent that authorized this
 *                          lookup (for a real bureau integration this would typically be the ID
 *                          of a stored consent artifact; here it is a lightweight audit hint)
 * @param purpose           business purpose of the lookup (e.g. "Loan underwriting")
 * @param requesterId       identifier (username) of the bank staff/system making the request
 */
public record CreditBureauRequest(
        String pan,
        String consentReference,
        String purpose,
        String requesterId
) {
}
