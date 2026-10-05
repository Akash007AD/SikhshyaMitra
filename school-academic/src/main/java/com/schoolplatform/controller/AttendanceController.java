package com.schoolplatform.controller;

import com.schoolplatform.entity.Attendance;
import com.schoolplatform.service.AttendanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/academic/{schoolId}/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public ResponseEntity<List<Attendance>> getSectionAttendance(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @RequestParam UUID standardId,
            @RequestParam UUID sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getSectionAttendance(tenantId, standardId, sectionId, date));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<Attendance>> recordBatchAttendance(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-User-Name", defaultValue = "Admin") String markedBy,
            @PathVariable UUID schoolId,
            @RequestBody Map<String, Object> payload) {

        UUID standardId = UUID.fromString((String) payload.get("standardId"));
        UUID sectionId = UUID.fromString((String) payload.get("sectionId"));
        LocalDate date = LocalDate.parse((String) payload.get("date"));
        @SuppressWarnings("unchecked")
        List<Map<String, String>> records = (List<Map<String, String>>) payload.get("records");

        List<Attendance> result = attendanceService.recordBatchAttendance(tenantId, schoolId, standardId, sectionId, date, markedBy, records);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/student/{studentId}/summary")
    public ResponseEntity<Map<String, Object>> getStudentMonthlySummary(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID schoolId,
            @PathVariable UUID studentId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(attendanceService.getStudentMonthlySummary(tenantId, studentId, year, month));
    }
}
