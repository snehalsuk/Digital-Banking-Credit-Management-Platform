package com.bankapp.loan.dto;

import com.bankapp.loan.entity.Loan;
import com.bankapp.loan.entity.LoanStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record LoanResponse(
        Long id,
        Long customerId,
        Long accountId,
        String loanType,
        BigDecimal principal,
        BigDecimal interestRateAnnual,
        Integer tenureMonths,
        BigDecimal emiAmount,
        LoanStatus status,
        LocalDate disbursedDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static LoanResponse from(Loan loan) {
        return new LoanResponse(
                loan.getId(),
                loan.getCustomerId(),
                loan.getAccountId(),
                loan.getLoanType(),
                loan.getPrincipal(),
                loan.getInterestRateAnnual(),
                loan.getTenureMonths(),
                loan.getEmiAmount(),
                loan.getStatus(),
                loan.getDisbursedDate(),
                loan.getCreatedAt(),
                loan.getUpdatedAt()
        );
    }
}
