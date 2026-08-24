package com.bankapp.transaction.service;

import com.bankapp.account.entity.Account;
import com.bankapp.account.entity.AccountStatus;
import com.bankapp.account.repository.AccountRepository;
import com.bankapp.auth.entity.Role;
import com.bankapp.auth.entity.User;
import com.bankapp.auth.repository.UserRepository;
import com.bankapp.common.exception.InsufficientFundsException;
import com.bankapp.common.exception.ResourceNotFoundException;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.repository.CustomerProfileRepository;
import com.bankapp.transaction.dto.TransactionResponse;
import com.bankapp.transaction.entity.Transaction;
import com.bankapp.transaction.entity.TransactionStatus;
import com.bankapp.transaction.entity.TransactionType;
import com.bankapp.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Deposit/withdraw/transfer ledger logic. Every mutation is transactional
 * and reads the affected {@link Account} row(s) under a pessimistic write
 * lock ({@link AccountRepository#findByIdForUpdate}) to prevent lost updates
 * under concurrent access. {@code transfer} always locks the two accounts in
 * ascending-id order to avoid deadlocks between concurrent transfers that
 * touch the same pair of accounts in opposite directions.
 *
 * <p>The username-taking overloads enforce ownership (a CUSTOMER may only
 * operate on their own accounts; LOAN_OFFICER/ADMIN may operate on any) and
 * are the ones controllers should call. The username-less overloads skip
 * that check and are for trusted internal callers only (e.g. loan
 * disbursement crediting a customer's account, or EMI payment debiting it —
 * both already validated ownership of the *loan* one level up).
 */
@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final BigDecimal MIN_AMOUNT = new BigDecimal("0.01");

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;

    @Transactional
    public TransactionResponse deposit(Long accountId, BigDecimal amount, String description) {
        validateAmount(amount);
        Account account = lockAccount(accountId);
        ensureActive(account);

        BigDecimal newBalance = account.getBalance().add(amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        Transaction tx = buildTransaction(account.getId(), TransactionType.DEPOSIT, amount, newBalance, null, description);
        return TransactionResponse.from(transactionRepository.save(tx));
    }

    @Transactional
    public TransactionResponse deposit(Long accountId, BigDecimal amount, String description, String username) {
        authorizeAccountAccess(accountId, username);
        return deposit(accountId, amount, description);
    }

    @Transactional
    public TransactionResponse withdraw(Long accountId, BigDecimal amount, String description) {
        validateAmount(amount);
        Account account = lockAccount(accountId);
        ensureActive(account);

        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds in account " + accountId);
        }

        BigDecimal newBalance = account.getBalance().subtract(amount);
        account.setBalance(newBalance);
        accountRepository.save(account);

        Transaction tx = buildTransaction(account.getId(), TransactionType.WITHDRAWAL, amount, newBalance, null, description);
        return TransactionResponse.from(transactionRepository.save(tx));
    }

    @Transactional
    public TransactionResponse withdraw(Long accountId, BigDecimal amount, String description, String username) {
        authorizeAccountAccess(accountId, username);
        return withdraw(accountId, amount, description);
    }

    @Transactional
    public List<TransactionResponse> transfer(
            Long fromAccountId, Long toAccountId, BigDecimal amount, String description, String username) {
        validateAmount(amount);
        if (fromAccountId.equals(toAccountId)) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }
        authorizeAccountAccess(fromAccountId, username);

        // Lock both accounts in a consistent (ascending id) order to avoid deadlocks
        // between two concurrent transfers touching the same pair of accounts.
        Long firstId = Math.min(fromAccountId, toAccountId);
        Long secondId = Math.max(fromAccountId, toAccountId);
        Account first = lockAccount(firstId);
        Account second = lockAccount(secondId);
        Account fromAccount = firstId.equals(fromAccountId) ? first : second;
        Account toAccount = firstId.equals(fromAccountId) ? second : first;

        ensureActive(fromAccount);
        ensureActive(toAccount);

        if (fromAccount.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds in account " + fromAccountId);
        }

        BigDecimal fromNewBalance = fromAccount.getBalance().subtract(amount);
        BigDecimal toNewBalance = toAccount.getBalance().add(amount);
        fromAccount.setBalance(fromNewBalance);
        toAccount.setBalance(toNewBalance);
        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        Transaction out = buildTransaction(
                fromAccount.getId(), TransactionType.TRANSFER_OUT, amount, fromNewBalance, toAccount.getId(), description);
        Transaction in = buildTransaction(
                toAccount.getId(), TransactionType.TRANSFER_IN, amount, toNewBalance, fromAccount.getId(), description);

        Transaction savedOut = transactionRepository.save(out);
        Transaction savedIn = transactionRepository.save(in);

        return List.of(TransactionResponse.from(savedOut), TransactionResponse.from(savedIn));
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactions(Long accountId, String username, Pageable pageable) {
        authorizeAccountAccess(accountId, username);
        return transactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId, pageable)
                .map(TransactionResponse::from);
    }

    private Account lockAccount(Long accountId) {
        return accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));
    }

    private void ensureActive(Account account) {
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Account " + account.getId() + " is not active");
        }
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(MIN_AMOUNT) < 0) {
            throw new IllegalArgumentException("Amount must be at least 0.01");
        }
    }

    private void authorizeAccountAccess(Long accountId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with username: " + username));
        if (user.getRole() != Role.CUSTOMER) {
            return;
        }
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));
        CustomerProfile profile = customerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No customer profile found for the current user"));
        if (!account.getCustomerId().equals(profile.getId())) {
            throw new AccessDeniedException("You do not have access to this account");
        }
    }

    private Transaction buildTransaction(
            Long accountId, TransactionType type, BigDecimal amount, BigDecimal balanceAfter,
            Long relatedAccountId, String description) {
        return Transaction.builder()
                .accountId(accountId)
                .type(type)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .relatedAccountId(relatedAccountId)
                .description(description)
                .status(TransactionStatus.COMPLETED)
                .build();
    }
}
