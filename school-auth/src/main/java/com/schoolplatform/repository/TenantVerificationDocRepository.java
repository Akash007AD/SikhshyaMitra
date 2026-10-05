package com.schoolplatform.repository;

import com.schoolplatform.entity.TenantVerificationDoc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TenantVerificationDocRepository extends JpaRepository<TenantVerificationDoc, UUID> {
    List<TenantVerificationDoc> findByTenantId(UUID tenantId);
    List<TenantVerificationDoc> findByTenantIdAndReviewStatus(UUID tenantId, String reviewStatus);
}
