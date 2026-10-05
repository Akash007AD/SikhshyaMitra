package com.schoolplatform.repository;

import com.schoolplatform.entity.ExamSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamSubjectRepository extends JpaRepository<ExamSubject, UUID> {

    List<ExamSubject> findByTenantIdAndExamIdAndStandardId(UUID tenantId, UUID examId, UUID standardId);

    List<ExamSubject> findByTenantIdAndExamId(UUID tenantId, UUID examId);

    Optional<ExamSubject> findByTenantIdAndExamIdAndStandardIdAndSubjectId(
            UUID tenantId, UUID examId, UUID standardId, UUID subjectId);
}
