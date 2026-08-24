package com.bankapp.audit.repository;

import com.bankapp.audit.entity.BureauLookupAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface BureauLookupAuditRepository extends JpaRepository<BureauLookupAudit, Long> {

    /**
     * Paginated audit search for {@code AdminAuditController}. Every filter is optional — a
     * {@code null} parameter is treated as "no constraint" via the {@code :param IS NULL OR ...}
     * pattern, so the same query serves the unfiltered, PAN-filtered, date-range-filtered, and
     * combined cases without building a {@code Specification}.
     */
    @Query("SELECT a FROM BureauLookupAudit a WHERE "
            + "(:panHash IS NULL OR a.panHash = :panHash) AND "
            + "(:from IS NULL OR a.requestedAt >= :from) AND "
            + "(:to IS NULL OR a.requestedAt <= :to)")
    Page<BureauLookupAudit> search(
            @Param("panHash") String panHash,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);
}
