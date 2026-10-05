-- V8: Examinations, Subject Schedules, and Marks Entry Schema
-- Database: sp_academic

CREATE TABLE exam (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    school_id BINARY(16) NOT NULL,
    academic_year_id BINARY(16) NOT NULL,
    name VARCHAR(100) NOT NULL,
    term VARCHAR(20) NOT NULL CHECK (term IN ('TERM_1', 'TERM_2', 'ANNUAL', 'UNIT_TEST')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ONGOING', 'MARKS_ENTRY', 'PUBLISHED', 'ARCHIVED')),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    INDEX idx_exam_tenant (tenant_id, academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_subject (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    exam_id BINARY(16) NOT NULL,
    standard_id BINARY(16) NOT NULL,
    subject_id BINARY(16) NOT NULL,
    max_marks INT NOT NULL DEFAULT 100,
    passing_marks INT NOT NULL DEFAULT 35,
    exam_date DATE,
    lock_status VARCHAR(20) NOT NULL DEFAULT 'UNLOCKED' CHECK (lock_status IN ('UNLOCKED', 'LOCKED')),
    locked_at DATETIME(3),
    locked_by VARCHAR(100),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    INDEX idx_es_exam (tenant_id, exam_id, standard_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_mark (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    exam_id BINARY(16) NOT NULL,
    exam_subject_id BINARY(16) NOT NULL,
    student_id BINARY(16) NOT NULL,
    marks_obtained DOUBLE NOT NULL DEFAULT 0.0,
    is_absent TINYINT(1) NOT NULL DEFAULT 0,
    grade VARCHAR(5),
    remarks VARCHAR(255),
    entered_by VARCHAR(100),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    CONSTRAINT uk_student_exam_sub UNIQUE (tenant_id, exam_subject_id, student_id),
    INDEX idx_sm_student (tenant_id, student_id, exam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
