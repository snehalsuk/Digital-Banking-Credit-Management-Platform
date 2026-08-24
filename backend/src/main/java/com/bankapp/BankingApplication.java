package com.bankapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the banking application backend.
 *
 * Scheduling is enabled here for jobs such as the loan module's overdue-EMI
 * scheduled task (added in a later phase).
 */
@SpringBootApplication
@EnableScheduling
public class BankingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankingApplication.class, args);
    }
}
