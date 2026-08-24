package com.bankapp.creditscore.dto;

import com.bankapp.creditscore.bureau.dto.DelinquencySummary;
import com.bankapp.creditscore.bureau.dto.TradeLine;

import java.time.Instant;
import java.util.List;

/**
 * Combined result of a credit score lookup.
 *
 * @param dataSource {@code "MOCK"} when the active bureau client is the simulated one, else
 *                   {@code "REAL"} — the frontend uses this to show/hide the mock-data banner.
 */
public record CreditScoreLookupResponse(
        int bureauScore,
        int internalScore,
        int combinedScore,
        String scoreBand,
        List<TradeLine> tradeLines,
        DelinquencySummary delinquencySummary,
        List<PendingEmiDto> pendingEmis,
        String dataSource,
        Instant lastUpdated
) {
}
