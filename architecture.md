# Architecture: Service Boundaries and Database Design (MySQL)

**Companion to:** `prd.md` (v0.8)
**Status:** Draft v0.4
**Changes in v0.2:** guardian accounts removed; student account is the family login.
**Changes in v0.3:** the registered phone number is now its own record (`registered_phone`) that several sibling accounts can link to; added the lost-SIM recovery path and the `RegisteredPhoneChanged` event.
**Changes in v0.4:** no SMS provider yet, so login is by email OTP at first. The registered contact is a `registered_contact` record with a channel (`EMAIL` now, `PHONE` later), and the event is now `RegisteredContactChanged`.
**Database:** MySQL 8.4 LTS target (developed locally, then moved to a managed cloud MySQL in an India region)

---

## 1. Principles

1. **Control plane and runtime are separate.** Billing, onboarding, and provisioning sit in their own services and database, so a result-day spike at a school never slows payments or provisioning.
2. **Each service owns its data.** No service reads another's tables and there are no cross-service foreign keys. Services refer to each other by ID and keep small local copies of what they need, updated through events.
3. **Every runtime table has `tenant_id`.** It comes first in every primary key, unique key, and index.
4. **One MySQL server, one database per service, one database user per service** in phase 1. Any database can move to its own server later.
5. **MySQL has no Row-Level Security,** so tenant isolation is enforced in the application and backed by extra safeguards (section 5).

## 2. Services

| # | Service | Plane | Owns |
|---|---|---|---|
| 1 | **API Gateway** | Edge | No data. Tenant resolution, JWT check, tenant-status check, rate limits, public-route cache |
| 2 | **Auth & Tenant** | Shared | Tenants, domains, plans, lifecycle status, per-school config, user accounts, roles |
| 3 | **Platform** (Onboarding, Provisioning, Billing) | Control | Signups, wizard drafts, preview tokens, provisioning jobs, subscriptions, invoices, payments |
| 4 | **Student & Academic** | Runtime | People records, classes, timetable, attendance, exams, marks, results, assignments, leave |
| 5 | **Fee** | Runtime | Fee structures, invoices, payments, receipts, refunds, per-school gateway settings |
| 6 | **Content & Admission** | Runtime | Pages, notices, events, gallery, applications |
| 7 | **Notification** | Runtime | Templates, send requests, delivery attempts, quotas |

Service 3 can begin as three modules in one deployment and split later. Services 4, 5, and 6 stay separate because their load differs: result-day reads, fee-deadline writes, and public content.

## 3. Databases and users (phase 1)

| Database | Used by | MySQL user |
|---|---|---|
| `sp_auth` | Auth & Tenant | `svc_auth` (rights only on `sp_auth`) |
| `sp_platform` | Platform | `svc_platform` |
| `sp_academic` | Student & Academic | `svc_academic` |
| `sp_fee` | Fee | `svc_fee` |
| `sp_content` | Content & Admission | `svc_content` |
| `sp_notify` | Notification | `svc_notify` |

- No service user has rights on another service's database, and no query joins across databases.
- Migrations run with a separate migration user, never with the application user.
- Premium schools get their own database (or server) for the runtime services; `tenant.datasource_ref` points to it.

## 4. Key tables per service

**Auth & Tenant (`sp_auth`)**
- `tenant` (id, name, status, plan_id, datasource_ref, created_at)
- `tenant_domain` (tenant_id, host, type subdomain/custom, verified)
- `plan`, `plan_entitlement` (modules, student limit, SMS quota, storage)
- `tenant_config` (tenant_id, version, branding, modules, grading scheme, visibility rules, feature flags; JSON columns)
- `user_account` (id, tenant_id, login identifiers, type, status, person_ref); platform staff belong to a reserved platform tenant so `tenant_id` is never null
- `registered_contact` (tenant_id, channel, value, status): the family's login contact (email at first, phone later), linked to one or several student accounts (siblings)
- `contact_change_request` (method: OTP on old contact or in-person recovery, approvals, state)
- `user_credential`, `role`, `user_role`, `login_attempt`, `refresh_token`
- `support_access_session` (staff, tenant, ticket reference, approved_by, start, end)
- `audit_event`

