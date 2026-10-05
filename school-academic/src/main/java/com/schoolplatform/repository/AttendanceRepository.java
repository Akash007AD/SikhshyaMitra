package com.schoolplatform.repository;

import com.schoolplatform.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    List<Attendance> findByTenantIdAndStandardIdAndSectionIdAndAttendanceDate(
            UUID tenantId, UUID standardId, UUID sectionId, LocalDate attendanceDate);

    Optional<Attendance> findByTenantIdAndStudentIdAndAttendanceDate(
            UUID tenantId, UUID studentId, LocalDate attendanceDate);

    List<Attendance> findByTenantIdAndStudentIdAndAttendanceDateBetween(
            UUID tenantId, UUID studentId, LocalDate startDate, LocalDate endDate);

    long countByTenantIdAndStudentIdAndStatusAndAttendanceDateBetween(
            UUID tenantId, UUID studentId, String status, LocalDate startDate, LocalDate endDate);

    long countByTenantIdAndStudentIdAndAttendanceDateBetween(
            UUID tenantId, UUID studentId, LocalDate startDate, LocalDate endDate);
}
