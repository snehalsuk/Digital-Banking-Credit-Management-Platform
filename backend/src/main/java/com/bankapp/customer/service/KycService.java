package com.bankapp.customer.service;

import com.bankapp.common.exception.ResourceNotFoundException;
import com.bankapp.customer.dto.CustomerProfileResponse;
import com.bankapp.customer.dto.KycStatusUpdateRequest;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.repository.CustomerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Officer/admin-only workflow for approving or rejecting a customer's KYC. */
@Service
@RequiredArgsConstructor
public class KycService {

    private final CustomerProfileRepository customerProfileRepository;

    @Transactional
    public CustomerProfileResponse updateKycStatus(Long customerProfileId, KycStatusUpdateRequest request) {
        CustomerProfile profile = customerProfileRepository.findById(customerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("No customer profile found with id: " + customerProfileId));

        profile.setKycStatus(request.kycStatus());
        CustomerProfile saved = customerProfileRepository.save(profile);

        // Officer/admin performing the update is authorized to see the unmasked PAN.
        return CustomerProfileResponse.from(saved, saved.getPanEncrypted(), true);
    }
}
