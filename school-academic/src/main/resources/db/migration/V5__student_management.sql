-- V5: Student Management & Enrollment Schema
-- Database: sp_academic

CREATE TABLE student (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    school_id BINARY(16) NOT NULL,
    standard_id BINARY(16) NOT NULL,
    section_id BINARY(16) NOT NULL,
    admission_number VARCHAR(50) NOT NULL,
    roll_number INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_group VARCHAR(10),
    guardian_name VARCHAR(150) NOT NULL,
    guardian_relationship VARCHAR(50) NOT NULL DEFAULT 'PARENT',
    guardian_phone VARCHAR(20) NOT NULL,
    guardian_email VARCHAR(254),
    emergency_contact VARCHAR(20),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ALUMNI', 'TRANSFERRED', 'SUSPENDED')),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    CONSTRAINT uk_student_admission UNIQUE (tenant_id, school_id, admission_number),
    CONSTRAINT uk_student_roll UNIQUE (tenant_id, standard_id, section_id, roll_number),
    INDEX idx_student_section (tenant_id, standard_id, section_id),
    INDEX idx_student_guardian_phone (tenant_id, guardian_phone),
    INDEX idx_student_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