**Platform (`sp_platform`)**
- `prospect`, `wizard_draft` (saved choices, version), `preview_token` (hash, expiry, draft_id)
- `provisioning_job`, `provisioning_step` (state, attempts, last error)
- `subscription` (tenant, plan, billing cycle, term start and end, student limit)
- `invoice`, `invoice_line`, `payment`
- `payment_webhook_event` (unique event ID, for idempotency)
- `usage_snapshot`

**Student & Academic (`sp_academic`)**, all with `tenant_id`
- `academic_year`, `class`, `section`, `subject`, `class_subject`
- `student`, `guardian_contact` (guardian name, relation, and contact details kept on the student record for school use; no login), `staff`
- `enrollment` (student, year, section): keeps history across years
- `teacher_assignment` (staff, section, subject, year): drives teacher scope
- `timetable_slot`
- `attendance_record` (student, date, status, marked_by, edited flag), partitioned by date
- `exam`, `exam_subject`, `mark_entry` (draft marks, lock state)
- `result_publication` (exam, published_by, time, version) and `published_result` (immutable snapshot rows for fast, cacheable reads)
- `assignment`, `submission`, `study_material`, `leave_request`
- `audit_event` (old value, new value, who, when) for marks and attendance

**Fee (`sp_fee`)**
- `fee_category`, `fee_structure`, `fee_structure_item`
- `student_fee_account` (local copy of student ID, class, and year, fed by events)
- `fee_invoice`, `fee_invoice_line`, `concession`
- `payment`, `payment_attempt`, `receipt`, `refund`
- `gateway_setting` (tenant, provider, secret reference to the vault, KYC status)
- `webhook_event` (unique ID)

**Content & Admission (`sp_content`)**
- `page`, `menu`, `notice`, `notice_audience`, `event`
- `gallery_album`, `media_asset` (object-storage key, consent flag)
- `application`, `application_document`, `application_status_history`

**Notification (`sp_notify`)**
- `template`, `notification_request` (channel `EMAIL` now, `SMS` later), `delivery_attempt`, `quota_usage`, `opt_out`

**In every service database:** `outbox_event` (events waiting to be published) and `processed_event` (events already handled, so replays are safe).

## 5. MySQL-specific conventions

| Topic | Rule |
|---|---|
| **IDs** | Time-ordered UUIDs stored as `BINARY(16)`, not `CHAR(36)`, to keep indexes small |
| **Tenant column** | `tenant_id BINARY(16) NOT NULL`, first column of every primary key, unique key, and index |
| **Character set** | `utf8mb4` with a modern collation on every database and table (names, Bengali, Hindi) |
| **Time** | Stored in UTC; server, driver, and JVM timezone all set to UTC |
| **Money** | Integer minor units (paise) plus a currency code; never floating point |
| **JSON** | `JSON` columns for tenant config and wizard drafts only; not queried heavily |
| **Partial indexes** | Not available; use generated columns or redesign the index |
| **Partitioning** | Partition key must be part of every primary and unique key. Plan this up front for `attendance_record`, `audit_event`, and `delivery_attempt` |
| **Constraints** | Foreign keys inside one service database are fine; none across services. CHECK constraints are supported in current versions |
| **Soft delete** | `deleted_at` on key records, supporting the recovery period in PRD section 11.8 |
| **Year scoping** | Year-scoped tables carry `academic_year_id`; old years are never overwritten |
| **Secrets and personal data** | Passwords hashed; secrets in a vault; sensitive personal fields encrypted at rest |
| **Files** | In object storage with a tenant prefix and signed URLs; the database stores only keys |
| **Engine** | InnoDB only |

## 6. Tenant isolation without Row-Level Security

Layers, in order of importance:

1. **Hibernate 6 discriminator multitenancy (`@TenantId`)**: every JPA query automatically carries the tenant, so a repository method cannot forget it.
2. **Central tenant context:** the gateway sets the tenant, a request-scoped context carries it, and events and async jobs carry `tenantId` explicitly.
3. **Native SQL and reports are restricted:** they bypass Hibernate's filter, so they go through a small wrapper that injects the tenant and require code review.
4. **Least-privilege database users:** each service user can reach only its own database.
5. **Automated isolation tests in CI:** create two tenants and assert that every endpoint returns nothing across the boundary; fail the build on any leak.
6. **Cache keys always prefixed** with the tenant ID; object storage paths prefixed per tenant.
7. **Premium tier:** a dedicated database gives hard isolation.

The application layer is the real security boundary. Describe it that way in sales and security material.

