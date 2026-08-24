package com.bankapp.creditscore.dto;

import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.entity.EmiStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A single pending/overdue EMI installment, as surfaced by the credit score lookup. */
public record PendingEmiDto(
        Long loanId,
        Integer installmentNumber,
        BigDecimal emiAmount,
        LocalDate dueDate,
        Integer daysOverdue,
        EmiStatus status
) {
    public static PendingEmiDto from(EmiSchedule emi) {
        return new PendingEmiDto(
                emi.getLoanId(),
                emi.getInstallmentNumber(),
                emi.getEmiAmount(),
                emi.getDueDate(),
                emi.getDaysOverdue(),
                emi.getStatus()
        );
    }
}
