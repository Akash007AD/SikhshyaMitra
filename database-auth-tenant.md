# Database Design: Auth & Tenant (`sp_auth`)

**Companion to:** `prd.md` (v0.8) and `architecture.md`
**Status:** Draft v0.4
**Changes in v0.2:** only student accounts (no separate parent accounts); one registered phone number per student; added the phone change request table; decisions on parents and student login resolved.
**Changes in v0.3:** siblings can share one registered number through the new `registered_phone` table (`user_account.registered_phone_id`); `phone_change_request` now covers two methods (OTP on the old number, and in-person recovery with two-person approval for a lost SIM) and applies to a registered number rather than a single account; added freeze, re-verification, new permissions, and the `RegisteredPhoneChanged` event; sibling and unreachable-number questions moved to settled.
**Changes in v0.4:** no SMS provider yet, so the family login contact is an email address at first. `registered_phone` became `registered_contact` (with a `channel` of `EMAIL` or `PHONE`), `phone_change_request` became `contact_change_request`, and the related permissions, purposes, event, and audit action were renamed. A per-school `login_channels` flag controls which channel is used, so SMS OTP can be enabled later.
**Engine:** MySQL 8.4 LTS, InnoDB, `utf8mb4`, all times in UTC

This database holds tenants, domains, plans and entitlements, per-school configuration, user accounts, credentials, roles, sessions, support access, and audit. Every other service depends on it.

---

## 1. Conventions used in this file

| Item | Rule |
|---|---|
| IDs | `BINARY(16)` time-ordered UUID unless stated |
| `tenant_id` | `BINARY(16) NOT NULL`, first column of every primary key, unique key, and index on tenant-scoped tables |
| Timestamps | `DATETIME(3)` in UTC; `created_at` and `updated_at` on most tables |
| Optimistic locking | `version INT NOT NULL DEFAULT 0` on tables edited by people or concurrent jobs |
| Status columns | `VARCHAR(20)` with a `CHECK` constraint listing allowed values (easier to change than `ENUM`) |
| Booleans | `TINYINT(1)` |
| Soft delete | `deleted_at DATETIME(3) NULL` where noted |
| Foreign keys | Allowed inside this database on normal tables; **not** used on partitioned tables (MySQL does not support them) or on high-write log tables |
| Sensitive values | Passwords, tokens, and OTPs are stored only as hashes; MFA secrets are stored encrypted; private signing keys live in a vault, never here |
| Personal data in logs | `audit_event` and `login_attempt` hold IDs, event types, and masked values only |

**Notation:** `PK` primary key, `UK` unique key, `IX` index, `FK` foreign key.

## 2. The reserved platform tenant

MySQL treats `NULL` values as different in unique keys, so a nullable `tenant_id` would not enforce uniqueness for platform staff. Instead:

- One reserved row in `tenant` with a fixed all-zero ID and slug `platform` represents the platform itself.
- Platform staff accounts and platform roles belong to that tenant.
- `tenant_id` is therefore `NOT NULL` everywhere.
- The gateway never routes public traffic to it and it can never be suspended or terminated.

## 3. Tenant tables

### 3.1 `tenant`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| slug | VARCHAR(63) | NO | Subdomain label, lowercase letters, digits, hyphens |
| name | VARCHAR(200) | NO | School name |
| status | VARCHAR(20) | NO | `PROVISIONING`, `ACTIVE`, `GRACE`, `SUSPENDED`, `TERMINATED` |
| plan_id | BINARY(16) | NO | FK to `plan` |
| config_version | INT | NO | Points to the current row in `tenant_config` |
| datasource_ref | VARCHAR(100) | YES | `NULL` means the shared database; otherwise names a dedicated datasource |
| region | VARCHAR(30) | NO | Hosting region, for example `ap-south` |
| timezone | VARCHAR(40) | NO | Default `Asia/Kolkata` |
| status_changed_at | DATETIME(3) | NO | |
| grace_ends_at | DATETIME(3) | YES | Set when status is `GRACE` |
| suspended_at | DATETIME(3) | YES | |
| retain_until | DATETIME(3) | YES | End of the data export and retention window after suspension or termination |
| created_at, updated_at | DATETIME(3) | NO | |
| version | INT | NO | |

