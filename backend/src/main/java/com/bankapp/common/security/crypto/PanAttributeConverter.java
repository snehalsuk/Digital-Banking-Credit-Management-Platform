package com.bankapp.common.security.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * JPA attribute converter that encrypts a PAN (India tax ID) with AES-256-GCM
 * before it is persisted, and decrypts it on read.
 *
 * <p>Storage format: {@code base64(IV || ciphertext || GCM authentication tag)}.
 * A fresh random 12-byte IV is generated for every encryption, so the same
 * plaintext PAN never produces the same ciphertext twice. Because the
 * ciphertext is not searchable, lookups use the separate deterministic
 * {@link PanHasher} hash column instead.
 *
 * <p>Key: base64-encoded 256-bit AES key from {@code security.crypto.pan-key}
 * (env var {@code PAN_ENCRYPTION_KEY}).
 *
 * <p>Registered as a Spring bean ({@code autoApply = false}) so the
 * {@code @Value}-injected key is available; entities opt in explicitly via
 * {@code @Convert(converter = PanAttributeConverter.class)}.
 */
@Component
@Converter(autoApply = false)
public class PanAttributeConverter implements AttributeConverter<String, String> {

    private static final String AES_ALGORITHM = "AES";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;

    private final SecretKeySpec secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public PanAttributeConverter(@Value("${security.crypto.pan-key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        this.secretKey = new SecretKeySpec(keyBytes, AES_ALGORITHM);
    }

    @Override
    public String convertToDatabaseColumn(String plainPan) {
        if (plainPan == null) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] cipherText = cipher.doFinal(plainPan.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt PAN attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String storedValue) {
        if (storedValue == null) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(storedValue);

            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH_BYTES);

            int cipherTextLength = combined.length - GCM_IV_LENGTH_BYTES;
            byte[] cipherText = new byte[cipherTextLength];
            System.arraycopy(combined, GCM_IV_LENGTH_BYTES, cipherText, 0, cipherTextLength);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] plainBytes = cipher.doFinal(cipherText);
            return new String(plainBytes, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt PAN attribute", e);
        }
    }
}
