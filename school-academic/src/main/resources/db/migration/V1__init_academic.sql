CREATE TABLE school (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    INDEX idx_school_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a default school for the platform admin tenant so we have data to test!
INSERT INTO school (id, tenant_id, name, code, created_at, updated_at) 
VALUES (UNHEX(REPLACE('22222222-2222-2222-2222-222222222222', '-', '')), UNHEX('00000000000000000000000000000000'), 'Springfield Elementary', 'SF-01', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3));