Keys: PK (id); UK (slug); IX (status, grace_ends_at); IX (plan_id).

Notes:
- `DRAFT` and `PENDING_PAYMENT` states live in the platform database (wizard draft). A `tenant` row is created only when provisioning starts, which matches the rule that nothing real exists before verified payment.
- Allowed transitions: `PROVISIONING` to `ACTIVE`; `ACTIVE` to `GRACE`; `GRACE` to `ACTIVE` or `SUSPENDED`; `SUSPENDED` to `ACTIVE` or `TERMINATED`. Every transition writes an `audit_event` and publishes `TenantStatusChanged`.

### 3.2 `tenant_contact`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | |
| contact_type | VARCHAR(20) | NO | `ADMIN`, `BILLING`, `PRINCIPAL`, `TECHNICAL` |
| name | VARCHAR(150) | NO | |
| email | VARCHAR(254) | YES | |
| phone | VARCHAR(20) | YES | E.164 format |
| is_primary | TINYINT(1) | NO | |
| created_at, updated_at | DATETIME(3) | NO | |

Keys: PK (id); IX (tenant_id, contact_type).
Used for renewal reminders, incident notices, and the "send to several contacts" rule.

### 3.3 `tenant_domain`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | |
| host | VARCHAR(253) | NO | Full host name, lowercase |
| domain_type | VARCHAR(10) | NO | `SUBDOMAIN` or `CUSTOM` |
| is_primary | TINYINT(1) | NO | |
| verification_status | VARCHAR(10) | NO | `PENDING`, `VERIFIED`, `FAILED` |
| verification_token | VARCHAR(100) | YES | Value the school places in DNS |
| verified_at | DATETIME(3) | YES | |
| tls_status | VARCHAR(12) | NO | `NONE`, `ISSUING`, `ACTIVE`, `EXPIRING`, `FAILED` |
| tls_expires_at | DATETIME(3) | YES | Feeds certificate monitoring |
| created_at, updated_at | DATETIME(3) | NO | |

Keys: PK (id); **UK (host)** (global, not per tenant, because one host maps to exactly one school); IX (tenant_id).
The gateway resolves host to tenant using this table, cached in Redis.

## 4. Plans and entitlements

### 4.1 `plan`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| code | VARCHAR(30) | NO | `STARTER`, `SCHOOL`, `PREMIUM` |
| name | VARCHAR(100) | NO | |
| tier | VARCHAR(10) | NO | `BASIC`, `STANDARD`, `PREMIUM` |
| is_active | TINYINT(1) | NO | |

Keys: PK (id); UK (code).
Prices, billing cycles, and invoices live in the platform database. This table holds only what the runtime needs to know.

### 4.2 `plan_entitlement`

| Column | Type | Null | Notes |
|---|---|---|---|
| plan_id | BINARY(16) | NO | |
| ent_key | VARCHAR(60) | NO | For example `max_students`, `sms_monthly_quota`, `storage_gb`, `module.fees`, `module.admission`, `custom_domain` |
| ent_value | VARCHAR(100) | NO | Number, `true`, or `false` stored as text |

Keys: PK (plan_id, ent_key); FK (plan_id) to `plan`.

### 4.3 `tenant_entitlement_override`

| Column | Type | Null | Notes |
|---|---|---|---|
| tenant_id | BINARY(16) | NO | |
| ent_key | VARCHAR(60) | NO | |
| ent_value | VARCHAR(100) | NO | |
| reason | VARCHAR(300) | NO | For example "manual trial", "negotiated student limit" |
| granted_by | BINARY(16) | NO | Platform staff user |
| expires_at | DATETIME(3) | YES | |
| created_at | DATETIME(3) | NO | |

Keys: PK (tenant_id, ent_key).
Effective entitlement = override if present and not expired, otherwise the plan value. This supports manual trials and custom deals without inventing new plans.

## 5. Configuration

### 5.1 `tenant_config` (immutable versions)

