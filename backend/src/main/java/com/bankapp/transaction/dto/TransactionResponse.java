package com.bankapp.transaction.dto;

import com.bankapp.transaction.entity.Transaction;
import com.bankapp.transaction.entity.TransactionStatus;
import com.bankapp.transaction.entity.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionResponse(
        Long id,
        Long accountId,
        TransactionType type,
        BigDecimal amount,
        BigDecimal balanceAfter,
        Long relatedAccountId,
        String description,
        TransactionStatus status,
        Instant createdAt
) {
    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getAccountId(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getBalanceAfter(),
                transaction.getRelatedAccountId(),
                transaction.getDescription(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        );
    }
}
