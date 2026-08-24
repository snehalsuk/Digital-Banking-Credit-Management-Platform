package com.bankapp.account.dto;

import com.bankapp.account.entity.AccountType;
import jakarta.validation.constraints.NotNull;

public record AccountCreateRequest(
        @NotNull
        AccountType accountType
) {
}
