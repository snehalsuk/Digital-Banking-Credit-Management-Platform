CREATE TABLE customer_profile (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT       NOT NULL,
    full_name           VARCHAR(128) NOT NULL,
    dob                 DATE         NOT NULL,

    -- AES-256-GCM encrypted PAN, base64(IV || ciphertext || GCM tag). Never plaintext.
    -- See PanAttributeConverter. Stored as VARCHAR (not VARBINARY) because the
    -- converter's output type is a base64 String.
    pan_encrypted       VARCHAR(255) NOT NULL,

    -- Deterministic HMAC-SHA256(pan, pepper), hex-encoded (64 chars). Used for
    -- indexed lookup since pan_encrypted is not searchable (random IV per row).
    pan_hash            CHAR(64)     NOT NULL,

    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    phone               VARCHAR(20),

    kyc_status          VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
    consent_given       BOOLEAN      NOT NULL DEFAULT FALSE,
    consent_timestamp   TIMESTAMP    NULL,

    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_customer_profile_user_id UNIQUE (user_id),
    CONSTRAINT uk_customer_profile_pan_hash UNIQUE (pan_hash),
    CONSTRAINT fk_customer_profile_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT chk_customer_profile_kyc_status CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_customer_profile_kyc_status ON customer_profile (kyc_status);
