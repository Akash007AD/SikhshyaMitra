package com.schoolplatform.repository;

import com.schoolplatform.entity.LoginAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.UUID;

public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {

    /** Count recent failed attempts for lockout logic */
    @Query("SELECT COUNT(a) FROM LoginAudit a WHERE a.tenantId = :tenantId AND a.usernameTried = :username " +
           "AND a.outcome = 'FAIL' AND a.attemptedAt > :since")
    long countRecentFailures(UUID tenantId, String username, LocalDateTime since);
}
