package com.bankapp.audit.dto;

import com.bankapp.audit.entity.BureauLookupAudit;

import java.time.Instant;

/**
 * Admin-facing view of a {@link BureauLookupAudit} row. Deliberately exposes only
 * {@code panHash} (the deterministic hash), never a reversible/unmasked PAN — the audit trail
 * never stores or surfaces the plaintext PAN in the first place.
 */
public record BureauLookupAuditResponse(
        Long id,
        Long requesterUserId,
        Long customerId,
        String panHash,
        String purpose,
        boolean consentConfirmed,
        String bureauProvider,
        String responseStatus,
        Instant requestedAt
) {
    public static BureauLookupAuditResponse from(BureauLookupAudit audit) {
        return new BureauLookupAuditResponse(
                audit.getId(),
                audit.getRequesterUserId(),
                audit.getCustomerId(),
                audit.getPanHash(),
                audit.getPurpose(),
                audit.isConsentConfirmed(),
                audit.getBureauProvider(),
                audit.getResponseStatus(),
                audit.getRequestedAt()
        );
    }
}
