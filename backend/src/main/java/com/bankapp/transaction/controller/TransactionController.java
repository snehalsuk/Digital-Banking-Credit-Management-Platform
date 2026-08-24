package com.bankapp.transaction.controller;

import com.bankapp.transaction.dto.DepositRequest;
import com.bankapp.transaction.dto.TransactionResponse;
import com.bankapp.transaction.dto.TransferRequest;
import com.bankapp.transaction.dto.WithdrawRequest;
import com.bankapp.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/api/accounts/{id}/deposit")
    public ResponseEntity<TransactionResponse> deposit(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody DepositRequest request
    ) {
        return ResponseEntity.ok(
                transactionService.deposit(id, request.amount(), request.description(), authentication.getName()));
    }

    @PostMapping("/api/accounts/{id}/withdraw")
    public ResponseEntity<TransactionResponse> withdraw(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody WithdrawRequest request
    ) {
        return ResponseEntity.ok(
                transactionService.withdraw(id, request.amount(), request.description(), authentication.getName()));
    }

    @PostMapping("/api/transfers")
    public ResponseEntity<List<TransactionResponse>> transfer(
            Authentication authentication,
            @Valid @RequestBody TransferRequest request
    ) {
        return ResponseEntity.ok(transactionService.transfer(
                request.fromAccountId(), request.toAccountId(), request.amount(), request.description(),
                authentication.getName()));
    }

    @GetMapping("/api/accounts/{id}/transactions")
    public ResponseEntity<Page<TransactionResponse>> getTransactions(
            Authentication authentication,
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(transactionService.getTransactions(id, authentication.getName(), pageable));
    }
}
