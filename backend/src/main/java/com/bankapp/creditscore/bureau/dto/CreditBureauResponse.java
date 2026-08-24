package com.bankapp.creditscore.bureau.dto;

import java.time.LocalDate;
import java.util.List;

/** Response from a {@link com.bankapp.creditscore.bureau.CreditBureauClient} lookup. */
public record CreditBureauResponse(
        String maskedPan,
        String bureauName,
        int score,
        String scoreBand,
        LocalDate reportDate,
        List<TradeLine> tradeLines,
        DelinquencySummary delinquencySummary
) {
}
