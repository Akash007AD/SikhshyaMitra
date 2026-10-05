-- 1. Wipe the messy duplicate grades to start fresh
DELETE FROM grade;

-- 2. Enforce strict uniqueness so duplicates are physically impossible!
-- A school cannot have two classes with the same name (e.g., two "Class 1"s)
ALTER TABLE grade ADD CONSTRAINT uk_grade_name UNIQUE (tenant_id, school_id, name);
-- A school cannot have two classes with the same sequence
ALTER TABLE grade ADD CONSTRAINT uk_grade_sequence UNIQUE (tenant_id, school_id, sequence);

-- 3. Create the Section table ("each class has different sections and students inside it")
CREATE TABLE section (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    school_id BINARY(16) NOT NULL,
    grade_id BINARY(16) NOT NULL,
    name VARCHAR(50) NOT NULL, -- e.g., "Section A"
    capacity INT NOT NULL DEFAULT 40,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    -- A class cannot have two sections with the same name!
    UNIQUE KEY uk_section_name (tenant_id, school_id, grade_id, name),
    INDEX idx_section_grade (grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Update the Subject table ("each class should have different subjects in it")
-- Clear any existing subjects first since we are adding a strict NOT NULL constraint
DELETE FROM subject;

ALTER TABLE subject ADD COLUMN grade_id BINARY(16) NOT NULL;
-- Subjects are unique per grade (e.g., Class 1 Math is different from Class 2 Math)
ALTER TABLE subject ADD CONSTRAINT uk_subject_grade UNIQUE (tenant_id, school_id, grade_id, name);
