package com.bankapp.loan.controller;

import com.bankapp.loan.dto.EmiPaymentRequest;
import com.bankapp.loan.dto.EmiScheduleResponse;
import com.bankapp.loan.service.EmiPaymentService;
import com.bankapp.loan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans/{id}")
@RequiredArgsConstructor
public class EmiController {

    private final LoanService loanService;
    private final EmiPaymentService emiPaymentService;

    @GetMapping("/emi-schedule")
    public ResponseEntity<List<EmiScheduleResponse>> getEmiSchedule(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(loanService.getEmiSchedule(id, authentication.getName()));
    }

    @PostMapping("/emi/{installmentNumber}/pay")
    public ResponseEntity<EmiScheduleResponse> payEmi(
            Authentication authentication,
            @PathVariable Long id,
            @PathVariable Integer installmentNumber,
            @Valid @RequestBody EmiPaymentRequest request
    ) {
        return ResponseEntity.ok(
                emiPaymentService.payInstallment(id, installmentNumber, request.amount(), authentication.getName()));
    }
}
