-- V1: Initial Auth & Tenant Schema
-- Database: sp_auth
-- As defined in database-auth-tenant.md

-- 1. Tenants
CREATE TABLE tenant (
    id BINARY(16) NOT NULL PRIMARY KEY,
    slug VARCHAR(63) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PROVISIONING', 'ACTIVE', 'GRACE', 'SUSPENDED', 'TERMINATED')),
    plan_id BINARY(16) NOT NULL,
    config_version INT NOT NULL DEFAULT 1,
    datasource_ref VARCHAR(100),
    region VARCHAR(30) NOT NULL,
    timezone VARCHAR(40) NOT NULL DEFAULT 'Asia/Kolkata',
    status_changed_at DATETIME(3) NOT NULL,
    grace_ends_at DATETIME(3),
    suspended_at DATETIME(3),
    retain_until DATETIME(3),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    version INT NOT NULL DEFAULT 0,
    INDEX idx_tenant_status (status, grace_ends_at),
    INDEX idx_tenant_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tenant Domains
CREATE TABLE tenant_domain (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    host VARCHAR(253) NOT NULL UNIQUE,
    domain_type VARCHAR(10) NOT NULL CHECK (domain_type IN ('SUBDOMAIN', 'CUSTOM')),
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    verification_status VARCHAR(10) NOT NULL CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED')),
    verification_token VARCHAR(100),
    verified_at DATETIME(3),
    tls_status VARCHAR(12) NOT NULL CHECK (tls_status IN ('NONE', 'ISSUING', 'ACTIVE', 'EXPIRING', 'FAILED')),
    tls_expires_at DATETIME(3),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    INDEX idx_tenant_domain_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Plans
CREATE TABLE plan (
    id BINARY(16) NOT NULL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    tier VARCHAR(10) NOT NULL CHECK (tier IN ('BASIC', 'STANDARD', 'PREMIUM')),
    is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. User Accounts
CREATE TABLE user_account (
    id BINARY(16) NOT NULL PRIMARY KEY,
    tenant_id BINARY(16) NOT NULL,
    user_type VARCHAR(15) NOT NULL CHECK (user_type IN ('PLATFORM_STAFF', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'APPLICANT')),
    status VARCHAR(10) NOT NULL CHECK (status IN ('INVITED', 'ACTIVE', 'LOCKED', 'DISABLED')),
    display_name VARCHAR(150) NOT NULL,
    email VARCHAR(254),
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    phone VARCHAR(20),
    phone_verified TINYINT(1) NOT NULL DEFAULT 0,
    username VARCHAR(80),
    person_ref BINARY(16),
    registered_contact_id BINARY(16),
    mfa_required TINYINT(1) NOT NULL DEFAULT 0,
    last_login_at DATETIME(3),
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL,
    deleted_at DATETIME(3),
    version INT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_user_email (tenant_id, email),
    UNIQUE KEY uk_user_phone (tenant_id, phone),
    UNIQUE KEY uk_user_username (tenant_id, username),
    INDEX idx_user_type_status (tenant_id, user_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Platform Default Tenant
INSERT INTO tenant (id, slug, name, status, plan_id, config_version, region, timezone, status_changed_at, created_at, updated_at, version) 
VALUES (UNHEX('00000000000000000000000000000000'), 'platform', 'Platform Admin', 'ACTIVE', UNHEX('00000000000000000000000000000000'), 1, 'ap-south', 'Asia/Kolkata', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), 1);
