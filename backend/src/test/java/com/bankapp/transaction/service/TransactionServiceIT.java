package com.bankapp.transaction.service;

import com.bankapp.AbstractIntegrationTest;
import com.bankapp.account.entity.Account;
import com.bankapp.account.entity.AccountStatus;
import com.bankapp.account.entity.AccountType;
import com.bankapp.account.repository.AccountRepository;
import com.bankapp.auth.entity.Role;
import com.bankapp.auth.entity.User;
import com.bankapp.auth.repository.UserRepository;
import com.bankapp.common.security.crypto.PanHasher;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.entity.KycStatus;
import com.bankapp.customer.repository.CustomerProfileRepository;
import com.bankapp.transaction.entity.Transaction;
import com.bankapp.transaction.entity.TransactionType;
import com.bankapp.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Concurrency proof for {@link TransactionService}: fires many concurrent withdrawals/transfers
 * against the same account(s) and asserts the final balance reflects every single one with no
 * lost updates — i.e. that the pessimistic write lock
 * ({@code AccountRepository#findByIdForUpdate}) actually serializes conflicting mutations. Run
 * via {@code mvn verify} (maven-failsafe-plugin); requires Docker — real MySQL row locking is the
 * point, so this deliberately does not run against a mocked repository.
 */
@SpringBootTest
class TransactionServiceIT extends AbstractIntegrationTest {

    private static final int THREAD_COUNT = 40;
    private static final BigDecimal WITHDRAWAL_AMOUNT = new BigDecimal("25.00");
    private static final BigDecimal STARTING_BALANCE = new BigDecimal("10000.00");
    private static final AtomicLong SEQ = new AtomicLong();

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PanHasher panHasher;

    @Test
    void concurrentWithdrawals_againstTheSameAccount_produceNoLostUpdates() throws Exception {
        Long customerId = seedCustomer();
        Account account = seedAccount(customerId, STARTING_BALANCE);

        ExecutorService executor = Executors.newFixedThreadPool(THREAD_COUNT);
        try {
            List<CompletableFuture<Void>> futures = IntStream.range(0, THREAD_COUNT)
                    .mapToObj(i -> CompletableFuture.runAsync(
                            () -> transactionService.withdraw(account.getId(), WITHDRAWAL_AMOUNT, "concurrency test #" + i),
                            executor))
                    .toList();

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).get(60, TimeUnit.SECONDS);
        } finally {
            executor.shutdown();
        }

        Account reloaded = accountRepository.findById(account.getId()).orElseThrow();
        BigDecimal expectedBalance = STARTING_BALANCE.subtract(WITHDRAWAL_AMOUNT.multiply(BigDecimal.valueOf(THREAD_COUNT)));
        assertThat(reloaded.getBalance()).isEqualByComparingTo(expectedBalance);

        List<Transaction> withdrawals = transactionRepository.findAll().stream()
                .filter(tx -> tx.getAccountId().equals(account.getId()) && tx.getType() == TransactionType.WITHDRAWAL)
                .toList();
        assertThat(withdrawals).hasSize(THREAD_COUNT);
    }

    @Test
    void concurrentTransfersBetweenTwoAccounts_conserveTotalBalance() throws Exception {
        // Both accounts belong to the same customer/username, since transfer() authorizes
        // ownership of the *source* account against the calling username, and each thread here
        // alternates which account is the source.
        Long customerId = seedCustomer();
        String username = userRepository.findById(lastCreatedUserId).orElseThrow().getUsername();

        Account accountA = seedAccount(customerId, new BigDecimal("5000.00"));
        Account accountB = seedAccount(customerId, new BigDecimal("5000.00"));
        BigDecimal combinedStart = accountA.getBalance().add(accountB.getBalance());

        ExecutorService executor = Executors.newFixedThreadPool(THREAD_COUNT);
        try {
            List<CompletableFuture<Void>> futures = IntStream.range(0, THREAD_COUNT)
                    .mapToObj(i -> CompletableFuture.runAsync(() -> {
                        Long from = (i % 2 == 0) ? accountA.getId() : accountB.getId();
                        Long to = (i % 2 == 0) ? accountB.getId() : accountA.getId();
                        transactionService.transfer(from, to, new BigDecimal("10.00"), "concurrency transfer #" + i, username);
                    }, executor))
                    .toList();

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).get(60, TimeUnit.SECONDS);
        } finally {
            executor.shutdown();
        }

        Account reloadedA = accountRepository.findById(accountA.getId()).orElseThrow();
        Account reloadedB = accountRepository.findById(accountB.getId()).orElseThrow();
        BigDecimal combinedEnd = reloadedA.getBalance().add(reloadedB.getBalance());

        // Equal numbers of transfers ran in each direction, so each account's net balance should
        // be unchanged, and the combined total is conserved regardless (no money created/lost to
        // a race condition).
        assertThat(combinedEnd).isEqualByComparingTo(combinedStart);
        assertThat(reloadedA.getBalance()).isEqualByComparingTo(accountA.getBalance());
        assertThat(reloadedB.getBalance()).isEqualByComparingTo(accountB.getBalance());
    }

    private Long lastCreatedUserId;

    private Long seedCustomer() {
        long seq = SEQ.incrementAndGet();
        User user = userRepository.save(User.builder()
                .username("tx_it_user_" + seq)
                .email("tx_it_user_" + seq + "@example.com")
                .passwordHash("{noop}not-used-in-this-test")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build());
        lastCreatedUserId = user.getId();

        // Syntactically PAN-shaped (5 letters, 4 digits, 1 letter) but arbitrary per test run.
        String pan = "TXIT" + "P" + String.format("%04d", seq % 10000) + "Q";

        CustomerProfile profile = customerProfileRepository.save(CustomerProfile.builder()
                .userId(user.getId())
                .fullName("Concurrency Test User " + seq)
                .dob(LocalDate.of(1990, 1, 1))
                .panEncrypted(pan)
                .panHash(panHasher.hash(pan + "-" + seq))
                .kycStatus(KycStatus.VERIFIED)
                .consentGiven(true)
                .build());
        return profile.getId();
    }

    private Account seedAccount(Long customerId, BigDecimal balance) {
        long seq = SEQ.incrementAndGet();
        String accountNumber = String.format("IT%010d", seq);
        Account account = Account.builder()
                .customerId(customerId)
                .accountNumber(accountNumber)
                .accountType(AccountType.SAVINGS)
                .balance(balance)
                .status(AccountStatus.ACTIVE)
                .openedDate(LocalDate.now())
                .build();
        return accountRepository.save(account);
    }
}
