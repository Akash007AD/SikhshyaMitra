package com.schoolplatform.controller;

import com.schoolplatform.entity.Standard;
import com.schoolplatform.entity.Subject;
import com.schoolplatform.entity.AcademicYear;
import com.schoolplatform.service.AcademicEntityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/academic/{schoolId}")
public class AcademicEntityController {

    private final AcademicEntityService academicService;

    public AcademicEntityController(AcademicEntityService academicService) {
        this.academicService = academicService;
    }

    // --- STANDARDS ---
    @GetMapping("/standards")
    public ResponseEntity<List<Standard>> getStandards(
            @RequestHeader("X-Tenant-ID") UUID tenantId, 
            @PathVariable UUID schoolId) {
        return ResponseEntity.ok(academicService.getStandards(tenantId, schoolId));
    }

    @PostMapping("/standards")
    public ResponseEntity<Standard> createStandard(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestBody Standard standard) {
        return ResponseEntity.ok(academicService.createStandard(tenantId, schoolId, standard));
    }

    @DeleteMapping("/standards/{standardId}")
    public ResponseEntity<Void> deleteStandard(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID standardId) {
        
        academicService.deleteStandard(tenantId, schoolId, standardId);
        return ResponseEntity.noContent().build();
    }

    // --- SUBJECTS ---
    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> getSubjects(
            @RequestHeader("X-Tenant-ID") UUID tenantId, 
            @PathVariable UUID schoolId) {
        return ResponseEntity.ok(academicService.getSubjects(tenantId, schoolId));
    }

    @PostMapping("/subjects")
    public ResponseEntity<Subject> createSubject(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestBody Subject subject) {
        return ResponseEntity.ok(academicService.createSubject(tenantId, schoolId, subject));
    }

    // --- ACADEMIC YEARS ---
    @GetMapping("/years")
    public ResponseEntity<List<AcademicYear>> getYears(
            @RequestHeader("X-Tenant-ID") UUID tenantId, 
            @PathVariable UUID schoolId) {
        return ResponseEntity.ok(academicService.getYears(tenantId, schoolId));
    }

    @PostMapping("/years")
    public ResponseEntity<AcademicYear> createYear(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestBody AcademicYear year) {
        return ResponseEntity.ok(academicService.createYear(tenantId, schoolId, year));
    }
}