| Column | Type | Null | Notes |
|---|---|---|---|
| tenant_id | BINARY(16) | NO | |
| version | INT | NO | Starts at 1 |
| branding | JSON | NO | Logo key, colors, fonts, template ID, homepage layout |
| modules | JSON | NO | Enabled modules (checked against entitlements) |
| grading | JSON | NO | Board, grading scheme, rounding rules |
| visibility | JSON | NO | For example whether class rank is shown on the student account |
| feature_flags | JSON | NO | Per-school toggles, including `login_channels` (`["EMAIL"]` at first; `PHONE` is added when SMS is enabled) and `max_students_per_contact` |
| change_note | VARCHAR(300) | YES | |
| created_by | BINARY(16) | NO | |
| created_at | DATETIME(3) | NO | |

Keys: PK (tenant_id, version); FK (tenant_id) to `tenant`.
Rows are never edited. A change inserts a new version and updates `tenant.config_version`, then publishes `TenantConfigChanged`. This keeps history and means changing a grading scheme never rewrites past results. JSON is read as a whole and cached, not queried field by field.

## 6. Identity tables

### 6.1 `user_account`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | Reserved platform tenant for staff |
| user_type | VARCHAR(15) | NO | `PLATFORM_STAFF`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `APPLICANT`. `STUDENT` is the family login: one account per student, used by the student and parents |
| status | VARCHAR(10) | NO | `INVITED`, `ACTIVE`, `LOCKED`, `DISABLED` |
| display_name | VARCHAR(150) | NO | |
| email | VARCHAR(254) | YES | Stored lowercase. Staff and applicants; `NULL` for `STUDENT` accounts, whose login contact is in `registered_contact` |
| email_verified | TINYINT(1) | NO | |
| phone | VARCHAR(20) | YES | E.164. Staff and applicants only; `NULL` for `STUDENT` accounts |
| phone_verified | TINYINT(1) | NO | Staff and applicants; for students see `registered_contact.verified_at` |
| username | VARCHAR(80) | YES | Students issued a school username and password (fallback login for families without a usable email) |
| person_ref | BINARY(16) | YES | ID of the student or staff record in the academic database (no foreign key; different database) |
| registered_contact_id | BINARY(16) | YES | `STUDENT` accounts only: the family's registered contact (FK to `registered_contact`) |
| mfa_required | TINYINT(1) | NO | Forced on for platform staff and school admins |
| last_login_at | DATETIME(3) | YES | |
| created_at, updated_at | DATETIME(3) | NO | |
| deleted_at | DATETIME(3) | YES | |
| version | INT | NO | |

Keys: PK (id); UK (tenant_id, email); UK (tenant_id, phone); UK (tenant_id, username); IX (tenant_id, user_type, status); IX (tenant_id, person_ref); IX (tenant_id, registered_contact_id).

Notes:
- Multiple `NULL` values are allowed in unique keys, which is what we want for accounts without an email, phone, or username.
- On soft delete, the email, phone, and username are cleared or anonymized so the values can be reused and personal data does not linger.
- **One account per student; the registered contact belongs to the family.** For students the login contact is stored in `registered_contact` (section 6.7), not in this table. Several sibling accounts can point to the same `registered_contact_id`. The unique keys on (tenant_id, email) and (tenant_id, phone) still apply to staff and applicants, who keep their own contact here.
- There are no separate parent accounts. Guardian details are contact information on the student record in the academic database.
- A contact is never edited directly; changes go through `contact_change_request` (section 6.6) and update `registered_contact`.
- A student in two different schools has one account per school, because each school is a separate tenant.

### 6.2 `user_credential`

| Column | Type | Null | Notes |
|---|---|---|---|
| user_id | BINARY(16) | NO | PK, FK to `user_account` |
| tenant_id | BINARY(16) | NO | |
| password_hash | VARCHAR(255) | YES | `NULL` for OTP-only student accounts |
| hash_algorithm | VARCHAR(20) | NO | For example `argon2id` or `bcrypt` |
| password_changed_at | DATETIME(3) | YES | |
| must_change_password | TINYINT(1) | NO | |
| failed_attempts | INT | NO | |
| locked_until | DATETIME(3) | YES | |

Kept separate from `user_account` so ordinary queries never load hashes, and so database rights on this table can be tighter.

