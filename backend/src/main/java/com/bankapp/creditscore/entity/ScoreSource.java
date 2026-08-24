package com.bankapp.creditscore.entity;

/** Origin of a persisted {@link CreditScoreSnapshot}. */
public enum ScoreSource {
    /** Score reported directly by a credit bureau, unmixed with internal history. */
    BUREAU,
    /** Score computed purely from the bank's own EMI repayment history. */
    INTERNAL,
    /** Weighted combination of bureau and internal scores (the score the app actually surfaces). */
    COMBINED
}
