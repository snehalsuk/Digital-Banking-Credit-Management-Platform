package com.bankapp.creditscore.service;

import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.entity.EmiStatus;
import com.bankapp.loan.repository.EmiScheduleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link InternalScoringService} — the bank's own 300-900 repayment-history score,
 * mocking {@link EmiScheduleRepository} so no Spring context is needed.
 */
@ExtendWith(MockitoExtension.class)
class InternalScoringServiceTest {

    private static final Long CUSTOMER_ID = 42L;

    @Mock
    private EmiScheduleRepository emiScheduleRepository;

    @Test
    void noEmiHistory_getsTheDocumentedNeutralDefaultScore() {
        when(emiScheduleRepository.findAllByCustomerId(CUSTOMER_ID)).thenReturn(List.of());

        InternalScoringService service = new InternalScoringService(emiScheduleRepository);
        int score = service.computeInternalScore(CUSTOMER_ID);

        assertThat(score).isEqualTo(InternalScoringService.NEUTRAL_DEFAULT_SCORE);
    }

    @Test
    void score_clampsToTheDocumentedFloor_forAHeavilyDefaultedCustomer() {
        // Many DEFAULTED installments should drive the raw score below 300, clamped to the floor.
        List<EmiSchedule> installments = installmentsOfStatus(EmiStatus.DEFAULTED, 20);
        when(emiScheduleRepository.findAllByCustomerId(CUSTOMER_ID)).thenReturn(installments);

        InternalScoringService service = new InternalScoringService(emiScheduleRepository);
        int score = service.computeInternalScore(CUSTOMER_ID);

        assertThat(score).isEqualTo(300);
    }

    @Test
    void score_neverExceedsTheDocumentedCeiling_forAllOnTimePayments() {
        // Per the documented formula (base 600 + onTimeRatio * 250), a perfect history tops out
        // at 850 — well within [300, 900] — so this asserts the upper bound is respected rather
        // than assuming the formula can be pushed past 900 (it can't with realistic inputs).
        List<EmiSchedule> installments = onTimePaidInstallments(20);
        when(emiScheduleRepository.findAllByCustomerId(CUSTOMER_ID)).thenReturn(installments);

        InternalScoringService service = new InternalScoringService(emiScheduleRepository);
        int score = service.computeInternalScore(CUSTOMER_ID);

        assertThat(score).isLessThanOrEqualTo(900).isGreaterThanOrEqualTo(300);
        assertThat(score).isEqualTo(850);
    }

    @Test
    void allOnTimePayments_scoresHigherThan_customerWithDefaults_otherFactorsEqual() {
        List<EmiSchedule> goodHistory = onTimePaidInstallments(10);
        List<EmiSchedule> badHistory = installmentsOfStatus(EmiStatus.DEFAULTED, 10);

        EmiScheduleRepository goodRepo = mockRepoReturning(goodHistory);
        EmiScheduleRepository badRepo = mockRepoReturning(badHistory);

        int goodScore = new InternalScoringService(goodRepo).computeInternalScore(CUSTOMER_ID);
        int badScore = new InternalScoringService(badRepo).computeInternalScore(CUSTOMER_ID);

        assertThat(goodScore).isGreaterThan(badScore);
    }

    @Test
    void pendingInstallments_notYetDue_areExcludedFromTheRatio() {
        // Only PENDING (not-yet-due) installments: no due history at all -> neutral default.
        List<EmiSchedule> pendingOnly = installmentsOfStatus(EmiStatus.PENDING, 5);
        when(emiScheduleRepository.findAllByCustomerId(CUSTOMER_ID)).thenReturn(pendingOnly);

        InternalScoringService service = new InternalScoringService(emiScheduleRepository);
        int score = service.computeInternalScore(CUSTOMER_ID);

        assertThat(score).isEqualTo(InternalScoringService.NEUTRAL_DEFAULT_SCORE);
    }

    private EmiScheduleRepository mockRepoReturning(List<EmiSchedule> installments) {
        EmiScheduleRepository repo = org.mockito.Mockito.mock(EmiScheduleRepository.class);
        when(repo.findAllByCustomerId(CUSTOMER_ID)).thenReturn(installments);
        return repo;
    }

    private List<EmiSchedule> onTimePaidInstallments(int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> EmiSchedule.builder()
                        .id((long) i)
                        .loanId(1L)
                        .installmentNumber(i + 1)
                        .dueDate(LocalDate.of(2026, 1, 1).plusMonths(i))
                        .principalComponent(new BigDecimal("1000.00"))
                        .interestComponent(new BigDecimal("50.00"))
                        .emiAmount(new BigDecimal("1050.00"))
                        .paidAmount(new BigDecimal("1050.00"))
                        .paidDate(LocalDate.of(2026, 1, 1).plusMonths(i))
                        .status(EmiStatus.PAID)
                        .daysOverdue(0)
                        .build())
                .toList();
    }

    private List<EmiSchedule> installmentsOfStatus(EmiStatus status, int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> EmiSchedule.builder()
                        .id((long) i)
                        .loanId(1L)
                        .installmentNumber(i + 1)
                        .dueDate(LocalDate.of(2026, 1, 1).plusMonths(i))
                        .principalComponent(new BigDecimal("1000.00"))
                        .interestComponent(new BigDecimal("50.00"))
                        .emiAmount(new BigDecimal("1050.00"))
                        .paidAmount(BigDecimal.ZERO)
                        .status(status)
                        .daysOverdue(status == EmiStatus.PENDING ? 0 : 45)
                        .build())
                .toList();
    }
}
