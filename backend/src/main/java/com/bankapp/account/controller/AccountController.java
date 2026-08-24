package com.bankapp.account.controller;

import com.bankapp.account.dto.AccountCreateRequest;
import com.bankapp.account.dto.AccountResponse;
import com.bankapp.account.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<AccountResponse> openAccount(
            Authentication authentication,
            @Valid @RequestBody AccountCreateRequest request
    ) {
        AccountResponse response = accountService.openAccount(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Current user's own accounts, or — for LOAN_OFFICER/ADMIN — a given
     * customer's accounts when {@code customerId} is supplied.
     */
    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAccounts(
            Authentication authentication,
            @RequestParam(required = false) Long customerId
    ) {
        if (customerId != null && isOfficerOrAdmin(authentication)) {
            return ResponseEntity.ok(accountService.getAccountsForCustomer(customerId));
        }
        return ResponseEntity.ok(accountService.getAccountsForCurrentUser(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccount(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccount(id, authentication.getName()));
    }

    private boolean isOfficerOrAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LOAN_OFFICER") || a.getAuthority().equals("ROLE_ADMIN"));
    }
}
