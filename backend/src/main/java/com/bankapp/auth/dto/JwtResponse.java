package com.bankapp.auth.dto;

public record JwtResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        String username,
        String role
) {
    public JwtResponse(String accessToken, String refreshToken, String username, String role) {
        this(accessToken, refreshToken, "Bearer", username, role);
    }
}
