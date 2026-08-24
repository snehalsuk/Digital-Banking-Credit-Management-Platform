package com.bankapp.audit.controller;

import com.bankapp.audit.dto.BureauLookupAuditResponse;
import com.bankapp.audit.repository.BureauLookupAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * ADMIN-only view of the {@code bureau_lookup_audit} trail (every PAN-based credit-score lookup
 * attempt, success or not — see {@code AuditService.logBureauLookup}). Filterable by
 * {@code panHash} and/or an inclusive {@code [from, to]} request-time range; all filters are
 * optional.
 */
@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final BureauLookupAuditRepository bureauLookupAuditRepository;

    @GetMapping("/bureau-lookups")
    public ResponseEntity<Page<BureauLookupAuditResponse>> getBureauLookups(
            @RequestParam(required = false) String panHash,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 20, sort = "requestedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<BureauLookupAuditResponse> page = bureauLookupAuditRepository
                .search(panHash, from, to, pageable)
                .map(BureauLookupAuditResponse::from);
        return ResponseEntity.ok(page);
    }
}
