package com.bankapp.customer.repository;

import com.bankapp.customer.entity.CustomerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {

    Optional<CustomerProfile> findByPanHash(String panHash);

    Optional<CustomerProfile> findByUserId(Long userId);
}
