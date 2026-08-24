package com.bankapp.common.security.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Computes a deterministic HMAC-SHA256 hash of a PAN, used as an indexed,
 * searchable stand-in for the (non-searchable, randomized-IV) encrypted PAN
 * column. Same PAN always produces the same hash, which is what makes it
 * usable in a unique index / {@code WHERE pan_hash = ?} lookup, while a
 * secret pepper keeps the hash from being reversible via a rainbow table of
 * all valid PAN strings.
 *
 * <p>Pepper: {@code security.crypto.pan-pepper} (env var {@code PAN_HASH_PEPPER}).
 * This is intentionally a different secret from the AES key used by
 * {@link PanAttributeConverter}, so compromising one does not compromise the
 * other property (confidentiality vs. lookup).
 */
@Component
public class PanHasher {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final SecretKeySpec pepperKey;

    public PanHasher(@Value("${security.crypto.pan-pepper}") String pepper) {
        this.pepperKey = new SecretKeySpec(pepper.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
    }

    /**
     * @param pan plaintext PAN (e.g. {@code "ABCPD1234F"})
     * @return lowercase hex-encoded HMAC-SHA256(pan, pepper), 64 characters long
     */
    public String hash(String pan) {
        if (pan == null) {
            return null;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(pepperKey);
            byte[] hashBytes = mac.doFinal(pan.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            throw new IllegalStateException("Failed to hash PAN attribute", e);
        }
    }
}
