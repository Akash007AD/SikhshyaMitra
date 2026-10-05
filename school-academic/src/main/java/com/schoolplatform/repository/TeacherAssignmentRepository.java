package com.schoolplatform.repository;

import com.schoolplatform.entity.TeacherAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherAssignmentRepository extends JpaRepository<TeacherAssignment, UUID> {

    List<TeacherAssignment> findByTenantIdAndStaffId(UUID tenantId, UUID staffId);

    List<TeacherAssignment> findByTenantIdAndStandardIdAndSectionId(UUID tenantId, UUID standardId, UUID sectionId);

    Optional<TeacherAssignment> findByTenantIdAndStandardIdAndSectionIdAndIsClassTeacherTrue(
            UUID tenantId, UUID standardId, UUID sectionId);

    void deleteByTenantIdAndStandardIdAndSectionIdAndSubjectId(
            UUID tenantId, UUID standardId, UUID sectionId, UUID subjectId);
}