### 6.3 `user_mfa`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | |
| user_id | BINARY(16) | NO | |
| mfa_type | VARCHAR(10) | NO | `TOTP` at first |
| secret_encrypted | VARBINARY(255) | NO | Encrypted with a key held outside the database |
| recovery_codes_hash | JSON | YES | Hashed one-time recovery codes |
| enabled_at | DATETIME(3) | YES | |

Keys: PK (id); IX (tenant_id, user_id).

### 6.4 `otp_challenge`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | |
| user_id | BINARY(16) | YES | `NULL` for applicants who do not have an account yet, and for family logins before a student is chosen |
| channel | VARCHAR(6) | NO | `SMS` or `EMAIL`. Only `EMAIL` is enabled at first |
| target_hash | CHAR(64) | NO | Hash of the phone or email, not the value itself |
| purpose | VARCHAR(20) | NO | `LOGIN`, `VERIFY_PHONE`, `VERIFY_EMAIL`, `FIRST_LOGIN`, `RESET`, `CONTACT_CHANGE_OLD`, `CONTACT_CHANGE_NEW` |
| code_hash | CHAR(64) | NO | |
| attempts | INT | NO | Maximum enforced in code |
| expires_at | DATETIME(3) | NO | A few minutes |
| consumed_at | DATETIME(3) | YES | |
| created_at | DATETIME(3) | NO | |

Keys: PK (id); IX (tenant_id, target_hash, purpose, created_at); IX (expires_at).
Rows are purged soon after expiry. Rate limits per contact and per IP live in the cache (Redis once you run more than one instance).

### 6.5 `action_token` (set-password and reset links)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | |
| user_id | BINARY(16) | NO | |
| purpose | VARCHAR(20) | NO | `SET_PASSWORD`, `RESET_PASSWORD`, `VERIFY_EMAIL` |
| token_hash | CHAR(64) | NO | Hash of a long random token |
| expires_at | DATETIME(3) | NO | 24-72 hours for the welcome link |
| used_at | DATETIME(3) | YES | Single use |
| created_at | DATETIME(3) | NO | |

Keys: PK (id); UK (token_hash); IX (tenant_id, user_id, purpose).

### 6.6 `contact_change_request`

Handles every change of a registered contact: School Admin only, by one of two methods. `OLD_CONTACT_OTP` is the normal path (OTP on the previous contact). `IN_PERSON_RECOVERY` is for a closed email account, lost phone, or dead SIM, where no OTP can be received.

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | |
| registered_contact_id | BINARY(16) | NO | The registered contact being changed |
| method | VARCHAR(20) | NO | `OLD_CONTACT_OTP`, `IN_PERSON_RECOVERY` |
| scope | VARCHAR(15) | NO | `ALL_LINKED` (default) or `SINGLE_STUDENT` (move one child to another contact) |
| student_user_id | BINARY(16) | YES | Required when scope is `SINGLE_STUDENT` |
| requested_by | BINARY(16) | NO | School Admin who started the change |
| old_contact_hash | CHAR(64) | NO | Hash of the previous contact |
| new_channel | VARCHAR(6) | NO | `EMAIL` or `PHONE`. A change from `EMAIL` to `PHONE` is how a family moves to phone login once SMS is enabled |
| new_contact_encrypted | VARBINARY(512) | NO | New email or phone, encrypted until the change completes or expires |
| state | VARCHAR(20) | NO | `PENDING_OLD_OTP`, `PENDING_APPROVAL`, `PENDING_NEW_OTP`, `COMPLETED`, `EXPIRED`, `CANCELLED`, `REJECTED`, `FAILED` |
| old_otp_challenge_id | BINARY(16) | YES | Links to `otp_challenge` (purpose `CONTACT_CHANGE_OLD`); only for `OLD_CONTACT_OTP` |
| new_otp_challenge_id | BINARY(16) | YES | Links to `otp_challenge` (purpose `CONTACT_CHANGE_NEW`) |
| recovery_reason | VARCHAR(300) | YES | Required for `IN_PERSON_RECOVERY`, for example "email account closed, provider recovery failed" |
| id_check_type | VARCHAR(30) | YES | Type of photo ID the guardian showed. The ID number and any copy are **not** stored |
| id_checked_by | BINARY(16) | YES | Admin who did the check at the office |
| approved_by | BINARY(16) | YES | Second admin; must differ from `requested_by` |
| approved_at | DATETIME(3) | YES | |
| created_at | DATETIME(3) | NO | |
| expires_at | DATETIME(3) | NO | `OLD_CONTACT_OTP`: short window, for example 15 minutes. `IN_PERSON_RECOVERY`: longer, for example 24 hours, because a second admin must approve |
| completed_at | DATETIME(3) | YES | |

