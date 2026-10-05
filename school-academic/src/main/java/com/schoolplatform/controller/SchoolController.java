package com.schoolplatform.controller;

import com.schoolplatform.entity.School;
import com.schoolplatform.repository.SchoolRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/academic/schools")
public class SchoolController {

    private final SchoolRepository schoolRepository;

    public SchoolController(SchoolRepository schoolRepository) {
        this.schoolRepository = schoolRepository;
    }

    // Notice how we extract the X-Tenant-ID header that the Gateway injected!
    @GetMapping
    public ResponseEntity<List<School>> getSchools(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(schoolRepository.findByTenantId(tenantId));
    }
}
