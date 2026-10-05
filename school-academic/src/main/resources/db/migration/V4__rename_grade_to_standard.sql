-- 1. Rename table 'grade' to 'standard'
RENAME TABLE grade TO standard;

-- 2. Rename constraints safely
ALTER TABLE standard DROP INDEX uk_grade_name;
ALTER TABLE standard DROP INDEX uk_grade_sequence;

ALTER TABLE standard ADD CONSTRAINT uk_standard_name UNIQUE (tenant_id, school_id, name);
ALTER TABLE standard ADD CONSTRAINT uk_standard_sequence UNIQUE (tenant_id, school_id, sequence);

-- 3. Update 'section' table to reference 'standard_id' instead of 'grade_id'
ALTER TABLE section CHANGE grade_id standard_id BINARY(16) NOT NULL;
ALTER TABLE section DROP INDEX uk_section_name;
ALTER TABLE section DROP INDEX idx_section_grade;
ALTER TABLE section ADD CONSTRAINT uk_section_name UNIQUE (tenant_id, school_id, standard_id, name);
ALTER TABLE section ADD INDEX idx_section_standard (standard_id);

-- 4. Update 'subject' table to reference 'standard_id' instead of 'grade_id'
ALTER TABLE subject CHANGE grade_id standard_id BINARY(16) NOT NULL;
ALTER TABLE subject DROP INDEX uk_subject_grade;
ALTER TABLE subject ADD CONSTRAINT uk_subject_standard UNIQUE (tenant_id, school_id, standard_id, name);
