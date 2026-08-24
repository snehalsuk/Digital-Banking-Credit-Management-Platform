CREATE TABLE transactions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id          BIGINT        NOT NULL,
    type                VARCHAR(16)   NOT NULL,
    amount              DECIMAL(19,4) NOT NULL,
    balance_after       DECIMAL(19,4) NOT NULL,
    related_account_id  BIGINT        NULL,
    description         VARCHAR(255),
    status              VARCHAR(16)   NOT NULL DEFAULT 'COMPLETED',
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_transactions_related_account FOREIGN KEY (related_account_id) REFERENCES accounts (id),
    CONSTRAINT chk_transactions_type CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT')),
    CONSTRAINT chk_transactions_status CHECK (status IN ('COMPLETED', 'FAILED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Ledger reads are almost always "this account's transactions, most recent first".
CREATE INDEX idx_transactions_account_created ON transactions (account_id, created_at);
