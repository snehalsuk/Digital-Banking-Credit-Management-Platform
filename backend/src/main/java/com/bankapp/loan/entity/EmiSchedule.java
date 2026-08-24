package com.bankapp.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "emi_schedule",
        uniqueConstraints = @UniqueConstraint(name = "uk_emi_schedule_loan_installment", columnNames = {"loan_id", "installment_number"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmiSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK -> loans(id). */
    @Column(name = "loan_id", nullable = false)
    private Long loanId;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "principal_component", nullable = false, precision = 19, scale = 4)
    private BigDecimal principalComponent;

    @Column(name = "interest_component", nullable = false, precision = 19, scale = 4)
    private BigDecimal interestComponent;

    @Column(name = "emi_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal emiAmount;

    @Column(name = "paid_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal paidAmount;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private EmiStatus status;

    @Column(name = "days_overdue", nullable = false)
    private Integer daysOverdue;

    @PrePersist
    protected void onCreate() {
        if (this.paidAmount == null) {
            this.paidAmount = BigDecimal.ZERO;
        }
        if (this.status == null) {
            this.status = EmiStatus.PENDING;
        }
        if (this.daysOverdue == null) {
            this.daysOverdue = 0;
        }
    }
}
