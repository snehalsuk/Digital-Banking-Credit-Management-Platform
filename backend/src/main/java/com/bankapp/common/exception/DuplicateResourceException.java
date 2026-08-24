package com.bankapp.common.exception;

/** Thrown when an attempt is made to create a resource that violates a uniqueness constraint. */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
