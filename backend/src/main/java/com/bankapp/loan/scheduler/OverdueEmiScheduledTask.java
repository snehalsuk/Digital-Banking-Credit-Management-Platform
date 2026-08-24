package com.bankapp.loan.scheduler;

import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.entity.EmiStatus;
import com.bankapp.loan.entity.Loan;
import com.bankapp.loan.entity.LoanStatus;
import com.bankapp.loan.repository.EmiScheduleRepository;
import com.bankapp.loan.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Daily job: PENDING installments past their due date become OVERDUE; any
 * OVERDUE (or newly-overdue) installment at least {@value #DEFAULT_THRESHOLD_DAYS}
 * days past due escalates to DEFAULTED, which also marks the parent loan
 * DEFAULTED. Runs on a cron schedule, but {@link #runOverdueCheck()} is also
 * exposed so it can be triggered on demand (see
 * {@code POST /api/admin/loans/run-overdue-check}) without waiting for the
 * cron, e.g. for testing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OverdueEmiScheduledTask {

    private static final int DEFAULT_THRESHOLD_DAYS = 90;

    private final EmiScheduleRepository emiScheduleRepository;
    private final LoanRepository loanRepository;

    @Scheduled(cron = "0 0 1 * * *")
    public void runScheduledOverdueCheck() {
        int updated = runOverdueCheck();
        log.info("Overdue EMI check completed, {} installment(s) updated", updated);
    }

    /** @return the number of EMI installment rows touched. */
    @Transactional
    public int runOverdueCheck() {
        LocalDate today = LocalDate.now();
        int updated = 0;

        List<EmiSchedule> newlyOverdue = emiScheduleRepository.findByStatusAndDueDateBefore(EmiStatus.PENDING, today);
        for (EmiSchedule emi : newlyOverdue) {
            emi.setStatus(EmiStatus.OVERDUE);
            applyDaysOverdueAndMaybeEscalate(emi, today);
            updated++;
        }
        emiScheduleRepository.saveAll(newlyOverdue);

        List<EmiSchedule> alreadyOverdue = emiScheduleRepository.findByStatus(EmiStatus.OVERDUE);
        for (EmiSchedule emi : alreadyOverdue) {
            boolean escalated = applyDaysOverdueAndMaybeEscalate(emi, today);
            if (escalated) {
                updated++;
            }
        }
        emiScheduleRepository.saveAll(alreadyOverdue);

        return updated;
    }

    /** Updates daysOverdue and, past the threshold, escalates the installment (and its loan) to DEFAULTED. */
    private boolean applyDaysOverdueAndMaybeEscalate(EmiSchedule emi, LocalDate today) {
        int daysOverdue = (int) ChronoUnit.DAYS.between(emi.getDueDate(), today);
        emi.setDaysOverdue(Math.max(daysOverdue, 0));

        if (daysOverdue >= DEFAULT_THRESHOLD_DAYS && emi.getStatus() != EmiStatus.DEFAULTED) {
            emi.setStatus(EmiStatus.DEFAULTED);
            loanRepository.findById(emi.getLoanId()).ifPresent(loan -> {
                if (loan.getStatus() != LoanStatus.DEFAULTED) {
                    loan.setStatus(LoanStatus.DEFAULTED);
                    loanRepository.save(loan);
                }
            });
            return true;
        }
        return false;
    }
}
