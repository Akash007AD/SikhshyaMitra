-- V3: Security Hardening, OAuth, and School Verification Pipeline
-- Database: sp_auth

-- -----------------------------------------------------------------------
-- 1. Harden the tenant table: verification workflow + UDISE + board
-- -----------------------------------------------------------------------
ALTER TABLE tenant
    ADD COLUMN verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION'
        CHECK (verification_status IN (
            'PENDING_VERIFICATION', 'DOCS_SUBMITTED', 'DOCS_UNDER_REVIEW',
            'TRIAL', 'VERIFIED', 'REJECTED'
        )) AFTER status,
    ADD COLUMN udise_code VARCHAR(11) UNIQUE AFTER verification_status,
    ADD COLUMN board VARCHAR(20) AFTER udise_code,
    ADD COLUMN rejection_reason VARCHAR(500) AFTER board,
    ADD COLUMN verified_at DATETIME(3) AFTER rejection_reason,
    ADD COLUMN verified_by VARCHAR(100) AFTER verified_at;

-- Update existing tenants to VERIFIED (they predate the check)
UPDATE tenant SET verification_status = 'VERIFIED' WHERE slug = 'platform';

-- -----------------------------------------------------------------------
-- 2. Harden user_account: OAuth support + failed-login lockout
-- -----------------------------------------------------------------------
ALTER TABLE user_account
    ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL'
        CHECK (auth_provider IN ('LOCAL', 'GOOGLE')) AFTER user_type,
    ADD COLUMN google_sub VARCHAR(100) AFTER auth_provider,
    ADD COLUMN avatar_url VARCHAR(500) AFTER google_sub,
    ADD COLUMN failed_login_count INT NOT NULL DEFAULT 0 AFTER last_login_at,
    ADD COLUMN locked_until DATETIME(3) AFTER failed_login_count,
    ADD COLUMN password_hash VARCHAR(255) AFTER locked_until;

-- google_sub must be globally unique (across tenants — one Google account = one sub)
ALTER TABLE user_account ADD UNIQUE KEY uk_google_sub (google_sub);

-- -----------------------------------------------------------------------
-- 3. School verification documents
-- -----------------------------------------------------------------------
CREATE TABLE tenant_verification_doc (
    id              BINARY(16)   NOT NULL PRIMARY KEY,
    tenant_id       BINARY(16)   NOT NULL,
    doc_type        VARCHAR(50)  NOT NULL
        CHECK (doc_type IN (
            'RECOGNITION_CERTIFICATE', 'UDISE_PRINTOUT',
            'PRINCIPAL_ID', 'AFFILIATION_CERTIFICATE', 'OTHER'
        )),
    original_name   VARCHAR(255) NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT       NOT NULL,
    uploaded_at     DATETIME(3)  NOT NULL,
    reviewed_by     VARCHAR(100),
    reviewed_at     DATETIME(3),
    review_status   VARCHAR(20)
        CHECK (review_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_note  VARCHAR(500),
    INDEX idx_vdoc_tenant (tenant_id, review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 4. Refresh token rotation (stateful, server-side)
-- -----------------------------------------------------------------------
CREATE TABLE refresh_token (
    id              BINARY(16)   NOT NULL PRIMARY KEY,
    tenant_id       BINARY(16)   NOT NULL,
    user_id         BINARY(16)   NOT NULL,
    -- Store SHA-256 hash of the raw token, never the raw value
    token_hash      VARCHAR(64)  NOT NULL UNIQUE,
    family_id       BINARY(16)   NOT NULL,   -- detect token reuse within a family
    issued_at       DATETIME(3)  NOT NULL,
    expires_at      DATETIME(3)  NOT NULL,
    revoked_at      DATETIME(3),
    replaced_by     BINARY(16),              -- points to successor token
    user_agent      VARCHAR(300),
    ip_address      VARCHAR(45),
    INDEX idx_rt_user (tenant_id, user_id, expires_at),
    INDEX idx_rt_family (family_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 5. Login audit (immutable append-only)
-- -----------------------------------------------------------------------
CREATE TABLE login_audit (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BINARY(16)   NOT NULL,
    user_id         BINARY(16),
    username_tried  VARCHAR(80),
    auth_method     VARCHAR(20)  NOT NULL
        CHECK (auth_method IN ('PASSWORD', 'GOOGLE_OAUTH', 'EMAIL_OTP')),
    outcome         VARCHAR(10)  NOT NULL
        CHECK (outcome IN ('SUCCESS', 'FAIL', 'LOCKED', 'BLOCKED')),
    failure_reason  VARCHAR(100),
    ip_address      VARCHAR(45)  NOT NULL,
    user_agent      VARCHAR(300),
    attempted_at    DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
    INDEX idx_audit_tenant_time (tenant_id, attempted_at),
    INDEX idx_audit_user (tenant_id, user_id, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
