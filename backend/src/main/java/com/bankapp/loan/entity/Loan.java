package com.bankapp.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK -> customer_profile(id). */
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    /** FK -> accounts(id). EMIs are debited from, and disbursal is credited to, this account. */
    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "loan_type", nullable = false, length = 32)
    private String loanType;

    @Column(name = "principal", nullable = false, precision = 19, scale = 4)
    private BigDecimal principal;

    @Column(name = "interest_rate_annual", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRateAnnual;

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "emi_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal emiAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private LoanStatus status;

    @Column(name = "disbursed_date")
    private LocalDate disbursedDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = LoanStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
