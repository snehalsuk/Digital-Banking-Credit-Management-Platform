package com.bankapp.loan.dto;

import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.entity.EmiStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmiScheduleResponse(
        Long id,
        Long loanId,
        Integer installmentNumber,
        LocalDate dueDate,
        BigDecimal principalComponent,
        BigDecimal interestComponent,
        BigDecimal emiAmount,
        BigDecimal paidAmount,
        LocalDate paidDate,
        EmiStatus status,
        Integer daysOverdue
) {
    public static EmiScheduleResponse from(EmiSchedule emi) {
        return new EmiScheduleResponse(
                emi.getId(),
                emi.getLoanId(),
                emi.getInstallmentNumber(),
                emi.getDueDate(),
                emi.getPrincipalComponent(),
                emi.getInterestComponent(),
                emi.getEmiAmount(),
                emi.getPaidAmount(),
                emi.getPaidDate(),
                emi.getStatus(),
                emi.getDaysOverdue()
        );
    }
}
