package com.bankapp.loan.controller;

import com.bankapp.loan.dto.LoanApplicationRequest;
import com.bankapp.loan.dto.LoanResponse;
import com.bankapp.loan.entity.LoanStatus;
import com.bankapp.loan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/apply")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<LoanResponse> apply(
            Authentication authentication,
            @Valid @RequestBody LoanApplicationRequest request
    ) {
        LoanResponse response = loanService.applyForLoan(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<LoanResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.approveAndDisburse(id));
    }

    /**
     * CUSTOMER: own loans. LOAN_OFFICER/ADMIN: filter by {@code customerId}
     * or {@code status} (e.g. {@code PENDING} for the approval queue), or
     * all loans if neither is given.
     */
    @GetMapping
    public ResponseEntity<List<LoanResponse>> getLoans(
            Authentication authentication,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) LoanStatus status
    ) {
        return ResponseEntity.ok(loanService.getLoans(authentication.getName(), customerId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanResponse> getLoan(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoan(id, authentication.getName()));
    }
}
