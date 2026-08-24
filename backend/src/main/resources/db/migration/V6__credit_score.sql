CREATE TABLE credit_score_snapshot (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id         BIGINT        NOT NULL,
    pan_hash            CHAR(64)      NOT NULL,
    source              VARCHAR(16)   NOT NULL,
    score               INT           NOT NULL,
    score_band          VARCHAR(16)   NOT NULL,

    -- Serialized (Jackson) JSON of the raw bureau response this snapshot was derived from.
    raw_response_json   LONGTEXT      NULL,

    fetched_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_credit_score_snapshot_customer FOREIGN KEY (customer_id) REFERENCES customer_profile (id),
    CONSTRAINT chk_credit_score_snapshot_source CHECK (source IN ('BUREAU', 'INTERNAL', 'COMBINED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Supports "latest score for this customer" style lookups.
CREATE INDEX idx_customer_fetched ON credit_score_snapshot (customer_id, fetched_at);

CREATE TABLE bureau_lookup_audit (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_user_id   BIGINT        NOT NULL,

    -- Null when the PAN could not be resolved to any customer (NOT_FOUND outcome).
    customer_id         BIGINT        NULL,

    pan_hash            CHAR(64)      NOT NULL,
    purpose             VARCHAR(128)  NULL,
    consent_confirmed   BOOLEAN       NOT NULL DEFAULT FALSE,
    bureau_provider     VARCHAR(64)   NULL,

    -- One of NOT_FOUND, FORBIDDEN, CONSENT_DENIED, SUCCESS.
    response_status     VARCHAR(32)   NOT NULL,

    requested_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bureau_lookup_audit_requester FOREIGN KEY (requester_user_id) REFERENCES users (id),
    CONSTRAINT fk_bureau_lookup_audit_customer FOREIGN KEY (customer_id) REFERENCES customer_profile (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Supports "all lookups for this PAN over time" audit queries.
CREATE INDEX idx_pan_hash_requested ON bureau_lookup_audit (pan_hash, requested_at);
