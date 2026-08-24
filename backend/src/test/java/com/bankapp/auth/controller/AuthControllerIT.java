package com.bankapp.auth.controller;

import com.bankapp.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end register -> login -> refresh flow against a real MySQL Testcontainers instance with
 * real Flyway migrations applied, asserting the issued JWTs actually authenticate subsequent
 * requests. Run via {@code mvn verify} (maven-failsafe-plugin); requires Docker.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class AuthControllerIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerLoginRefresh_endToEnd_issuesWorkingJwts() throws Exception {
        String username = "it_auth_user";
        String email = "it_auth_user@example.com";
        String password = "Sup3rSecret!23";

        // 1. Register.
        Map<String, String> registerRequest = Map.of("username", username, "email", email, "password", password);
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andReturn();

        JsonNode registerJson = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String registerAccessToken = registerJson.get("accessToken").asText();

        // The access token from registration must already authenticate a protected endpoint.
        // No customer profile exists yet, so the expected outcome is 404 (authenticated, but
        // nothing found) rather than 401/403 (which would mean the JWT itself did not work).
        mockMvc.perform(get("/api/customers/me")
                        .header("Authorization", "Bearer " + registerAccessToken))
                .andExpect(status().isNotFound());

        // 2. Login with the same credentials.
        Map<String, String> loginRequest = Map.of("username", username, "password", password);
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String loginAccessToken = loginJson.get("accessToken").asText();
        String loginRefreshToken = loginJson.get("refreshToken").asText();

        mockMvc.perform(get("/api/customers/me")
                        .header("Authorization", "Bearer " + loginAccessToken))
                .andExpect(status().isNotFound());

        // 3. Refresh: exchange the refresh token for a fresh access token that also works.
        Map<String, String> refreshRequest = Map.of("refreshToken", loginRefreshToken);
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        JsonNode refreshJson = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
        String refreshedAccessToken = refreshJson.get("accessToken").asText();
        assertThat(refreshedAccessToken).isNotBlank();

        mockMvc.perform(get("/api/customers/me")
                        .header("Authorization", "Bearer " + refreshedAccessToken))
                .andExpect(status().isNotFound());

        // 4. A request with no token at all must be rejected.
        mockMvc.perform(get("/api/customers/me"))
                .andExpect(status().isUnauthorized());

        // 5. Logging in with the wrong password must fail cleanly.
        Map<String, String> badLoginRequest = Map.of("username", username, "password", "wrong-password");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLoginRequest)))
                .andExpect(status().isUnauthorized());
    }
}
