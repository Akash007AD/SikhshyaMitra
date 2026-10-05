package com.schoolplatform.repository;

import com.schoolplatform.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {

    List<Student> findByTenantIdAndSchoolId(UUID tenantId, UUID schoolId);

    List<Student> findByTenantIdAndStandardIdAndSectionId(UUID tenantId, UUID standardId, UUID sectionId);

    List<Student> findByTenantIdAndStandardId(UUID tenantId, UUID standardId);

    Optional<Student> findByTenantIdAndAdmissionNumber(UUID tenantId, String admissionNumber);

    boolean existsByTenantIdAndSchoolIdAndAdmissionNumber(UUID tenantId, UUID schoolId, String admissionNumber);

    boolean existsByTenantIdAndStandardIdAndSectionIdAndRollNumber(UUID tenantId, UUID standardId, UUID sectionId, Integer rollNumber);

    /** Finds siblings enrolled across classes using guardian phone number */
    List<Student> findByTenantIdAndGuardianPhone(UUID tenantId, String guardianPhone);

    @Query("SELECT s FROM Student s WHERE s.tenantId = :tenantId AND " +
           "(LOWER(s.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(s.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(s.admissionNumber) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Student> searchStudents(@Param("tenantId") UUID tenantId, @Param("query") String query);
}
