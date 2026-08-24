package com.bankapp.auth.entity;

/** Application roles used for RBAC via Spring Security {@code @PreAuthorize}. */
public enum Role {
    CUSTOMER,
    LOAN_OFFICER,
    ADMIN
}
