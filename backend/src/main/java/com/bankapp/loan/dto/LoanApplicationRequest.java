package com.bankapp.loan.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record LoanApplicationRequest(
        @NotNull
        Long accountId,

        @NotBlank
        @Size(max = 32)
        String loanType,

        @NotNull
        @DecimalMin(value = "1", message = "Principal must be positive")
        BigDecimal principal,

        @NotNull
        @DecimalMin(value = "0.01", message = "Interest rate must be positive")
        @DecimalMax(value = "99.99", message = "Interest rate must be a realistic annual percentage")
        BigDecimal interestRateAnnual,

        @NotNull
        @Min(value = 1, message = "Tenure must be at least 1 month")
        @Max(value = 480, message = "Tenure must be at most 480 months")
        Integer tenureMonths
) {
}
