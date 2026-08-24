package com.bankapp.customer.controller;

import com.bankapp.customer.dto.CustomerProfileRequest;
import com.bankapp.customer.dto.CustomerProfileResponse;
import com.bankapp.customer.dto.KycStatusUpdateRequest;
import com.bankapp.customer.service.CustomerService;
import com.bankapp.customer.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final KycService kycService;

    @GetMapping("/me")
    public ResponseEntity<CustomerProfileResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(customerService.getOwnProfile(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<CustomerProfileResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody CustomerProfileRequest request
    ) {
        return ResponseEntity.ok(customerService.createOrUpdateOwnProfile(authentication.getName(), request));
    }

    @PostMapping("/{id}/kyc-status")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<CustomerProfileResponse> updateKycStatus(
            @PathVariable Long id,
            @Valid @RequestBody KycStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(kycService.updateKycStatus(id, request));
    }
}
