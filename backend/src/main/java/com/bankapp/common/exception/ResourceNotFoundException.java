package com.bankapp.common.exception;

/** Thrown when a requested resource (entity) does not exist. */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
