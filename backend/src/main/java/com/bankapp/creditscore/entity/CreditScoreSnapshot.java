package com.bankapp.creditscore.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A point-in-time credit score result, persisted every time
 * {@code CreditScoreAggregationService.lookupByPan} completes successfully.
 */
@Entity
@Table(name = "credit_score_snapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditScoreSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK -> customer_profile(id). */
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    /** Same deterministic PAN hash used for lookup elsewhere; kept here for audit/history queries. */
    @Column(name = "pan_hash", nullable = false, length = 64)
    private String panHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 16)
    private ScoreSource source;

    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "score_band", nullable = false, length = 16)
    private String scoreBand;

    /** Serialized (Jackson) JSON of the raw bureau response, for traceability of what fed this score. */
    @Lob
    @Column(name = "raw_response_json")
    private String rawResponseJson;

    @Column(name = "fetched_at", nullable = false, updatable = false)
    private Instant fetchedAt;

    @PrePersist
    protected void onCreate() {
        if (this.fetchedAt == null) {
            this.fetchedAt = Instant.now();
        }
    }
}
