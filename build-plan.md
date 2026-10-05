# Build Plan: School Platform (solo developer)

**Companion to:** `prd.md` (v0.8), `architecture.md` (v0.4), `database-auth-tenant.md` (v0.4)
**Status:** Draft v0.2
**Changes in v0.2:** email-only start (no SMS provider yet), with the login contact designed as a channel so phone OTP can be added later.
**Purpose:** Say whether the documents are ready to build from, what to build first, what to leave for later, and how to grow the product over time as one person.

---

## 1. Verdict

The documents are good enough to start building the foundation. They are not a reason to build everything at once.

- **Solid enough to build from:** tenant isolation, tenant lifecycle, roles, audit, and the login model (including siblings and lost-access recovery). `database-auth-tenant.md` can become the first migration as it stands.
- **Not yet validated:** nobody from a school has seen the sibling flow, the choose-student screen, or in-person contact recovery. Show them to the first school's office staff before spending weeks on them. Also unchecked: how many families have a working email.
- **Too heavy for one person:** six services, a message broker, Redis, and inbox/outbox tables everywhere. The documents describe where the product can end up. Phase 1 should be much smaller (section 2).
- **Still open:** pricing, grace period, refund policy. These do not block building, but they block onboarding a paying school.

## 2. What changes for a solo build

The architecture documents stay as the target. For phase 1, build this instead:

| Documents say | Build first | Why |
|---|---|---|
| Six separate services | **One Spring Boot application** with modules: `auth-tenant`, `academic`, `fee`, `content`, `notification`, `platform` | One deployment, one set of logs, one thing to debug at night |
| One database per service, one MySQL user each | **One database, one MySQL application user.** Each module owns its own tables and never reads another module's tables (no cross-module joins, no cross-module foreign keys) | Keeps the split cheap later without running six databases now |
| Message broker | **In-process events** (Spring application events). Keep an `outbox_event` table only for the events that must not be lost: `ResultPublished`, `FeePaid`, `RegisteredContactChanged` | A broker is a second system to run and monitor |
| Redis | **In-process cache (Caffeine)** for tenant status, config, and published results. Add Redis when you run more than one application instance | One instance is enough for 2,000 students if results are cached |
| API gateway service | **A filter in the same application**: resolve tenant from host, verify JWT, check tenant status | Same logic, no extra service |
| Self-service wizard, billing, provisioning | **Manual onboarding** for the first schools: you create the tenant with an admin script or a small internal screen | Automate only after you have done it by hand three times |

**Keep these from the documents, because they are hard to add later:**
- `tenant_id` first in every key and index.
- Hibernate `@TenantId` plus the central tenant context.
- Automated isolation tests in CI (two tenants, assert nothing leaks).
- Flyway for every schema change, MySQL 8.4 in Docker and Testcontainers, UTC everywhere, money in paise.
- Audit rows for marks, attendance, and contact changes.
- Tenant-prefixed cache keys and object storage paths.

## 3. First-school scope (v1)

**In:** email OTP login for families (with the channel kept open for phone later), password login for staff, roles, students, classes and sections, teacher assignments, attendance, marks, result publishing, notices, a simple public website from one template, email notifications, the sibling and contact-recovery flow.

**Out until the first school is live and using it:** SMS and phone-number login, fee collection and online payments, admission module, the preview-then-pay flow, billing and invoices, automated provisioning, custom domains, multiple templates, dedicated databases for Premium, WhatsApp, ID cards, data-migration service.

**Rule:** a feature enters v1 only if the first school cannot run a normal week without it.

## 4. Phases

Estimates are focused full-time weeks for one developer. If you work part-time, multiply accordingly, and expect each phase to run over by about a third.

### Phase 0: Foundation (about 1 week)
- Repository, module layout, Docker MySQL 8.4, Flyway, CI.
- Tenant context, `@TenantId` setup, and the **isolation test harness**.
- Environment-based configuration, structured logging that never writes email addresses, phone numbers, OTPs, marks, or tokens.
- **Email sending setup:** pick a transactional email provider, set up a sending domain with SPF, DKIM, and DMARC, and test that OTP emails reach the inbox. Build a small notification channel interface (`EMAIL` now) so SMS can plug in later.
- **Gate:** CI creates two tenants and fails on any cross-tenant read.

### Phase 1: Auth and tenant (3 to 4 weeks)
- `V1__auth_tenant.sql` from `database-auth-tenant.md`, with seed data (reserved platform tenant, plans, permissions, roles).
- Host to tenant resolution, tenant status check, JWT with rotating refresh tokens.
- OTP login through email, long-lived family sessions (so an OTP is not needed at every visit), staff password login with 2FA, lockout and rate limits, and the school-issued username and password fallback if the family count says you need it.
- `registered_contact` with a channel, choose-student step, sibling switching, freeze, and both contact-change methods.
- **Gate:** you can onboard a test school by script, log in as admin, teacher, and a family with two siblings, and recover a "lost" email through the two-admin flow.

