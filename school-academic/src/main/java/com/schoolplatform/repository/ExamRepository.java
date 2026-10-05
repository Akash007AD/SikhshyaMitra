package com.schoolplatform.repository;

import com.schoolplatform.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findByTenantIdAndSchoolId(UUID tenantId, UUID schoolId);

    List<Exam> findByTenantIdAndAcademicYearId(UUID tenantId, UUID academicYearId);
}
