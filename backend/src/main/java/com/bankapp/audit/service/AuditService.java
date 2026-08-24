package com.bankapp.audit.service;

import com.bankapp.audit.entity.BureauLookupAudit;
import com.bankapp.audit.repository.BureauLookupAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Writes {@link BureauLookupAudit} rows. Called unconditionally from every branch of
 * {@code CreditScoreAggregationService.lookupByPan} (not-found, forbidden, consent-denied, and
 * success).
 *
 * <p>Uses {@code REQUIRES_NEW} propagation deliberately: the caller's transaction is typically
 * about to be rolled back (it throws {@code ResourceNotFoundException} /
 * {@code AccessDeniedException} / {@code ConsentRequiredException} right after logging), and a
 * rollback of the outer transaction must NOT take the audit row down with it. Running the insert
 * in its own transaction commits it independently, so the audit trail survives even on the
 * failure paths it exists to record.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final BureauLookupAuditRepository bureauLookupAuditRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logBureauLookup(
            Long requesterUserId,
            Long customerId,
            String panHash,
            String purpose,
            boolean consentConfirmed,
            String bureauProvider,
            String responseStatus
    ) {
        BureauLookupAudit audit = BureauLookupAudit.builder()
                .requesterUserId(requesterUserId)
                .customerId(customerId)
                .panHash(panHash)
                .purpose(purpose)
                .consentConfirmed(consentConfirmed)
                .bureauProvider(bureauProvider)
                .responseStatus(responseStatus)
                .build();
        bureauLookupAuditRepository.save(audit);
    }
}
