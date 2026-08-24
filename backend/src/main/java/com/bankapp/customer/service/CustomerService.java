package com.bankapp.customer.service;

import com.bankapp.auth.entity.User;
import com.bankapp.auth.repository.UserRepository;
import com.bankapp.common.exception.DuplicateResourceException;
import com.bankapp.common.exception.ResourceNotFoundException;
import com.bankapp.common.security.crypto.PanHasher;
import com.bankapp.customer.dto.CustomerProfileRequest;
import com.bankapp.customer.dto.CustomerProfileResponse;
import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.entity.KycStatus;
import com.bankapp.customer.repository.CustomerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Creates/updates a customer's own KYC profile. PAN uniqueness is enforced
 * via the deterministic {@link PanHasher} hash (the encrypted column itself
 * is not searchable) — a duplicate PAN across two different users is
 * rejected with a clear error rather than silently overwriting or allowing
 * two profiles to point at the same real-world identity.
 */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerProfileRepository customerProfileRepository;
    private final UserRepository userRepository;
    private final PanHasher panHasher;

    @Transactional
    public CustomerProfileResponse createOrUpdateOwnProfile(String username, CustomerProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with username: " + username));

        String panHash = panHasher.hash(request.pan());

        CustomerProfile existingForUser = customerProfileRepository.findByUserId(user.getId()).orElse(null);

        customerProfileRepository.findByPanHash(panHash).ifPresent(existingForPan -> {
            boolean belongsToSameProfile = existingForUser != null && existingForUser.getId().equals(existingForPan.getId());
            if (!belongsToSameProfile) {
                throw new DuplicateResourceException("A customer profile already exists for this PAN");
            }
        });

        CustomerProfile profile = existingForUser != null ? existingForUser : new CustomerProfile();
        profile.setUserId(user.getId());
        profile.setFullName(request.fullName());
        profile.setDob(request.dob());
        profile.setPanEncrypted(request.pan());
        profile.setPanHash(panHash);
        profile.setAddressLine1(request.addressLine1());
        profile.setAddressLine2(request.addressLine2());
        profile.setCity(request.city());
        profile.setState(request.state());
        profile.setPincode(request.pincode());
        profile.setPhone(request.phone());

        boolean consentNowGiven = Boolean.TRUE.equals(request.consentGiven());
        if (consentNowGiven && !profile.isConsentGiven()) {
            profile.setConsentTimestamp(Instant.now());
        }
        profile.setConsentGiven(consentNowGiven);

        if (profile.getKycStatus() == null) {
            profile.setKycStatus(KycStatus.PENDING);
        }

        CustomerProfile saved = customerProfileRepository.save(profile);

        return CustomerProfileResponse.from(saved, saved.getPanEncrypted(), true);
    }

    @Transactional(readOnly = true)
    public CustomerProfileResponse getOwnProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with username: " + username));

        CustomerProfile profile = customerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No customer profile found for the current user"));

        return CustomerProfileResponse.from(profile, profile.getPanEncrypted(), true);
    }
}
