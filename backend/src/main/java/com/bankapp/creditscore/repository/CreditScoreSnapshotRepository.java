package com.bankapp.creditscore.repository;

import com.bankapp.creditscore.entity.CreditScoreSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditScoreSnapshotRepository extends JpaRepository<CreditScoreSnapshot, Long> {

    List<CreditScoreSnapshot> findByCustomerIdOrderByFetchedAtDesc(Long customerId);
}