Keys: PK (id); IX (tenant_id, registered_contact_id, created_at); IX (state, expires_at).

**Method A: `OLD_CONTACT_OTP`**
1. The School Admin starts a change and enters the new contact. State `PENDING_OLD_OTP`; an OTP goes to the **previous** contact.
2. The OTP is entered (by the family member who controls the old contact, in person or remotely). If correct, an OTP goes to the **new** contact (`PENDING_NEW_OTP`).
3. When the new contact's OTP is confirmed, the completion steps below run.

**Method B: `IN_PERSON_RECOVERY`** (old contact lost, closed, or dead)
1. The guardian comes to the office with a photo ID. The first admin compares the person with the guardian details on the student record, fills in `id_check_type`, `id_checked_by`, `recovery_reason`, and enters the new contact. State `PENDING_APPROVAL`.
2. A second admin holding `contact.change.approve` (Principal or School IT Admin) reviews and approves or rejects. The approver must be a different person from `requested_by`. State `PENDING_NEW_OTP` on approval.
3. An OTP goes to the **new** contact and is entered at the office. When confirmed, the completion steps below run.
4. No remote path exists in v1.

**Completion (both methods), in one transaction**
- `ALL_LINKED`: update `registered_contact` to the new channel and value. If the new contact already belongs to another `registered_contact` in this school, the linked students are moved onto that one instead (a merge, which is how siblings on two contacts are brought together) and the emptied row is soft deleted.
- `SINGLE_STUDENT`: point that student's `registered_contact_id` at the registered contact for the new value (created if missing). The other siblings stay on the old contact.
- Set `registered_contact.status` to `ACTIVE` (this also lifts a freeze), set `verified_at`, revoke all refresh tokens for every affected account, set the state to `COMPLETED`.
- Send an alert to the old and new contacts (neither message names a child), write an `audit_event` (`CONTACT_CHANGED`, with masked contacts, method, initiator, and approver), clear `new_contact_encrypted`, and publish `RegisteredContactChanged`.

Safeguards: limited attempts per OTP, short expiry, rate limits per registered contact and per admin, only one open request per registered contact, and neither the initiator nor the approver may hold an account whose own contact equals the new one.

**Moving the whole school to phone login later:** when SMS is enabled, the school adds `PHONE` to `login_channels`. Each family then moves with a normal contact change with `new_channel = PHONE` (OTP on the old email, OTP on the new phone). Admins can start these in bulk from a reviewed list of guardian phone numbers already on the student records. The exact bulk flow is designed when SMS is actually enabled.

### 6.7 `registered_contact`

The family's login contact for a school: an email address at first, a phone number later. Student accounts link to it, which is how siblings share a login.

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | |
| channel | VARCHAR(6) | NO | `EMAIL` or `PHONE`; must be listed in the school's `login_channels` |
| contact_value | VARCHAR(254) | NO | Lowercase email, or E.164 phone |
| status | VARCHAR(10) | NO | `ACTIVE`, `FROZEN` |
| verified_at | DATETIME(3) | YES | When the contact was last confirmed by an OTP during a change or verification |
| last_verified_at | DATETIME(3) | YES | Last successful OTP login, updated at most once a day; used for yearly re-verification |
| frozen_at | DATETIME(3) | YES | |
| frozen_by | BINARY(16) | YES | School Admin who froze it |
| freeze_reason | VARCHAR(200) | YES | For example "phone reported stolen" or "email account compromised" |
| created_at, updated_at | DATETIME(3) | NO | |
| deleted_at | DATETIME(3) | YES | Set when no student is linked; the value is cleared so it can be reused |
| version | INT | NO | |

Keys: PK (id); UK (tenant_id, channel, contact_value); IX (tenant_id, status); IX (tenant_id, last_verified_at).

