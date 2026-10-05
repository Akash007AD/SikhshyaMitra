package com.schoolplatform.repository;

import com.schoolplatform.entity.Standard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StandardRepository extends JpaRepository<Standard, UUID> {
    List<Standard> findByTenantIdAndSchoolIdOrderBySequenceAsc(UUID tenantId, UUID schoolId);
    boolean existsByTenantIdAndSchoolIdAndName(UUID tenantId, UUID schoolId, String name);
}
