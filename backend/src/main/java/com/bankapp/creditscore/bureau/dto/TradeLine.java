package com.bankapp.creditscore.bureau.dto;

import java.math.BigDecimal;

/**
 * A single credit account ("trade line") as reported by a credit bureau.
 *
 * @param daysPastDue current days-past-due on this account; 0 if the account is not delinquent
 */
public record TradeLine(
        String lenderName,
        String accountType,
        BigDecimal sanctionedAmount,
        BigDecimal currentBalance,
        String accountStatus,
        int daysPastDue
) {
}
