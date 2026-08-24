CREATE TABLE accounts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id     BIGINT        NOT NULL,
    account_number  VARCHAR(20)   NOT NULL,
    account_type    VARCHAR(16)   NOT NULL,
    balance         DECIMAL(19,4) NOT NULL DEFAULT 0,
    status          VARCHAR(16)   NOT NULL DEFAULT 'ACTIVE',
    opened_date     DATE          NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_accounts_account_number UNIQUE (account_number),
    CONSTRAINT fk_accounts_customer FOREIGN KEY (customer_id) REFERENCES customer_profile (id),
    CONSTRAINT chk_accounts_account_type CHECK (account_type IN ('SAVINGS', 'CURRENT')),
    CONSTRAINT chk_accounts_status CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_accounts_customer_id ON accounts (customer_id);
