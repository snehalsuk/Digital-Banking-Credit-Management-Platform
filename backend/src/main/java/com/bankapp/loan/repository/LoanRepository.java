package com.bankapp.loan.repository;

import com.bankapp.loan.entity.Loan;
import com.bankapp.loan.entity.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByCustomerId(Long customerId);

    List<Loan> findByStatus(LoanStatus status);
}
