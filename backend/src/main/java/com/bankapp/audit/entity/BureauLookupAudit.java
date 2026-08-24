package com.bankapp.audit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One row per PAN-based credit-score/bureau lookup attempt, written unconditionally by
 * {@code AuditService.logBureauLookup} regardless of outcome (not found, forbidden,
 * consent-denied, or success). Never stores the plaintext PAN — only its deterministic hash.
 */
@Entity
@Table(name = "bureau_lookup_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BureauLookupAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK -> users(id). The staff member or customer who performed the lookup. */
    @Column(name = "requester_user_id", nullable = false)
    private Long requesterUserId;

    /** FK -> customer_profile(id). Null when the PAN could not be resolved to any customer. */
    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "pan_hash", nullable = false, length = 64)
    private String panHash;

    @Column(name = "purpose", length = 128)
    private String purpose;

    @Column(name = "consent_confirmed", nullable = false)
    private boolean consentConfirmed;

    /** Which bureau provider served the request (e.g. MOCK-BUREAU); null if the flow never reached the bureau call. */
    @Column(name = "bureau_provider", length = 64)
    private String bureauProvider;

    /** One of NOT_FOUND, FORBIDDEN, CONSENT_DENIED, SUCCESS. */
    @Column(name = "response_status", nullable = false, length = 32)
    private String responseStatus;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @PrePersist
    protected void onCreate() {
        if (this.requestedAt == null) {
            this.requestedAt = Instant.now();
        }
    }
}
