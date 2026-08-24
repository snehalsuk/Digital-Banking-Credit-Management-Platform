package com.bankapp.audit.repository;

import com.bankapp.audit.entity.BureauLookupAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BureauLookupAuditRepository extends JpaRepository<BureauLookupAudit, Long> {
}
