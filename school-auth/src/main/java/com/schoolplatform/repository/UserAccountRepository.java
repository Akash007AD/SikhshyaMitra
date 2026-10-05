package com.schoolplatform.repository;

import com.schoolplatform.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    // Always require both Tenant ID and Username so users can only log into their own tenant!
    Optional<UserAccount> findByTenantIdAndUsername(UUID tenantId, String username);

    Optional<UserAccount> findByTenantIdAndEmail(UUID tenantId, String email);

    /** Global lookup by Google subject (unique across all tenants) */
    Optional<UserAccount> findByGoogleSub(String googleSub);

    /** All active names for a tenant — used for Levenshtein dedup */
    @Query("SELECT t.name FROM Tenant t WHERE t.verificationStatus NOT IN ('REJECTED', 'TERMINATED')")
    List<String> findAllActiveTenantNames();
}
