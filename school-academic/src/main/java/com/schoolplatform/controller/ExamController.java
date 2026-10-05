package com.schoolplatform.controller;

import com.schoolplatform.entity.Exam;
import com.schoolplatform.entity.ExamSubject;
import com.schoolplatform.entity.StudentMark;
import com.schoolplatform.service.ExamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/academic/{schoolId}/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @GetMapping
    public ResponseEntity<List<Exam>> getExams(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId) {
        return ResponseEntity.ok(examService.getExamsBySchool(tenantId, schoolId));
    }

    @PostMapping
    public ResponseEntity<Exam> createExam(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestBody Exam exam) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examService.createExam(tenantId, schoolId, exam));
    }

    @GetMapping("/{examId}/subjects")
    public ResponseEntity<List<ExamSubject>> getExamSubjects(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID examId,
            @RequestParam(required = false) UUID standardId) {
        return ResponseEntity.ok(examService.getExamSubjects(tenantId, examId, standardId));
    }

    @PostMapping("/{examId}/subjects")
    public ResponseEntity<ExamSubject> addExamSubject(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID examId,
            @RequestBody Map<String, String> body) {
        UUID standardId = UUID.fromString(body.get("standardId"));
        UUID subjectId = UUID.fromString(body.get("subjectId"));
        int maxMarks = Integer.parseInt(body.getOrDefault("maxMarks", "100"));
        int passMarks = Integer.parseInt(body.getOrDefault("passingMarks", "35"));
        LocalDate examDate = body.get("examDate") != null ? LocalDate.parse(body.get("examDate")) : null;

        return ResponseEntity.ok(examService.addExamSubject(tenantId, examId, standardId, subjectId, maxMarks, passMarks, examDate));
    }

    @PostMapping("/{examId}/subjects/{examSubjectId}/marks")
    public ResponseEntity<List<StudentMark>> saveMarks(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-User-Name", defaultValue = "Teacher") String teacherName,
            @PathVariable UUID schoolId,
            @PathVariable UUID examId,
            @PathVariable UUID examSubjectId,
            @RequestBody List<Map<String, Object>> marksList) {
        return ResponseEntity.ok(examService.saveMarksBatch(tenantId, examId, examSubjectId, teacherName, marksList));
    }

    @PostMapping("/{examId}/subjects/{examSubjectId}/lock")
    public ResponseEntity<ExamSubject> lockMarks(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-User-Name", defaultValue = "Admin") String lockedBy,
            @PathVariable UUID schoolId,
            @PathVariable UUID examId,
            @PathVariable UUID examSubjectId) {
        return ResponseEntity.ok(examService.lockMarks(tenantId, examSubjectId, lockedBy));
    }

    @GetMapping("/{examId}/report-card/{studentId}")
    public ResponseEntity<Map<String, Object>> getReportCard(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID examId,
            @PathVariable UUID studentId) {
        return ResponseEntity.ok(examService.getStudentReportCard(tenantId, examId, studentId));
    }
}
