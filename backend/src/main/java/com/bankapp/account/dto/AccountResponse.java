package com.bankapp.account.dto;

import com.bankapp.account.entity.Account;
import com.bankapp.account.entity.AccountStatus;
import com.bankapp.account.entity.AccountType;
import com.bankapp.common.util.MaskingUtil;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Account response. {@code accountNumber} is masked to its last 4 digits
 * unless the caller is the account's owner or an authorized officer/admin —
 * see {@link #from(Account, boolean)}.
 */
public record AccountResponse(
        Long id,
        Long customerId,
        String accountNumber,
        AccountType accountType,
        BigDecimal balance,
        AccountStatus status,
        LocalDate openedDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static AccountResponse from(Account account, boolean showFullAccountNumber) {
        String accountNumber = showFullAccountNumber
                ? account.getAccountNumber()
                : MaskingUtil.maskAccountNumber(account.getAccountNumber());

        return new AccountResponse(
                account.getId(),
                account.getCustomerId(),
                accountNumber,
                account.getAccountType(),
                account.getBalance(),
                account.getStatus(),
                account.getOpenedDate(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }
}
