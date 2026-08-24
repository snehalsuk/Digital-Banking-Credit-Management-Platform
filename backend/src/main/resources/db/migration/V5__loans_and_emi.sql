CREATE TABLE loans (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id           BIGINT        NOT NULL,
    account_id            BIGINT        NOT NULL,
    loan_type             VARCHAR(32)   NOT NULL,
    principal             DECIMAL(19,4) NOT NULL,
    interest_rate_annual  DECIMAL(5,2)  NOT NULL,
    tenure_months         INT           NOT NULL,
    emi_amount            DECIMAL(19,4) NOT NULL,
    status                VARCHAR(16)   NOT NULL DEFAULT 'PENDING',
    disbursed_date        DATE          NULL,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_loans_customer FOREIGN KEY (customer_id) REFERENCES customer_profile (id),
    CONSTRAINT fk_loans_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT chk_loans_status CHECK (status IN ('PENDING', 'ACTIVE', 'CLOSED', 'DEFAULTED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_loans_customer_id ON loans (customer_id);
CREATE INDEX idx_loans_status ON loans (status);

CREATE TABLE emi_schedule (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_id               BIGINT        NOT NULL,
    installment_number    INT           NOT NULL,
    due_date              DATE          NOT NULL,
    principal_component   DECIMAL(19,4) NOT NULL,
    interest_component    DECIMAL(19,4) NOT NULL,
    emi_amount            DECIMAL(19,4) NOT NULL,
    paid_amount           DECIMAL(19,4) NOT NULL DEFAULT 0,
    paid_date             DATE          NULL,
    status                VARCHAR(16)   NOT NULL DEFAULT 'PENDING',
    days_overdue          INT           NOT NULL DEFAULT 0,

    CONSTRAINT uk_emi_schedule_loan_installment UNIQUE (loan_id, installment_number),
    CONSTRAINT fk_emi_schedule_loan FOREIGN KEY (loan_id) REFERENCES loans (id),
    CONSTRAINT chk_emi_schedule_status CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'DEFAULTED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- The overdue-scan job filters by (status, due_date); the pending-EMI lookup filters/orders by (loan_id/status, due_date).
CREATE INDEX idx_emi_schedule_status_due_date ON emi_schedule (status, due_date);
CREATE INDEX idx_emi_schedule_loan_id ON emi_schedule (loan_id);