Notes:
- **Login flow:** the OTP goes to the contact (`otp_challenge.user_id` is `NULL` at this stage). After it is confirmed, the service lists the active `STUDENT` accounts linked to this `registered_contact`. One account logs in directly; several show the "choose student" screen. A `FROZEN` contact sends no OTP. Refresh tokens for family accounts are long-lived (set per school), so an OTP is not needed at every visit.
- **Linking siblings:** bulk import, `ApplicationAccepted`, and the office all find or create the `registered_contact` for a value and link the student to it. A contact appearing on several students at import is listed for the admin to confirm. The limit on children per contact is `max_students_per_contact` in `tenant_config.feature_flags` (suggested default 6), checked in code.
- **Freeze:** any admin with `contact.freeze` sets `FROZEN`, which revokes all sessions of the linked accounts and writes an `audit_event`. Unfreezing happens when an OTP on that contact succeeds (the family regained access) or when a recovery completes.
- **Re-verification:** at academic year rollover, families confirm their contact by OTP at next login. Contacts whose `last_verified_at` is older than the school's chosen period are listed for the office, which can freeze them. This limits exposure from recycled phone numbers and abandoned email accounts.
- **Email normalization:** emails are trimmed and lowercased; dots and plus-tags are not rewritten.

## 7. Roles and permissions

| Table | Columns | Keys |
|---|---|---|
| `permission` | code VARCHAR(80), description VARCHAR(200) | PK (code). Global catalog, for example `marks.publish`, `attendance.write`, `fees.read`, `users.manage`, `content.edit` |
| `role` | id BINARY(16), tenant_id, code VARCHAR(40), name VARCHAR(100), is_system TINYINT(1), created_at | PK (id); UK (tenant_id, code) |
| `role_permission` | tenant_id, role_id, permission_code | PK (role_id, permission_code); FK to `role` and `permission` |
| `user_role` | tenant_id, user_id, role_id, granted_by, granted_at, expires_at (nullable) | PK (tenant_id, user_id, role_id); IX (tenant_id, role_id) |

Seeded roles:
- **Per school, created at provisioning:** `SCHOOL_IT_ADMIN`, `PRINCIPAL`, `EXAM_CONTROLLER`, `ACCOUNTANT`, `OFFICE_CLERK`, `CONTENT_EDITOR`, `TEACHER`, `CLASS_TEACHER`, `STUDENT` (the family login), `APPLICANT`.
- **Platform tenant:** `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`.

Contact permissions: `contact.freeze` and `contact.change.initiate` go to `SCHOOL_IT_ADMIN`, `PRINCIPAL`, and `OFFICE_CLERK`; `contact.change.approve` goes only to `PRINCIPAL` and `SCHOOL_IT_ADMIN`. The initiator and approver of one request must be different people.

Permissions answer "can this role perform this action?" **Ownership checks** (this student account may read only its own student, this teacher owns this section) are not stored here; they are checked in the academic service. The JWT carries role codes and `tenantId`; permissions are resolved from a cached role-to-permission map.

## 8. Sessions and keys

### 8.1 `refresh_token`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | |
| user_id | BINARY(16) | NO | |
| family_id | BINARY(16) | NO | One family per login; reuse of an old token revokes the whole family |
| token_hash | CHAR(64) | NO | |
| issued_at | DATETIME(3) | NO | |
| expires_at | DATETIME(3) | NO | |
| revoked_at | DATETIME(3) | YES | |
| replaced_by | BINARY(16) | YES | Next token in the rotation chain |
| ip_address | VARBINARY(16) | YES | |
| user_agent | VARCHAR(255) | YES | |

Keys: PK (id); UK (token_hash); IX (tenant_id, user_id); IX (family_id); IX (expires_at).
Access tokens are short-lived and verified locally; a short-lived Redis block list handles instant revocation.
Switching between sibling accounts checks that both accounts share the same `registered_contact_id` and that the contact is `ACTIVE`, then issues new tokens for the target account without a new OTP. A freeze or a contact change revokes the tokens of every linked account. Family refresh tokens are long-lived (set per school) to keep OTP email volume low.

