package com.bankapp.creditscore.service;

import com.bankapp.creditscore.ScoreBandUtil;
import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.repository.EmiScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Computes a 300-900 credit score purely from the bank's own EMI repayment history — the
 * counterpart to the (simulated) external bureau score, combined 70/30 by
 * {@code CreditScoreAggregationService}.
 *
 * <p>Formula: {@code score = clamp(600 + onTimeRatio * 250 - defaultCount * 50 - lateCount * 10, 300, 900)}
 * where:
 * <ul>
 *     <li>{@code onTimeRatio = paidOnTime / totalDue} — installments that have come due
 *     (PAID, OVERDUE, or DEFAULTED; still-PENDING future installments are excluded) and, of
 *     those, the fraction paid on or before their due date</li>
 *     <li>{@code lateCount} — installments paid, but after their due date</li>
 *     <li>{@code defaultCount} — installments in DEFAULTED status</li>
 * </ul>
 * A brand-new customer with no EMI history yet gets a neutral default score rather than a
 * division-by-zero or an unfairly low score.
 */
@Service
@RequiredArgsConstructor
public class InternalScoringService {

    /** Score assigned when a customer has no due EMI history at all (e.g. no loans, or loans not yet disbursed). */
    static final int NEUTRAL_DEFAULT_SCORE = 650;

    private static final int BASE_SCORE = 600;
    private static final double ON_TIME_RATIO_WEIGHT = 250.0;
    private static final int DEFAULT_PENALTY = 50;
    private static final int LATE_PENALTY = 10;
    private static final int SCORE_MIN = 300;
    private static final int SCORE_MAX = 900;

    private final EmiScheduleRepository emiScheduleRepository;

    @Transactional(readOnly = true)
    public int computeInternalScore(Long customerId) {
        List<EmiSchedule> installments = emiScheduleRepository.findAllByCustomerId(customerId);

        int totalDue = 0;
        int paidOnTime = 0;
        int lateCount = 0;
        int defaultCount = 0;

        for (EmiSchedule installment : installments) {
            switch (installment.getStatus()) {
                case PAID -> {
                    totalDue++;
                    if (installment.getPaidDate() != null && !installment.getPaidDate().isAfter(installment.getDueDate())) {
                        paidOnTime++;
                    } else {
                        lateCount++;
                    }
                }
                case OVERDUE -> totalDue++;
                case DEFAULTED -> {
                    totalDue++;
                    defaultCount++;
                }
                case PENDING -> {
                    // Not yet due; excluded from the history-based ratio.
                }
            }
        }

        if (totalDue == 0) {
            return NEUTRAL_DEFAULT_SCORE;
        }

        double onTimeRatio = (double) paidOnTime / totalDue;
        double rawScore = BASE_SCORE + onTimeRatio * ON_TIME_RATIO_WEIGHT - defaultCount * DEFAULT_PENALTY - lateCount * LATE_PENALTY;

        return ScoreBandUtil.clamp((int) Math.round(rawScore), SCORE_MIN, SCORE_MAX);
    }
}
