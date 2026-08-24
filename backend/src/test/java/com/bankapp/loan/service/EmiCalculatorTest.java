package com.bankapp.loan.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link EmiCalculator} — the pure reducing-balance amortization math that feeds
 * both live EMI tracking and the pending-dues/credit-score lookup.
 */
class EmiCalculatorTest {

    @Test
    void schedule_hasExactlyTenureMonthsInstallments() {
        List<EmiCalculator.EmiInstallment> schedule = EmiCalculator.generateSchedule(
                new BigDecimal("100000.00"), new BigDecimal("10.5"), 12, LocalDate.of(2026, 1, 1));

        assertThat(schedule).hasSize(12);
        for (int i = 0; i < schedule.size(); i++) {
            assertThat(schedule.get(i).installmentNumber()).isEqualTo(i + 1);
        }
    }

    @Test
    void principalComponents_sumExactlyToOriginalPrincipal_noRoundingDrift() {
        BigDecimal principal = new BigDecimal("523456.78");
        List<EmiCalculator.EmiInstallment> schedule = EmiCalculator.generateSchedule(
                principal, new BigDecimal("13.75"), 37, LocalDate.of(2026, 3, 15));

        BigDecimal totalPrincipal = schedule.stream()
                .map(EmiCalculator.EmiInstallment::principalComponent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(totalPrincipal).isEqualByComparingTo(principal);
    }

    @Test
    void eachInstallment_principalPlusInterest_equalsEmiAmount() {
        List<EmiCalculator.EmiInstallment> schedule = EmiCalculator.generateSchedule(
                new BigDecimal("250000.00"), new BigDecimal("9.25"), 24, LocalDate.of(2026, 1, 1));

        for (EmiCalculator.EmiInstallment installment : schedule) {
            BigDecimal sum = installment.principalComponent().add(installment.interestComponent());
            assertThat(sum).isEqualByComparingTo(installment.emiAmount());
        }
    }

    @Test
    void zeroInterestRate_producesSaneEqualPrincipalSchedule() {
        BigDecimal principal = new BigDecimal("120000.00");
        int tenureMonths = 12;
        List<EmiCalculator.EmiInstallment> schedule = EmiCalculator.generateSchedule(
                principal, BigDecimal.ZERO, tenureMonths, LocalDate.of(2026, 1, 1));

        assertThat(schedule).hasSize(tenureMonths);

        BigDecimal expectedMonthlyPrincipal = principal.divide(BigDecimal.valueOf(tenureMonths));
        for (int i = 0; i < tenureMonths - 1; i++) {
            EmiCalculator.EmiInstallment installment = schedule.get(i);
            assertThat(installment.interestComponent()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(installment.principalComponent()).isEqualByComparingTo(expectedMonthlyPrincipal);
        }

        BigDecimal totalPrincipal = schedule.stream()
                .map(EmiCalculator.EmiInstallment::principalComponent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalPrincipal).isEqualByComparingTo(principal);
    }

    @Test
    void calculateEmi_zeroInterestRate_isPrincipalDividedByTenure() {
        BigDecimal emi = EmiCalculator.calculateEmi(new BigDecimal("12000.00"), BigDecimal.ZERO, 12);
        assertThat(emi).isEqualByComparingTo(new BigDecimal("1000.00"));
    }

    @Test
    void generateSchedule_rejectsNonPositiveTenure() {
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () ->
                EmiCalculator.calculateEmi(new BigDecimal("1000"), new BigDecimal("10"), 0));
    }
}
