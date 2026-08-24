package com.bankapp.common.exception;

/**
 * Thrown when a credit bureau / PAN-based lookup is attempted without the caller explicitly
 * confirming consent ({@code consentConfirmed=true}) in the request. Every rejection on this
 * path is still audit-logged before this is thrown — see {@code AuditService.logBureauLookup}.
 */
public class ConsentRequiredException extends RuntimeException {

    public ConsentRequiredException(String message) {
        super(message);
    }
}
