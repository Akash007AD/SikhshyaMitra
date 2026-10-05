package com.schoolplatform.repository;

import com.schoolplatform.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SchoolRepository extends JpaRepository<School, UUID> {
    
    // Always filter by tenantId!
    List<School> findByTenantId(UUID tenantId);
}
