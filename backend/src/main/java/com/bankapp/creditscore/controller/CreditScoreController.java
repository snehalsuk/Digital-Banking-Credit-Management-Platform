package com.bankapp.creditscore.controller;

import com.bankapp.auth.entity.User;
import com.bankapp.auth.repository.UserRepository;
import com.bankapp.common.exception.ResourceNotFoundException;
import com.bankapp.creditscore.dto.CreditScoreLookupRequest;
import com.bankapp.creditscore.dto.CreditScoreLookupResponse;
import com.bankapp.creditscore.service.CreditScoreAggregationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * PAN goes in the request body of a POST, deliberately never in a URL/query param, so it never
 * lands in access logs. Authorization (CUSTOMER = self only, LOAN_OFFICER/ADMIN = anyone) is
 * enforced inside {@link CreditScoreAggregationService}, not here, since it depends on whose PAN
 * was resolved rather than a static role check.
 */
@RestController
@RequestMapping("/api/credit-score")
@RequiredArgsConstructor
public class CreditScoreController {

    private final CreditScoreAggregationService creditScoreAggregationService;
    private final UserRepository userRepository;

    @PostMapping("/lookup")
    public ResponseEntity<CreditScoreLookupResponse> lookup(
            Authentication authentication,
            @Valid @RequestBody CreditScoreLookupRequest request
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("No user found with username: " + authentication.getName()));
        return ResponseEntity.ok(creditScoreAggregationService.lookupByPan(request, user));
    }
}
