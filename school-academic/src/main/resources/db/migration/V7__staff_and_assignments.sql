-- V7: Staff, Teachers & Subject Assignments Schema
-- Database: sp_academic

CREATE TABLE staff (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    school_id BINARY(16) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    qualification VARCHAR(100),
    joining_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'RETIRED')),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    CONSTRAINT uk_staff_emp_id UNIQUE (tenant_id, school_id, employee_id),
    INDEX idx_staff_tenant (tenant_id, school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teacher_assignment (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    school_id BINARY(16) NOT NULL,
    staff_id BINARY(16) NOT NULL,
    standard_id BINARY(16) NOT NULL,
    section_id BINARY(16) NOT NULL,
    subject_id BINARY(16),
    is_class_teacher TINYINT(1) NOT NULL DEFAULT 0,
    academic_year_id BINARY(16),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    INDEX idx_ta_staff (tenant_id, staff_id),
    INDEX idx_ta_section (tenant_id, standard_id, section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
