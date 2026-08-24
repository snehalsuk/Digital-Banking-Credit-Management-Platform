package com.bankapp.common.exception;

/** Thrown when a withdrawal or transfer would take an account balance below zero. */
public class InsufficientFundsException extends RuntimeException {

    public InsufficientFundsException(String message) {
        super(message);
    }
}
