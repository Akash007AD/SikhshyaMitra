package com.schoolplatform.controller;

import com.schoolplatform.entity.Student;
import com.schoolplatform.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/academic/{schoolId}/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<Student>> getStudents(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestParam(required = false) UUID standardId,
            @RequestParam(required = false) UUID sectionId,
            @RequestParam(required = false) String q) {

        if (q != null && !q.trim().isEmpty()) {
            return ResponseEntity.ok(studentService.searchStudents(tenantId, q.trim()));
        }
        if (standardId != null && sectionId != null) {
            return ResponseEntity.ok(studentService.getStudentsBySection(tenantId, standardId, sectionId));
        }
        if (standardId != null) {
            return ResponseEntity.ok(studentService.getStudentsByStandard(tenantId, standardId));
        }
        return ResponseEntity.ok(studentService.getStudentsBySchool(tenantId, schoolId));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<Student> getStudentById(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID studentId) {
        return ResponseEntity.ok(studentService.getStudentById(tenantId, studentId));
    }

    @PostMapping
    public ResponseEntity<Student> createStudent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestBody Student student) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentService.createStudent(tenantId, schoolId, student));
    }

    @PutMapping("/{studentId}")
    public ResponseEntity<Student> updateStudent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID studentId,
            @RequestBody Student student) {
        return ResponseEntity.ok(studentService.updateStudent(tenantId, studentId, student));
    }

    @DeleteMapping("/{studentId}")
    public ResponseEntity<Void> deleteStudent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID studentId) {
        studentService.deleteStudent(tenantId, studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/siblings")
    public ResponseEntity<List<Student>> getSiblings(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestParam String phone) {
        return ResponseEntity.ok(studentService.getSiblings(tenantId, phone));
    }

    @PostMapping("/import-csv")
    public ResponseEntity<Map<String, Object>> importStudentsCsv(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestParam UUID standardId,
            @RequestParam UUID sectionId,
            @RequestBody String csvContent) {
        Map<String, Object> result = studentService.importStudentsCsv(tenantId, schoolId, standardId, sectionId, csvContent);
        return ResponseEntity.ok(result);
    }
}
