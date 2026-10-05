ALTER TABLE user_account ADD COLUMN password_hash VARCHAR(255);

-- Insert a default admin user for the platform admin tenant so we can actually log in!
-- The password_hash is the BCrypt hash for the word "password"
INSERT INTO user_account (id, tenant_id, user_type, status, display_name, username, password_hash, created_at, updated_at) 
VALUES (
    UNHEX(REPLACE('33333333-3333-3333-3333-333333333333', '-', '')), 
    UNHEX('00000000000000000000000000000000'), 
    'SCHOOL_ADMIN', 
    'ACTIVE', 
    'System Administrator', 
    'admin', 
    '$2a$10$AiMHFuWsNVZexKAI0hG.7OPxTIHvmVBsme3ctE9jNoiAPR4j1BTmO', 
    UTC_TIMESTAMP(3), 
    UTC_TIMESTAMP(3)
);
