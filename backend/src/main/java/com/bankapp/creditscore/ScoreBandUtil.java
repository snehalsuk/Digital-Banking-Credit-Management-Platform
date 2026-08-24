package com.bankapp.creditscore;

/**
 * Shared 300-900 credit score band thresholds, used identically by
 * {@link com.bankapp.creditscore.bureau.MockCreditBureauClient} (for the simulated bureau score)
 * and {@link com.bankapp.creditscore.service.CreditScoreAggregationService} (for the combined
 * score), so the two never drift apart.
 */
public final class ScoreBandUtil {

    private ScoreBandUtil() {
    }

    public static String bandFor(int score) {
        if (score < 650) {
            return "Poor";
        }
        if (score < 700) {
            return "Fair";
        }
        if (score < 750) {
            return "Good";
        }
        if (score < 800) {
            return "Very Good";
        }
        return "Excellent";
    }

    public static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
