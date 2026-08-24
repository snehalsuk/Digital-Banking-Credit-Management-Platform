package com.bankapp.account.repository;

import com.bankapp.account.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByCustomerId(Long customerId);

    Optional<Account> findByAccountNumber(String accountNumber);

    Optional<Account> findByIdAndCustomerId(Long id, Long customerId);

    boolean existsByAccountNumber(String accountNumber);

    /**
     * Reads the account row under a pessimistic write lock, held for the
     * duration of the enclosing transaction. Used by transaction/loan
     * services before mutating a balance, to prevent lost updates under
     * concurrent access.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.id = :id")
    Optional<Account> findByIdForUpdate(@Param("id") Long id);
}
