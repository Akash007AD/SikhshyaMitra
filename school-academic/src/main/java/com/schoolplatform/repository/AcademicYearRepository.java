package com.schoolplatform.repository;

import com.schoolplatform.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, UUID> {
    List<AcademicYear> findByTenantIdAndSchoolId(UUID tenantId, UUID schoolId);
}
