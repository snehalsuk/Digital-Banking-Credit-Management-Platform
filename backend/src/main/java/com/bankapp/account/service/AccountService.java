package com.bankapp.account.service;

import com.bankapp.account.dto.AccountCreateRequest;
import com.bankapp.account.dto.AccountResponse;
import com.bankapp.account.entity.Account;
import com.bankapp.account.entity.AccountStatus;
import com.bankapp.account.repository.AccountRepository;
import com.bankapp.auth.entity.Role;
import com.bankapp.auth.entity.User;
import com.bankapp.auth.repository.UserRepository;
import com.bankapp.common.exception.ResourceNotFoundException;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.repository.CustomerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private static final int ACCOUNT_NUMBER_LENGTH = 12;
    private static final int MAX_GENERATION_ATTEMPTS = 10;

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AccountResponse openAccount(String username, AccountCreateRequest request) {
        User user = resolveUser(username);
        CustomerProfile profile = customerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Complete your KYC profile before opening an account"));

        Account account = Account.builder()
                .customerId(profile.getId())
                .accountNumber(generateUniqueAccountNumber())
                .accountType(request.accountType())
                .balance(BigDecimal.ZERO)
                .status(AccountStatus.ACTIVE)
                .openedDate(LocalDate.now())
                .build();

        Account saved = accountRepository.save(account);
        return AccountResponse.from(saved, true);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsForCurrentUser(String username) {
        User user = resolveUser(username);
        CustomerProfile profile = customerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No customer profile found for the current user"));

        return accountRepository.findByCustomerId(profile.getId()).stream()
                .map(a -> AccountResponse.from(a, true))
                .toList();
    }

    /** For LOAN_OFFICER/ADMIN callers looking up a specific customer's accounts. */
    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsForCustomer(Long customerId) {
        return accountRepository.findByCustomerId(customerId).stream()
                .map(a -> AccountResponse.from(a, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(Long id, String username) {
        User user = resolveUser(username);
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + id));

        if (user.getRole() == Role.CUSTOMER) {
            CustomerProfile profile = customerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("No customer profile found for the current user"));
            if (!account.getCustomerId().equals(profile.getId())) {
                throw new AccessDeniedException("You do not have access to this account");
            }
        }

        return AccountResponse.from(account, true);
    }

    private String generateUniqueAccountNumber() {
        for (int attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            String candidate = randomNumericString(ACCOUNT_NUMBER_LENGTH);
            if (!accountRepository.existsByAccountNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique account number, please retry");
    }

    private String randomNumericString(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
    }

    private User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with username: " + username));
    }
}