## 7. Events

| Event | From | To | Effect |
|---|---|---|---|
| `PaymentConfirmed` | Platform (billing) | Platform (provisioning) | Starts provisioning |
| `TenantProvisioned` | Platform | Auth & Tenant, Notification | Creates first admin, sends welcome email |
| `TenantStatusChanged` | Auth & Tenant | Gateway, all services | Refreshes cached status instantly |
| `TenantConfigChanged` | Auth & Tenant | Runtime services | Refreshes cached config |
| `StudentEnrolled`, `StudentUpdated` | Student & Academic | Fee, Content, Notification | Keeps small local copies current |
| `ResultPublished` | Student & Academic | Notification, cache layer | Sends notifications, pre-warms cache |
| `AttendanceMarked` (absent) | Student & Academic | Notification | Alerts the registered contact (the message names the child, since siblings share a contact) |
| `FeePaid`, `FeeDue` | Fee | Notification | Receipts, reminders |
| `ApplicationAccepted` | Content & Admission | Student & Academic, Auth & Tenant | Creates the student record and student account; links it to the school's existing registered contact if there is one (sibling) |
| `RegisteredContactChanged` | Auth & Tenant | Notification, Student & Academic | Updates local copies of the registered contact after a change, merge, or freeze |

Every event is written to the sender's `outbox_event` table in the same transaction as the data change, then published to the broker. Receivers record handled events in `processed_event`. Synchronous calls are kept to a minimum: JWTs are verified locally, and tenant status and config come from Redis.

## 8. Hot paths this design protects

- **Result day:** reads hit `published_result` through Redis; published data never changes.
- **Every request:** tenant status and config come from a cache invalidated by events.
- **Teacher actions:** teacher scope is cached per teacher and year.
- **Fee deadline:** payments are written idempotently by webhook event ID and never read from cache.

## 9. Local development now, cloud later

### 9.1 Do from day one
- **Confirm the local server version** with `SELECT VERSION();` in MySQL Workbench. The Workbench version (8.0 CE) is the client tool and does not tell you the server version.
- **Target MySQL 8.4 LTS.** As far as I know, MySQL 8.0 reached community end-of-life in April 2026; verify against your cloud provider's supported versions and match the major version locally and in the cloud.
- **All schema changes through Flyway or Liquibase;** never change tables by hand.
- **Connection settings from environment variables or a secret store;** nothing in code or committed files.
- **Run MySQL in Docker for development and use Testcontainers in tests,** so the version matches the cloud.
- **Avoid local-only features:** local file paths in `LOAD DATA`, custom plugins, `SUPER` privileges, unusual `sql_mode`. Managed services restrict several of these.
- **HikariCP with sensible pool limits,** and TLS-ready connections.
- **No cross-database joins,** so services can later sit on separate instances.

### 9.2 Migration outline
1. Create the managed MySQL instance (same major version, India region, private network, TLS, automated backups).
2. Run the migrations against it to confirm the schema builds cleanly.
3. Copy the data: dump and restore in a short window for small data, or replication and a cutover for minimal downtime.
4. Switch connection settings, run smoke tests and the isolation tests, and watch metrics.
5. Keep the old database read-only for a few days as a rollback option.
6. Add a read replica for Academic and Content when load requires it.

Cheapest approach: move to the cloud database **before the first real school goes live**, so no production data ever has to be migrated.

## 10. Decisions to confirm

1. **Accounts:** one account per student; parents use the student's login. Login is by OTP to the family's registered contact: email at first, phone when SMS is enabled for the school. One contact can link several siblings (choose-student step). Contact changes need an OTP on the previous contact, or, for lost access, in-person recovery with two-person approval (`database-auth-tenant.md`, sections 6.6 and 6.7).
2. **Grading scheme:** kept in versioned `tenant_config`, so changing it does not rewrite published results.
3. **One server, one database per service in phase 1,** moving to separate instances only when load or isolation needs it.
4. **Local server version:** confirm with `SELECT VERSION();` and upgrade the local development server to 8.4 LTS if it is older (no production data to lose yet).

## 11. Next steps

1. Confirm the local MySQL version.
2. Detailed table definitions for `sp_auth` are in `database-auth-tenant.md`; do the platform and academic databases next.
3. Define event payload contracts.
4. Set up the repository, Flyway, and Docker-based local environment.
