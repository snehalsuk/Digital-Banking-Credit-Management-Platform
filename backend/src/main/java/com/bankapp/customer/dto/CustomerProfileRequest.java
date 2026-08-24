package com.bankapp.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CustomerProfileRequest(

        @NotBlank
        @Size(max = 128)
        String fullName,

        @NotNull
        @Past
        LocalDate dob,

        @NotBlank
        @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "PAN must match the format AAAAA9999A")
        String pan,

        @Size(max = 255)
        String addressLine1,

        @Size(max = 255)
        String addressLine2,

        @Size(max = 100)
        String city,

        @Size(max = 100)
        String state,

        @Size(max = 10)
        String pincode,

        @Size(max = 20)
        String phone,

        @NotNull
        Boolean consentGiven
) {
}