### 8.2 `signing_key`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| kid | VARCHAR(64) | NO | Key ID placed in the token header |
| vault_ref | VARCHAR(200) | NO | Where the private key lives; the key itself is never stored in the database |
| status | VARCHAR(10) | NO | `ACTIVE`, `RETIRING`, `RETIRED` |
| activated_at, retire_at | DATETIME(3) | YES | Supports key rotation with overlap |

Keys: PK (id); UK (kid).
Keys are platform-wide. Tokens are bound to a school through the `tenantId` claim, and the gateway rejects any token whose claim does not match the host's tenant.

## 9. Support access and audit

### 9.1 `support_access_session`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BINARY(16) | NO | PK |
| tenant_id | BINARY(16) | NO | The school being accessed |
| staff_user_id | BINARY(16) | NO | Platform staff account |
| ticket_ref | VARCHAR(60) | NO | Required |
| reason | VARCHAR(500) | NO | |
| approval_status | VARCHAR(12) | NO | `NOT_REQUIRED`, `PENDING`, `APPROVED`, `DENIED` |
| approved_by_user_id | BINARY(16) | YES | School admin who approved |
| starts_at | DATETIME(3) | NO | |
| ends_at | DATETIME(3) | NO | Hard time limit |
| ended_at | DATETIME(3) | YES | Set when closed early |

Keys: PK (id); IX (tenant_id, starts_at); IX (staff_user_id, starts_at).
Every action taken during a session is written to `audit_event` with this session's ID, so a school can be shown exactly what support did.

### 9.2 `audit_event` (partitioned by month)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BIGINT AUTO_INCREMENT | NO | |
| created_at | DATETIME(3) | NO | Part of the primary key because of partitioning |
| tenant_id | BINARY(16) | NO | |
| actor_user_id | BINARY(16) | YES | |
| actor_type | VARCHAR(10) | NO | `USER`, `STAFF`, `SYSTEM` |
| support_session_id | BINARY(16) | YES | |
| action | VARCHAR(60) | NO | For example `TENANT_STATUS_CHANGED`, `ROLE_GRANTED`, `CONFIG_CHANGED`, `LOGIN_FAILED_LOCKOUT` |
| entity_type | VARCHAR(40) | NO | |
| entity_id | BINARY(16) | YES | |
| old_value | JSON | YES | Masked; no personal data or secrets |
| new_value | JSON | YES | Masked |
| ip_address | VARBINARY(16) | YES | |
| request_id | VARCHAR(64) | YES | Correlation ID |

Keys: PK (id, created_at); IX (tenant_id, created_at); IX (tenant_id, entity_type, entity_id, created_at). Partitioned by `RANGE` on `created_at`, one partition per month, with no foreign keys. Retention is long (audit value) and set in the contract; old partitions are dropped, not deleted row by row.

### 9.3 `login_attempt` (partitioned by month)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BIGINT AUTO_INCREMENT | NO | |
| created_at | DATETIME(3) | NO | Part of the primary key |
| tenant_id | BINARY(16) | NO | |
| user_id | BINARY(16) | YES | |
| identifier_hash | CHAR(64) | NO | Hash of what was typed |
| method | VARCHAR(10) | NO | `PASSWORD`, `OTP`, `REFRESH` |
| result | VARCHAR(12) | NO | `SUCCESS`, `BAD_SECRET`, `LOCKED`, `UNKNOWN_USER`, `MFA_FAILED` |
| ip_address | VARBINARY(16) | YES | |
| user_agent | VARCHAR(255) | YES | |

Keys: PK (id, created_at); IX (tenant_id, created_at); IX (user_id, created_at). Retention about 90 days. Feeds the failed-login-spike monitor.

## 10. Events (outbox and inbox)

### 10.1 `outbox_event`

| Column | Type | Null | Notes |
|---|---|---|---|
| id | BIGINT AUTO_INCREMENT | NO | PK; order of publishing |
| event_id | BINARY(16) | NO | Unique ID carried by the event |
| tenant_id | BINARY(16) | NO | |
| aggregate_type | VARCHAR(40) | NO | For example `Tenant`, `User` |
| aggregate_id | BINARY(16) | NO | |
| event_type | VARCHAR(60) | NO | For example `TenantStatusChanged`, `TenantConfigChanged`, `UserCreated` |
| payload | JSON | NO | |
| publish_state | TINYINT | NO | 0 pending, 1 published |
| created_at | DATETIME(3) | NO | |
| published_at | DATETIME(3) | YES | |

