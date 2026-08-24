package com.bankapp.creditscore.bureau;

import com.bankapp.common.util.MaskingUtil;
import com.bankapp.creditscore.ScoreBandUtil;
import com.bankapp.creditscore.bureau.dto.CreditBureauRequest;
import com.bankapp.creditscore.bureau.dto.CreditBureauResponse;
import com.bankapp.creditscore.bureau.dto.DelinquencySummary;
import com.bankapp.creditscore.bureau.dto.TradeLine;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Default {@link CreditBureauClient} implementation: generates realistic-looking but entirely
 * simulated credit report data. Nothing here is a real credit assessment.
 *
 * <p>Determinism: the pseudo-random generator is seeded from the PAN string itself, so the same
 * PAN always yields the same score/trade lines/delinquency profile on every call and across
 * application restarts (there is no external state) — this makes the mock usable for repeatable
 * manual testing and demos.
 *
 * <p>Active whenever {@code bureau.provider} is {@code mock} or unset (the safe default — real
 * bureau credentials are never required to run this application).
 */
@Service
@ConditionalOnProperty(name = "bureau.provider", havingValue = "mock", matchIfMissing = true)
public class MockCreditBureauClient implements CreditBureauClient {

    private static final String PROVIDER_NAME = "MOCK-BUREAU";

    private static final String[] LENDERS = {
            "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank",
            "Bajaj Finserv", "Kotak Mahindra Bank", "IDFC First Bank"
    };

    private static final String[] ACCOUNT_TYPES = {
            "Credit Card", "Personal Loan", "Auto Loan", "Home Loan", "Consumer Durable Loan"
    };

    /** Roughly 1 in 5 generated profiles carries at least one delinquent trade line. */
    private static final int DELINQUENCY_CHANCE_PERCENT = 20;

    @Override
    public CreditBureauResponse fetchCreditReport(CreditBureauRequest request) {
        String pan = request.pan();
        Random random = new Random(seedFor(pan));

        int score = 300 + random.nextInt(601); // 300..900 inclusive
        String scoreBand = ScoreBandUtil.bandFor(score);

        int tradeLineCount = 1 + random.nextInt(4); // 1..4
        boolean hasDelinquency = random.nextInt(100) < DELINQUENCY_CHANCE_PERCENT;
        int delinquentIndex = hasDelinquency ? random.nextInt(tradeLineCount) : -1;

        List<TradeLine> tradeLines = new ArrayList<>(tradeLineCount);
        int totalOverdueAccounts = 0;
        BigDecimal totalOverdueAmount = BigDecimal.ZERO;
        int worstDpd = 0;

        for (int i = 0; i < tradeLineCount; i++) {
            String lender = LENDERS[random.nextInt(LENDERS.length)];
            String accountType = ACCOUNT_TYPES[random.nextInt(ACCOUNT_TYPES.length)];
            BigDecimal sanctioned = BigDecimal.valueOf(50_000 + random.nextInt(950_000)).setScale(2, RoundingMode.HALF_UP);
            double balanceFraction = 0.1 + random.nextDouble() * 0.6;
            BigDecimal balance = sanctioned.multiply(BigDecimal.valueOf(balanceFraction)).setScale(2, RoundingMode.HALF_UP);

            int daysPastDue = 0;
            String accountStatus = "STANDARD";
            if (i == delinquentIndex) {
                daysPastDue = 1 + random.nextInt(180);
                accountStatus = daysPastDue > 90 ? "SUBSTANDARD" : "IRREGULAR";
                totalOverdueAccounts++;
                totalOverdueAmount = totalOverdueAmount.add(balance);
                worstDpd = Math.max(worstDpd, daysPastDue);
            }

            tradeLines.add(new TradeLine(lender, accountType, sanctioned, balance, accountStatus, daysPastDue));
        }

        DelinquencySummary delinquencySummary = new DelinquencySummary(totalOverdueAccounts, totalOverdueAmount, worstDpd);

        return new CreditBureauResponse(
                MaskingUtil.maskPan(pan),
                PROVIDER_NAME,
                score,
                scoreBand,
                LocalDate.now(),
                tradeLines,
                delinquencySummary
        );
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    private long seedFor(String pan) {
        return pan == null ? 0L : pan.hashCode();
    }
}
