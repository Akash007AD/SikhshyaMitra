-- V6: Attendance Management Schema
-- Database: sp_academic

CREATE TABLE student_attendance (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    school_id BINARY(16) NOT NULL,
    standard_id BINARY(16) NOT NULL,
    section_id BINARY(16) NOT NULL,
    student_id BINARY(16) NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY')),
    remarks VARCHAR(255),
    marked_by VARCHAR(100),
    marked_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    CONSTRAINT uk_student_attendance_date UNIQUE (tenant_id, student_id, attendance_date),
    INDEX idx_attendance_section_date (tenant_id, standard_id, section_id, attendance_date),
    INDEX idx_attendance_student_month (tenant_id, student_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
