package com.bankapp.loan.controller;

import com.bankapp.loan.scheduler.OverdueEmiScheduledTask;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** ADMIN-only manual trigger for the overdue-EMI batch job, so it can be exercised without waiting for the cron. */
@RestController
@RequestMapping("/api/admin/loans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLoanController {

    private final OverdueEmiScheduledTask overdueEmiScheduledTask;

    @PostMapping("/run-overdue-check")
    public ResponseEntity<Map<String, Object>> runOverdueCheck() {
        int updatedCount = overdueEmiScheduledTask.runOverdueCheck();
        return ResponseEntity.ok(Map.of("updatedCount", updatedCount));
    }
}
