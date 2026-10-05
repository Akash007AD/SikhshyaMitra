package com.schoolplatform.repository;

import com.schoolplatform.entity.StudentMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentMarkRepository extends JpaRepository<StudentMark, UUID> {

    List<StudentMark> findByTenantIdAndExamSubjectId(UUID tenantId, UUID examSubjectId);

    List<StudentMark> findByTenantIdAndExamIdAndStudentId(UUID tenantId, UUID examId, UUID studentId);

    Optional<StudentMark> findByTenantIdAndExamSubjectIdAndStudentId(
            UUID tenantId, UUID examSubjectId, UUID studentId);
}
