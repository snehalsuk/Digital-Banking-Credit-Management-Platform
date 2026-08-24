package com.bankapp.customer.dto;

import com.bankapp.customer.entity.KycStatus;
import jakarta.validation.constraints.NotNull;

public record KycStatusUpdateRequest(

        @NotNull
        KycStatus kycStatus
) {
}
