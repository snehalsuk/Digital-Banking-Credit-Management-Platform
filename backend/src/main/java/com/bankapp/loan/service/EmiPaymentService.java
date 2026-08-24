package com.bankapp.loan.service;

import com.bankapp.auth.entity.Role;
import com.bankapp.auth.entity.User;
import com.bankapp.auth.repository.UserRepository;
import com.bankapp.common.exception.ResourceNotFoundException;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.repository.CustomerProfileRepository;
import com.bankapp.loan.dto.EmiScheduleResponse;
import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.entity.EmiStatus;
import com.bankapp.loan.entity.Loan;
import com.bankapp.loan.entity.LoanStatus;
import com.bankapp.loan.repository.EmiScheduleRepository;
import com.bankapp.loan.repository.LoanRepository;
import com.bankapp.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Pays a single EMI installment: validates the requester owns the loan (or
 * is an officer/admin), debits the linked account (which itself enforces
 * balance sufficiency and locking via {@link TransactionService}), marks the
 * installment PAID, and closes the loan once every installment is paid.
 */
@Service
@RequiredArgsConstructor
public class EmiPaymentService {

    private final LoanRepository loanRepository;
    private final EmiScheduleRepository emiScheduleRepository;
    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final TransactionService transactionService;

    @Transactional
    public EmiScheduleResponse payInstallment(Long loanId, Integer installmentNumber, BigDecimal amount, String username) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with username: " + username));
        if (user.getRole() == Role.CUSTOMER) {
            CustomerProfile profile = customerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("No customer profile found for the current user"));
            if (!loan.getCustomerId().equals(profile.getId())) {
                throw new AccessDeniedException("You do not have access to this loan");
            }
        }

        EmiSchedule installment = emiScheduleRepository.findByLoanIdAndInstallmentNumber(loanId, installmentNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Installment " + installmentNumber + " not found for loan " + loanId));

        if (installment.getStatus() == EmiStatus.PAID) {
            throw new IllegalArgumentException("Installment " + installmentNumber + " is already paid");
        }

        transactionService.withdraw(
                loan.getAccountId(), amount,
                "EMI payment - loan #" + loanId + " installment #" + installmentNumber);

        installment.setPaidAmount(amount);
        installment.setPaidDate(LocalDate.now());
        installment.setStatus(EmiStatus.PAID);
        installment.setDaysOverdue(0);
        EmiSchedule savedInstallment = emiScheduleRepository.save(installment);

        boolean anyUnpaid = emiScheduleRepository.findByLoanIdOrderByInstallmentNumber(loanId).stream()
                .anyMatch(e -> e.getStatus() != EmiStatus.PAID);
        if (!anyUnpaid) {
            loan.setStatus(LoanStatus.CLOSED);
            loanRepository.save(loan);
        }

        return EmiScheduleResponse.from(savedInstallment);
    }
}
