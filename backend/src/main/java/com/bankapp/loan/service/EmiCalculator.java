package com.bankapp.loan.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Pure reducing-balance EMI amortization math. Deliberately has no Spring
 * annotations/dependencies so it is trivially unit-testable in isolation —
 * this is the formula feeding both live EMI tracking (loan module) and the
 * pending-dues lookup (credit score module, a later phase).
 *
 * <p>{@code emi = P * r * (1+r)^n / ((1+r)^n - 1)}, where {@code r} is the
 * monthly interest rate ({@code annualRatePercent / 12 / 100}) and
 * {@code n} is the tenure in months.
 */
public final class EmiCalculator {

    /** Internal working precision for the compounding factor, before the final 2-decimal rounding. */
    private static final int RATE_SCALE = 10;
    private static final MathContext POW_CONTEXT = new MathContext(20);

    private EmiCalculator() {
    }

    /** One row of a generated amortization schedule. */
    public record EmiInstallment(
            int installmentNumber,
            LocalDate dueDate,
            BigDecimal principalComponent,
            BigDecimal interestComponent,
            BigDecimal emiAmount
    ) {
    }

    /**
     * The standard fixed monthly EMI for the given loan terms, rounded
     * HALF_UP to 2 decimals. If the annual rate is zero, this is simply
     * principal / tenureMonths.
     */
    public static BigDecimal calculateEmi(BigDecimal principal, BigDecimal annualRatePercent, int tenureMonths) {
        if (tenureMonths <= 0) {
            throw new IllegalArgumentException("tenureMonths must be positive");
        }
        BigDecimal monthlyRate = monthlyRate(annualRatePercent);

        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
        }

        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal onePlusRPowN = onePlusR.pow(tenureMonths, POW_CONTEXT);

        BigDecimal numerator = principal.multiply(monthlyRate).multiply(onePlusRPowN);
        BigDecimal denominator = onePlusRPowN.subtract(BigDecimal.ONE);

        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    /**
     * Generates the full month-by-month amortization schedule using the
     * standard reducing-balance method. Every installment except the last
     * uses the fixed EMI amount from {@link #calculateEmi}; the LAST
     * installment's principal component is trued up to whatever principal
     * remains outstanding, so the sum of all principal components across the
     * schedule exactly equals {@code principal} with no rounding drift (its
     * EMI amount is then principal + interest for that final row, which may
     * differ from the fixed EMI by a few cents).
     */
    public static List<EmiInstallment> generateSchedule(
            BigDecimal principal, BigDecimal annualRatePercent, int tenureMonths, LocalDate firstDueDate) {

        BigDecimal emi = calculateEmi(principal, annualRatePercent, tenureMonths);
        BigDecimal monthlyRate = monthlyRate(annualRatePercent);

        List<EmiInstallment> schedule = new ArrayList<>(tenureMonths);
        BigDecimal outstanding = principal;

        for (int installmentNumber = 1; installmentNumber <= tenureMonths; installmentNumber++) {
            BigDecimal interestComponent = outstanding.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);

            BigDecimal principalComponent;
            BigDecimal installmentEmi;
            if (installmentNumber == tenureMonths) {
                // True up the final installment so principal components sum exactly to `principal`.
                principalComponent = outstanding.setScale(2, RoundingMode.HALF_UP);
                installmentEmi = principalComponent.add(interestComponent);
            } else {
                principalComponent = emi.subtract(interestComponent).setScale(2, RoundingMode.HALF_UP);
                installmentEmi = emi;
            }

            schedule.add(new EmiInstallment(
                    installmentNumber,
                    firstDueDate.plusMonths(installmentNumber - 1L),
                    principalComponent,
                    interestComponent,
                    installmentEmi
            ));

            outstanding = outstanding.subtract(principalComponent);
        }

        return schedule;
    }

    private static BigDecimal monthlyRate(BigDecimal annualRatePercent) {
        return annualRatePercent.divide(BigDecimal.valueOf(1200), RATE_SCALE, RoundingMode.HALF_UP);
    }
}