### Phase 2: Academic core (4 to 6 weeks)
- Academic years, classes, sections, subjects, students (with bulk import and sibling detection), staff, teacher assignments.
- Attendance (partitioned by date), exams, mark entry with lock state, audited edits.
- Result publication into immutable `published_result` rows, cached reads.
- Family view: own child's attendance, marks, timetable. Teacher view: own sections only.
- **Gate:** load test of result day (2,000 families reading within minutes) passes on your actual hosting size.

### Phase 3: Notices, website, notifications (2 to 3 weeks)
- Notices and circulars by class or school, one public website template, branding from `tenant_config`.
- Asynchronous email with daily send limits respected, minimal message content, opt-outs.
- Triggered messages for result published and absence (names the child).
- **Gate:** pilot with the first school's staff using it for real attendance and notices for a few weeks.

### Phase 4: Fees (2 to 3 weeks, after the pilot)
- Fee structures, invoices, receipts, concessions, and the school's own payment gateway settings.
- Webhook handling idempotent by event ID. Fee data is never served from cache.
- **Gate:** one full fee cycle with reconciliation, before enabling for all families.

### Phase 5: Admission, preview, billing, provisioning (after 2 to 3 schools)
- Admission module (feeds `ApplicationAccepted`, which links siblings to an existing contact).
- Preview with demo data, plans and invoices, payment-to-provisioning automation, domain connection.
- Build this only after manual onboarding has shown you which steps repeat.

## 5. Validate before and during the build

1. **Show the first school's office staff** the choose-student screen and the recovery steps. Ask who would actually do the second-admin approval.
2. **Count families with a working email** at the first school. If many have none, make the school-issued username and password the main login and treat email OTP as the second option.
3. **Check email delivery limits.** Free tiers of email providers commonly cap daily sends (as far as I know; check your provider), and result day can bring a surge of logins. Long-lived sessions, staged logins before result day, and the username fallback all reduce this risk.
4. **Check your cloud MySQL version** against the 8.4 target before choosing a provider.
5. **Move to the cloud database before the first real school goes live,** as `architecture.md` section 9 says.
6. **Get the contract and data-processing terms reviewed** by a lawyer before holding real student data. The DPDP Act obligations for minors' data are not something to guess at.

## 6. Decisions you can make now

These are my suggestions, not settled decisions. Override any of them.

| Question | Suggestion |
|---|---|
| Children per registered contact | 6 |
| Wait before a recovered contact activates | None for v1 (the in-person check is the control); revisit after the pilot |
| IDs the office records | Type only, no number and no copy |
| Contact re-verification | Once per academic year, at rollover |
| Login channel | `EMAIL` now. The contact has a channel and a per-school flag, so `PHONE` (SMS OTP) can be enabled later; add SMS when a provider and sender registration (DLT in India) are in place |
| Family session length | Several weeks, set per school |
| First-school pricing | Fixed pilot price by agreement; set public prices only after you know your real costs (`prd.md` section 4.4) |
| Hosting | One VM plus managed MySQL in an India region; add Redis and a second instance only when load requires it |

## 7. Risks specific to working alone

| Risk | Mitigation |
|---|---|
| Result day fails while you are the only responder | Pre-warmed cache, a load test before the event, a written runbook, and a rule that no school goes live during an exam week without a rehearsal |
| Scope grows with every school's request | Template-first policy; paid, scoped custom work only; keep a visible "not in v1" list |
| Burnout or illness stops all support | Managed database, automated backups with a tested restore, uptime alerts to your phone, and a clear support-hours promise in the contract |
| Security mistake exposes one school's data to another | The isolation tests in CI, code review of every native SQL query (even self-review with a checklist), and no shortcuts around the tenant filter |
| Result-day OTP emails land in spam or exceed a free-tier limit | Authenticated sending domain, long-lived sessions, staged logins, username/password fallback, and a paid email plan if the free tier is too small |
| Building for months with no user feedback | The phase gates above; the pilot starts at the end of Phase 3, not Phase 5 |

## 8. How the documents relate to this plan

- `prd.md`, `architecture.md`, and `database-auth-tenant.md` describe the product and the long-term design.
- This plan decides what is built first and in what shape. Where they differ (for example one application instead of six services), this plan wins for phase 1.
- When you later split a module into a service, the module boundaries and the "no cross-module table access" rule are what make that a small change.
- Update the documents only when a real decision changes. Do not rewrite them to match the code; keep one short "decisions log" instead.

## 9. Next five actions

1. Create the repository, Docker MySQL 8.4, Flyway, and the CI isolation test (Phase 0).
2. Set up the email sending domain (SPF, DKIM, DMARC), choose a provider, and check its free-tier daily limit against the first school's result-day volume.
3. Meet the first school's office staff, count how many families have a working email, and walk through the login, sibling, and contact-recovery flows.
4. Turn `database-auth-tenant.md` into `V1__auth_tenant.sql` plus seed data.
5. Decide the pilot price and agreement terms with the first school.
