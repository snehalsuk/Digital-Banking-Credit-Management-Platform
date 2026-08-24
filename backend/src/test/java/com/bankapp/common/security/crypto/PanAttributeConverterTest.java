package com.bankapp.common.security.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class PanAttributeConverterTest {

    // A fresh, throwaway 256-bit key generated for the test run only (never a real secret).
    private static final String BASE64_KEY = generateBase64Key();
    private static final String PEPPER = "unit-test-pepper-not-a-real-secret";

    private PanAttributeConverter converter;
    private PanHasher panHasher;

    @BeforeEach
    void setUp() {
        converter = new PanAttributeConverter(BASE64_KEY);
        panHasher = new PanHasher(PEPPER);
    }

    @Test
    void encryptThenDecrypt_recoversTheOriginalPan() {
        String pan = "ABCPD1234F";

        String encrypted = converter.convertToDatabaseColumn(pan);
        String decrypted = converter.convertToEntityAttribute(encrypted);

        assertThat(decrypted).isEqualTo(pan);
    }

    @Test
    void twoEncryptionsOfTheSamePan_produceDifferentCiphertext_dueToRandomIv() {
        String pan = "ABCPD1234F";

        String encryptedFirst = converter.convertToDatabaseColumn(pan);
        String encryptedSecond = converter.convertToDatabaseColumn(pan);

        assertThat(encryptedFirst).isNotEqualTo(encryptedSecond);

        // But both still decrypt back to the same plaintext.
        assertThat(converter.convertToEntityAttribute(encryptedFirst)).isEqualTo(pan);
        assertThat(converter.convertToEntityAttribute(encryptedSecond)).isEqualTo(pan);
    }

    @Test
    void nullInput_roundTripsAsNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    void panHasher_sameInput_alwaysProducesTheSameHash() {
        String pan = "ABCPD1234F";

        String hash1 = panHasher.hash(pan);
        String hash2 = panHasher.hash(pan);

        assertThat(hash1).isEqualTo(hash2);
        assertThat(hash1).hasSize(64); // hex-encoded SHA-256 output
    }

    @Test
    void panHasher_differentPans_produceDifferentHashes() {
        assertThat(panHasher.hash("ABCPD1234F")).isNotEqualTo(panHasher.hash("ZZZPD9999Z"));
    }

    private static String generateBase64Key() {
        byte[] key = new byte[32]; // 256 bits
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }
}
