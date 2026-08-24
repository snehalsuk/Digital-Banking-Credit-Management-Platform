package com.bankapp.customer.dto;

import com.bankapp.customer.entity.CustomerProfile;
import com.bankapp.customer.entity.KycStatus;
import com.bankapp.common.util.MaskingUtil;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Customer profile response. The {@code pan} field is masked
 * (e.g. {@code "XXXXXX234F"}) unless the caller is the profile's owner, per
 * docs/SECURITY.md — see {@link #from(CustomerProfile, String, boolean)}.
 */
public record CustomerProfileResponse(
        Long id,
        Long userId,
        String fullName,
        LocalDate dob,
        String pan,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String pincode,
        String phone,
        KycStatus kycStatus,
        boolean consentGiven,
        Instant consentTimestamp,
        Instant createdAt,
        Instant updatedAt
) {

    /**
     * @param profile     the entity
     * @param plainPan    the decrypted PAN (already read off the entity by the caller)
     * @param isOwnerView true if the requester is the profile's owner (or otherwise authorized to see the unmasked PAN)
     */
    public static CustomerProfileResponse from(CustomerProfile profile, String plainPan, boolean isOwnerView) {
        String panForResponse = isOwnerView ? plainPan : MaskingUtil.maskPan(plainPan);

        return new CustomerProfileResponse(
                profile.getId(),
                profile.getUserId(),
                profile.getFullName(),
                profile.getDob(),
                panForResponse,
                profile.getAddressLine1(),
                profile.getAddressLine2(),
                profile.getCity(),
                profile.getState(),
                profile.getPincode(),
                profile.getPhone(),
                profile.getKycStatus(),
                profile.isConsentGiven(),
                profile.getConsentTimestamp(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
