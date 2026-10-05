package com.schoolplatform.service;

import com.schoolplatform.entity.Attendance;
import com.schoolplatform.repository.AttendanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    public AttendanceService(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    public List<Attendance> getSectionAttendance(UUID tenantId, UUID standardId, UUID sectionId, LocalDate date) {
        return attendanceRepository.findByTenantIdAndStandardIdAndSectionIdAndAttendanceDate(tenantId, standardId, sectionId, date);
    }

    @Transactional
    public List<Attendance> recordBatchAttendance(UUID tenantId, UUID schoolId, UUID standardId, UUID sectionId,
                                                  LocalDate date, String markedBy, List<Map<String, String>> records) {
        List<Attendance> saved = new ArrayList<>();

        for (Map<String, String> rec : records) {
            UUID studentId = UUID.fromString(rec.get("studentId"));
            String status = rec.getOrDefault("status", "PRESENT").toUpperCase();
            String remarks = rec.get("remarks");

            Optional<Attendance> existing = attendanceRepository.findByTenantIdAndStudentIdAndAttendanceDate(tenantId, studentId, date);
            Attendance attendance;
            if (existing.isPresent()) {
                attendance = existing.get();
                attendance.setStatus(status);
                attendance.setRemarks(remarks);
                attendance.setMarkedBy(markedBy);
                attendance.setMarkedAt(LocalDateTime.now());
            } else {
                attendance = new Attendance();
                attendance.setTenantId(tenantId);
                attendance.setSchoolId(schoolId);
                attendance.setStandardId(standardId);
                attendance.setSectionId(sectionId);
                attendance.setStudentId(studentId);
                attendance.setAttendanceDate(date);
                attendance.setStatus(status);
                attendance.setRemarks(remarks);
                attendance.setMarkedBy(markedBy);
                attendance.setMarkedAt(LocalDateTime.now());
            }
            saved.add(attendance);
        }

        return attendanceRepository.saveAll(saved);
    }

    public Map<String, Object> getStudentMonthlySummary(UUID tenantId, UUID studentId, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        long totalDays = attendanceRepository.countByTenantIdAndStudentIdAndAttendanceDateBetween(tenantId, studentId, start, end);
        long presentDays = attendanceRepository.countByTenantIdAndStudentIdAndStatusAndAttendanceDateBetween(tenantId, studentId, "PRESENT", start, end);
        long absentDays = attendanceRepository.countByTenantIdAndStudentIdAndStatusAndAttendanceDateBetween(tenantId, studentId, "ABSENT", start, end);
        long lateDays = attendanceRepository.countByTenantIdAndStudentIdAndStatusAndAttendanceDateBetween(tenantId, studentId, "LATE", start, end);
        long excusedDays = attendanceRepository.countByTenantIdAndStudentIdAndStatusAndAttendanceDateBetween(tenantId, studentId, "EXCUSED", start, end);

        double percentage = totalDays > 0 ? ((double) (presentDays + lateDays) / totalDays) * 100.0 : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("studentId", studentId);
        summary.put("year", year);
        summary.put("month", month);
        summary.put("totalDaysMarked", totalDays);
        summary.put("presentDays", presentDays);
        summary.put("absentDays", absentDays);
        summary.put("lateDays", lateDays);
        summary.put("excusedDays", excusedDays);
        summary.put("attendancePercentage", Math.round(percentage * 10.0) / 10.0);

        return summary;
    }
}
