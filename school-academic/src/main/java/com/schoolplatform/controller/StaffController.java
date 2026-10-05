package com.schoolplatform.controller;

import com.schoolplatform.entity.Staff;
import com.schoolplatform.entity.TeacherAssignment;
import com.schoolplatform.service.StaffService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/academic/{schoolId}/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public ResponseEntity<List<Staff>> getStaff(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId) {
        return ResponseEntity.ok(staffService.getStaffBySchool(tenantId, schoolId));
    }

    @GetMapping("/{staffId}")
    public ResponseEntity<Staff> getStaffById(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID staffId) {
        return ResponseEntity.ok(staffService.getStaffById(tenantId, staffId));
    }

    @PostMapping
    public ResponseEntity<Staff> createStaff(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestBody Staff staff) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffService.createStaff(tenantId, schoolId, staff));
    }

    @PostMapping("/assign-class-teacher")
    public ResponseEntity<TeacherAssignment> assignClassTeacher(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestBody Map<String, String> body) {
        UUID standardId = UUID.fromString(body.get("standardId"));
        UUID sectionId = UUID.fromString(body.get("sectionId"));
        UUID staffId = UUID.fromString(body.get("staffId"));
        UUID academicYearId = body.get("academicYearId") != null ? UUID.fromString(body.get("academicYearId")) : null;

        return ResponseEntity.ok(staffService.assignClassTeacher(tenantId, schoolId, standardId, sectionId, staffId, academicYearId));
    }

    @PostMapping("/assign-subject-teacher")
    public ResponseEntity<TeacherAssignment> assignSubjectTeacher(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestBody Map<String, String> body) {
        UUID standardId = UUID.fromString(body.get("standardId"));
        UUID sectionId = UUID.fromString(body.get("sectionId"));
        UUID subjectId = UUID.fromString(body.get("subjectId"));
        UUID staffId = UUID.fromString(body.get("staffId"));
        UUID academicYearId = body.get("academicYearId") != null ? UUID.fromString(body.get("academicYearId")) : null;

        return ResponseEntity.ok(staffService.assignSubjectTeacher(tenantId, schoolId, standardId, sectionId, subjectId, staffId, academicYearId));
    }

    @GetMapping("/section-assignments")
    public ResponseEntity<List<TeacherAssignment>> getSectionAssignments(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestParam UUID standardId,
            @RequestParam UUID sectionId) {
        return ResponseEntity.ok(staffService.getSectionAssignments(tenantId, standardId, sectionId));
    }

    @GetMapping("/{staffId}/assignments")
    public ResponseEntity<List<TeacherAssignment>> getTeacherAssignments(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID staffId) {
        return ResponseEntity.ok(staffService.getTeacherAssignments(tenantId, staffId));
    }
}
