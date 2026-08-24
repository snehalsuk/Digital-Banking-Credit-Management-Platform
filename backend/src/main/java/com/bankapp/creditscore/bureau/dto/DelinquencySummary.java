package com.bankapp.creditscore.bureau.dto;

import java.math.BigDecimal;

/** Aggregate delinquency figures across all of a customer's bureau-reported trade lines. */
public record DelinquencySummary(
        int totalOverdueAccounts,
        BigDecimal totalOverdueAmount,
        int worstDpd
) {
}
