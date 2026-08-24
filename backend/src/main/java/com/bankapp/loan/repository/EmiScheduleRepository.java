package com.bankapp.loan.repository;

import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.entity.EmiStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EmiScheduleRepository extends JpaRepository<EmiSchedule, Long> {

    List<EmiSchedule> findByLoanIdOrderByInstallmentNumber(Long loanId);

    Optional<EmiSchedule> findByLoanIdAndInstallmentNumber(Long loanId, Integer installmentNumber);

    List<EmiSchedule> findByStatusAndDueDateBefore(EmiStatus status, LocalDate dueDate);

    List<EmiSchedule> findByStatus(EmiStatus status);

    /**
     * CRITICAL query relied on directly by a later phase (credit score /
     * pending-EMI lookup) — keep this exact name and signature.
     * Returns every OVERDUE or DEFAULTED installment across all of a given
     * customer's loans, oldest due date first.
     */
    @Query("SELECT e FROM EmiSchedule e WHERE e.loanId IN "
            + "(SELECT l.id FROM Loan l WHERE l.customerId = :customerId) "
            + "AND e.status IN (com.bankapp.loan.entity.EmiStatus.OVERDUE, com.bankapp.loan.entity.EmiStatus.DEFAULTED) "
            + "ORDER BY e.dueDate ASC")
    List<EmiSchedule> findOverdueByCustomerId(@Param("customerId") Long customerId);
}