Keys: PK (id); UK (event_id); IX (publish_state, id).
Written in the same transaction as the change; a relay publishes pending rows in order and marks them published. Published rows are purged after a few days.

### 10.2 `processed_event`

| Column | Type | Null | Notes |
|---|---|---|---|
| consumer | VARCHAR(60) | NO | Name of the handler in this service |
| event_id | BINARY(16) | NO | |
| processed_at | DATETIME(3) | NO | |

Keys: PK (consumer, event_id). Makes replays and duplicates harmless.

## 11. Summary of main relationships

```
plan ──< plan_entitlement
plan ──< tenant ──< tenant_contact
                 ──< tenant_domain
                 ──< tenant_config (versions)
                 ──< tenant_entitlement_override
                 ──< user_account ──1 user_credential
                                  ──< user_mfa
                                  ──< user_role >── role ──< role_permission >── permission
                                  ──< refresh_token
                                  ──< action_token / otp_challenge
tenant ──< registered_contact ──< user_account (STUDENT accounts, via registered_contact_id)
                              ──< contact_change_request
tenant ──< support_access_session ──< audit_event (by session id, no FK)
```

## 12. Caching notes (Redis, always tenant-prefixed)

| Key | Content | Invalidation |
|---|---|---|
| `host:{host}` | tenant ID and status | `TenantStatusChanged`, domain change |
| `tenant:{id}:status` | status and grace end | `TenantStatusChanged` |
| `tenant:{id}:config:{version}` | full config (immutable, long TTL) | New version creates a new key |
| `tenant:{id}:entitlements` | effective entitlements | Plan change, override change |
| `role:{tenantId}:{roleId}:perms` | permission codes | Role change |
| `revoked:{tokenId}` | short-lived revocation marker | Expires with the token |

Always set a TTL as a safety net, even with event-driven invalidation.

## 13. Decisions

**Settled**
1. **Login:** only student accounts exist; parents use the student's login. No separate parent accounts.
2. **Login channel:** email OTP at first, because no SMS provider is in place. The contact has a channel (`EMAIL` or `PHONE`) and a per-school `login_channels` flag, so SMS OTP can be enabled later.
3. **Contact changes:** School Admin only. Normal path: OTP to the previous contact, then OTP to the new contact.
4. **Siblings:** one registered contact can link several student accounts in a school (`registered_contact`), with a "choose student" step after OTP and switching without a new OTP.
5. **Lost access:** provider recovery first; any admin can freeze a contact at once; in-person recovery with an ID check, two different admins, and OTP on the new contact. No remote recovery in v1.

**To confirm**
1. **Families with email:** what share of the first school's families have a working email. If it is low, the school-issued username and password fallback becomes the main path.
2. **Children per contact:** default limit (suggested 6).
3. **Waiting period:** whether a recovered contact activates immediately after the in-person check (current design) or after a delay such as 24 hours with an alert to the old contact.
4. **Accepted IDs:** which photo IDs the office accepts; current design stores only the ID type, not the number or a copy.
5. **Re-verification period:** suggested one academic year, checked at rollover.
6. **Session length:** how long family refresh sessions last (suggested several weeks, per school).
7. **Registered contact owner:** for minors, the contact should belong to a parent or guardian. Decide how the school confirms this at admission.
8. **Audit retention:** how long to keep audit rows (suggested: at least one academic year after the school leaves, stated in the contract).
9. **Hash algorithm and OTP length:** I suggest argon2id (or bcrypt if the library choice is easier) and 6-digit OTPs with a 5-minute expiry.
10. **Moving to phone later:** the bulk switch flow, designed when SMS is actually available.

## 14. Next steps

1. Turn these definitions into the first Flyway migration (`V1__auth_tenant.sql`) and seed data (reserved platform tenant, plans, permissions, roles).
2. Define the event payloads for `TenantStatusChanged`, `TenantConfigChanged`, `UserCreated`, and `RegisteredContactChanged`.
3. Repeat this level of detail for the platform database, then the academic database.
