package com.bankapp.loan.service;

import com.bankapp.account.entity.Account;
import com.bankapp.account.repository.AccountRepository;
import com.bankapp.auth.entity.Role;
import com.bankapp.auth.entity.User;
import com.bankapp.auth.repository.UserRepository;
import com.bankapp.common.exception.ResourceNotFoundException;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.repository.CustomerProfileRepository;
import com.bankapp.loan.dto.EmiScheduleResponse;
import com.bankapp.loan.dto.LoanApplicationRequest;
import com.bankapp.loan.dto.LoanResponse;
import com.bankapp.loan.entity.EmiSchedule;
import com.bankapp.loan.entity.Loan;
import com.bankapp.loan.entity.LoanStatus;
import com.bankapp.loan.repository.EmiScheduleRepository;
import com.bankapp.loan.repository.LoanRepository;
import com.bankapp.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final EmiScheduleRepository emiScheduleRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final TransactionService transactionService;

    @Transactional
    public LoanResponse applyForLoan(LoanApplicationRequest request, String username) {
        User user = resolveUser(username);
        CustomerProfile profile = resolveProfile(user);

        Account account = accountRepository.findByIdAndCustomerId(request.accountId(), profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Account not found for the current customer: " + request.accountId()));

        var emiAmount = EmiCalculator.calculateEmi(request.principal(), request.interestRateAnnual(), request.tenureMonths());

        Loan loan = Loan.builder()
                .customerId(profile.getId())
                .accountId(account.getId())
                .loanType(request.loanType())
                .principal(request.principal())
                .interestRateAnnual(request.interestRateAnnual())
                .tenureMonths(request.tenureMonths())
                .emiAmount(emiAmount)
                .status(LoanStatus.PENDING)
                .build();

        return LoanResponse.from(loanRepository.save(loan));
    }

    /** LOAN_OFFICER/ADMIN only — enforced via @PreAuthorize on the controller endpoint. */
    @Transactional
    public LoanResponse approveAndDisburse(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new IllegalArgumentException("Loan " + loanId + " is not pending approval");
        }

        LocalDate disbursedDate = LocalDate.now();
        loan.setStatus(LoanStatus.ACTIVE);
        loan.setDisbursedDate(disbursedDate);
        Loan saved = loanRepository.save(loan);

        List<EmiCalculator.EmiInstallment> schedule = EmiCalculator.generateSchedule(
                saved.getPrincipal(), saved.getInterestRateAnnual(), saved.getTenureMonths(), disbursedDate.plusMonths(1));

        List<EmiSchedule> installments = schedule.stream()
                .map(installment -> EmiSchedule.builder()
                        .loanId(saved.getId())
                        .installmentNumber(installment.installmentNumber())
                        .dueDate(installment.dueDate())
                        .principalComponent(installment.principalComponent())
                        .interestComponent(installment.interestComponent())
                        .emiAmount(installment.emiAmount())
                        .build())
                .toList();
        emiScheduleRepository.saveAll(installments);

        transactionService.deposit(saved.getAccountId(), saved.getPrincipal(), "Loan disbursement");

        return LoanResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getLoansForCurrentUser(String username) {
        User user = resolveUser(username);
        CustomerProfile profile = resolveProfile(user);
        return loanRepository.findByCustomerId(profile.getId()).stream().map(LoanResponse::from).toList();
    }

    /**
     * CUSTOMER: always their own loans (ignores filters). LOAN_OFFICER/ADMIN:
     * a given customer's loans, or loans filtered by status (e.g. the
     * pending-approval queue), or all loans if neither filter is given.
     */
    @Transactional(readOnly = true)
    public List<LoanResponse> getLoans(String username, Long customerIdFilter, LoanStatus statusFilter) {
        User user = resolveUser(username);
        if (user.getRole() == Role.CUSTOMER) {
            return getLoansForCurrentUser(username);
        }

        List<Loan> loans;
        if (customerIdFilter != null) {
            loans = loanRepository.findByCustomerId(customerIdFilter);
        } else if (statusFilter != null) {
            loans = loanRepository.findByStatus(statusFilter);
        } else {
            loans = loanRepository.findAll();
        }
        return loans.stream().map(LoanResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoan(Long id, String username) {
        return LoanResponse.from(getLoanEntityWithAccessCheck(id, username));
    }

    @Transactional(readOnly = true)
    public List<EmiScheduleResponse> getEmiSchedule(Long loanId, String username) {
        getLoanEntityWithAccessCheck(loanId, username);
        return emiScheduleRepository.findByLoanIdOrderByInstallmentNumber(loanId).stream()
                .map(EmiScheduleResponse::from)
                .toList();
    }

    Loan getLoanEntityWithAccessCheck(Long id, String username) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + id));

        User user = resolveUser(username);
        if (user.getRole() == Role.CUSTOMER) {
            CustomerProfile profile = resolveProfile(user);
            if (!loan.getCustomerId().equals(profile.getId())) {
                throw new AccessDeniedException("You do not have access to this loan");
            }
        }
        return loan;
    }

    private CustomerProfile resolveProfile(User user) {
        return customerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No customer profile found for the current user"));
    }

    private User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with username: " + username));
    }
}
