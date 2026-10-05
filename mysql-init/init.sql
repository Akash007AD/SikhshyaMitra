-- Create databases for each microservice (Phase 1: Shared Server)
CREATE DATABASE IF NOT EXISTS sp_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sp_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sp_academic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sp_fee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sp_content CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sp_notify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create users for each microservice with least privilege
CREATE USER IF NOT EXISTS 'svc_auth'@'%' IDENTIFIED BY 'auth_pass';
GRANT ALL PRIVILEGES ON sp_auth.* TO 'svc_auth'@'%';

CREATE USER IF NOT EXISTS 'svc_platform'@'%' IDENTIFIED BY 'platform_pass';
GRANT ALL PRIVILEGES ON sp_platform.* TO 'svc_platform'@'%';

CREATE USER IF NOT EXISTS 'svc_academic'@'%' IDENTIFIED BY 'academic_pass';
GRANT ALL PRIVILEGES ON sp_academic.* TO 'svc_academic'@'%';

CREATE USER IF NOT EXISTS 'svc_fee'@'%' IDENTIFIED BY 'fee_pass';
GRANT ALL PRIVILEGES ON sp_fee.* TO 'svc_fee'@'%';

CREATE USER IF NOT EXISTS 'svc_content'@'%' IDENTIFIED BY 'content_pass';
GRANT ALL PRIVILEGES ON sp_content.* TO 'svc_content'@'%';

CREATE USER IF NOT EXISTS 'svc_notify'@'%' IDENTIFIED BY 'notify_pass';
GRANT ALL PRIVILEGES ON sp_notify.* TO 'svc_notify'@'%';

FLUSH PRIVILEGES;
