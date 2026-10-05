# Product Requirements Document (PRD)

**Product:** School Platform (working title) — multi-tenant school website and management system, sold as a self-service product
**Status:** Draft v0.8
**Backend:** Spring Boot microservices
**Model:** Preview first, pay to unlock; each school gets its own branded, fully hosted website

**Changes from v0.1:** added the business model and pricing tiers, the preview-then-pay flow, tenant lifecycle and payment-based access control, the onboarding wizard, the provisioning service, the billing module, and the phased path from manual onboarding to self-service.
**Changes in v0.3:** pricing and business model reworked: no free live tier (free is preview only), monthly/yearly billing with a yearly discount, India (INR) pricing, plans sized by student count, cost-based pricing method, and a pricing page requirement.
**Changes in v0.4:** added section 11 (operations, monitoring, and responsibilities): what is delivered to schools, the two portals, the responsibility split, credential delivery by email, per-school monitoring, support access, SLA and operational commitments, data recovery, release management, and contract checklist.
**Changes in v0.5:** database switched from PostgreSQL to MySQL (8.4 LTS target, local now, managed cloud MySQL later); Row-Level Security replaced by application-level isolation with extra safeguards; added database portability rules. See `architecture.md` for the service and database design.
**Changes in v0.6:** login model simplified: only student accounts exist (one per student, one registered phone number each); parents use the student's login; there are no separate parent accounts. Phone number changes by School Admin require an OTP on the previous number. Access matrix, requirements, and open questions updated.
**Changes in v0.7:** siblings can share one registered phone number (one number links several student accounts, with a "choose student" step after OTP); added a recovery path for a lost or dead SIM (duplicate SIM first, immediate freeze on report, in-person recovery with two-person approval); yearly re-verification of numbers; sections 5.3, 5.4, 5.6, 10.6, 10.7, 10.10, 10.11, 16, and 18 updated.
**Changes in v0.8:** no SMS provider yet, so the family login contact is an **email address** at first (OTP by email). The registered phone number became a registered contact with a channel (`EMAIL` now, `PHONE` later, enabled per school), so SMS OTP can be added without redesign. Sibling sharing, freeze, and in-person recovery now apply to the registered contact. Added long-lived family sessions and a school-issued username/password fallback. Sections 5.3, 5.4, 5.6, 6, 10.1, 10.6, 10.7, 10.10, 10.11, 11.4, 11.5, 13.1, 16, and 18 updated.

---

## 1. Overview

A platform where a school can register, choose its requirements (modules, board, template, branding), and **see a preview of its own website**. After payment, the system automatically provisions a live, fully hosted website with a secure portal for students, parents, teachers, and staff. Without payment, the school cannot access a live site or real functionality.

One codebase serves many schools (tenants). Each school gets its own domain, theme, content, and fully isolated data.

First target school: about 2,000 students (one account each, shared with their parents), 50-100 staff. Peak load: 2-3k concurrent users (result day, fee deadlines). The platform must scale to many schools.

## 2. Goals

1. Let a school go from signup to a live, branded site with minimal manual work.
2. Let schools see exactly what they are buying (preview) before they pay.
3. Make payment the only way to unlock real access, enforced by the system.
4. Give parents, students, and teachers a reliable portal for attendance, marks, fees, timetable, assignments, and notices.
5. Stay stable under result-day and fee-deadline spikes.
6. Keep each school's data strictly isolated.
7. Be operable by a very small team (possibly one person).
8. Keep infrastructure cost near zero for unpaid signups.

## 3. Non-goals (v1)

- Native mobile apps (responsive web only; PWA possible later)
- Full ERP modules: payroll, transport tracking, hostel, library, inventory
- Live video classes / full LMS
- Fully custom-designed website per school as part of the standard flow (template-based theming only; custom work is a separate paid request)
- Cross-school marketplace features
- Free live tier (preview only is free)
- Delivering source code or self-hosted installs to schools (schools receive a hosted service, not code or servers)

## 4. Business model and pricing

### 4.1 Principles

1. **No free live tier.** A live school carries real cost: hosting for result-day spikes (2-3k concurrent users), database and cache capacity, backups, storage, SMS, and support. A free live plan would lose money on every school and attract abuse. **The free offer is the preview only**, which costs almost nothing because it is a saved draft plus a shared renderer.
2. **Price is anchored to cost.** Cost grows with student count (load, storage, SMS), so plans include a student limit instead of a flat price for everyone.
3. **Familiar pricing page.** Plan cards with a "Most popular" highlight, a **Monthly / Yearly toggle** with a visible yearly saving, a clear feature checklist per plan, and **local pricing in INR** for Indian customers.
4. **Yearly is the default.** Schools run on an academic year, so yearly billing is both what they expect and safer for us. Monthly is offered at a higher effective price.
5. **Be careful with "cancel anytime."** Consumer products can promise this. For schools, cancellation affects children's records, so state the real rules: notice period, data export window, and what happens to data (see section 7).
6. **Pass-through costs stay separate.** SMS beyond the included quota, WhatsApp, and the school's payment-gateway fees are billed at cost plus a small margin, or paid by the school directly.

### 4.2 What "free" means

| Offer | Cost to us | What the school gets |
|---|---|---|
| **Free preview** | Near zero | Private, watermarked, expiring preview of their own template, colors, and logo with demo data |
| **Free trial of live site** | Not offered | A time-limited live trial would need real tenant resources; if sales needs one, grant it manually through Platform Admin for a specific school |

### 4.3 Plans (structure)

Plans differ by features and by included students. Prices below are **illustrative placeholders to validate** against competitor pricing and the cost model in 4.4.

| | **Starter** | **School** (most popular) | **Premium** |
|---|---|---|---|
| Intended for | Small schools | Mid-size schools (the 2,000-student target) | Large schools or those needing isolation |
| Included students | Up to 500 | Up to 2,500 | Custom |
| Hosting | Shared platform | Shared platform | Dedicated database or deployment |
| Domain | School subdomain | Custom domain | Custom domain |
| Core modules (attendance, results, notices, CMS) | Yes | Yes | Yes |
| Fee collection and online payments | Add-on | Included | Included |
| Admission module and assignments | Add-on | Included | Included |
| Reports and dashboards | Basic | Advanced | Advanced plus custom |
| SMS quota per month | Small | Medium | Custom |
| Support | Email | Priority | Priority plus onboarding help and higher SLA |
| Uptime target | 99.5% | 99.5% | 99.9% |
| Illustrative yearly price (INR) | Low five figures | Mid five figures | Quoted per school |
| Illustrative monthly price | Yearly price divided by 12, plus about 15-20% | Same rule | Same rule |

- **One-time setup fee** for onboarding, data import help, and template setup (waivable for yearly Premium deals).
- **Extra students** beyond the limit billed per student per year, or the school moves up a plan.
- **Yearly discount** shown on the toggle (target 15-20% versus monthly).
- Exact amounts are an open question (section 18).

### 4.4 How to set the real prices (cost-based method)

1. **Estimate monthly platform cost** on the target cloud (India region): application nodes, managed MySQL with replica, Redis, object storage, CDN, backups, monitoring, domain and certificate costs. Use the cloud provider's price calculator; do not guess.
2. **Add variable cost per school:** SMS and email volume, storage growth, payment-gateway fees (if borne by us), support hours.
3. **Add your own time:** onboarding, support, upgrades, on-call. For a solo operator this is the largest hidden cost.
4. **Divide by expected schools** on the shared platform. With few schools, fixed cost per school is high, so early prices must cover it or the first deployments should run lean (single VM, same container images) until more schools join.
5. **Add margin and a buffer** for result-day autoscaling and for schools that outgrow their plan.
6. **Compare with competitors** (existing school ERP and website vendors) and adjust; schools compare total yearly cost per student.

### 4.5 Billing rules
- Prices shown in INR for India; other currencies only if international schools are targeted later.
- GST invoices from the first payment.
- Online checkout, plus **manual activation** by the Platform Admin for bank-transfer or cheque buyers after confirmed payment.
- Yearly billing aligned to the academic year start; prorated first-year option.
- Plan limits (students, storage, SMS, modules) enforced server-side as feature flags.
- Refund policy and renewal terms stated on the pricing page and in the contract.

## 5. Users and roles

### 5.1 Platform level
| Role | Description |
|---|---|
| **Platform Admin** | Product owner/operator. Approves signups, manages plans, feature flags, billing, manual activation, suspension, and platform monitoring. Support access to a school's data only through an audited "impersonate for support" action. |

### 5.2 Pre-sale roles
| Role | Description |
|---|---|
| **Prospect (School Representative)** | Registers a school, runs the wizard, views the preview, pays. Has no access to real school functionality until payment. |

### 5.3 School level (all scoped to one school, available only when the school is ACTIVE)
| Role | Login | Description |
|---|---|---|
| **Visitor** | None | Public: prospective parents, alumni |
| **Applicant** | Email OTP (mobile OTP when SMS is enabled) | Parent applying for admission before enrollment; becomes the student account after admission |
| **Student account (family login)** | OTP to the family's registered contact (email at first; phone when SMS is enabled), or a school-issued username and password | One account per enrolled student, used by the student and the parents/guardians. There are no separate parent accounts. The registered contact belongs to the family and can be shared by siblings (a "choose student" step follows the OTP). For minors it should be a parent or guardian's own contact |
| **Teacher** | Password (+ optional 2FA) | Scoped to assigned class/section/subject |
| **School Admin sub-roles** | Password + 2FA | Principal, Exam Controller, Accountant, Office Clerk, Content Editor, School IT Admin |

### 5.4 Access matrix (school level, summary)

R = read, C = create, U = update, D = delete.

| Feature | Visitor | Applicant | Student account (family) | Teacher | Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| Public pages and notices | R | R | R | R | CRUD (Content Editor) |
| Admission form | – | CRU (own) | – | – | R, review (Office Clerk) |
| Marks/results | – | – | R (own) | CRU (own subject) | R, publish (Exam Controller) |
| Attendance | – | – | R (own) | CRU (own class) | R, correct |
| Fee dues and payment | – | App. fee only | R, pay | – | CRUD (Accountant) |
| Timetable | – | – | R | R (own) | CRUD |
| Assignments | – | – | R, submit | CRUD (own) | R |
| Leave request | – | – | Create | Approve (class teacher) | R |
| Change registered contact (email or phone) | – | – | – | – | School Admin only: OTP on the previous contact, or in-person recovery with two-person approval |
| Freeze a registered contact (lost phone or compromised email) | – | – | – | – | School Admin (any sub-role with the right) |
| User and role management | – | – | – | – | School IT Admin |
| Audit logs | – | – | – | – | School IT Admin / Principal |

### 5.5 Access rules
- **Ownership checks:** a student account reads only its own student's data; a teacher only their assigned classes. Enforced at service level, not only at the gateway.
- **Shared login:** because the student and the parents use the same account, anything visible to the student is visible to the family. Fee information is therefore not hidden from the student.
- **Results are published, not just saved:** marks stay draft until the Exam Controller publishes.
- **Marks and attendance changes are audited** (who, when, old value, new value). Teachers edit marks only inside a time window; later changes need approval.
- **Academic year rollover** keeps history; roles and class mappings change by year.

### 5.6 Login, sibling, and registered contact rules

The registered contact is an **email address** at first because no SMS provider is in place. The design keeps the channel open, so a phone number with SMS OTP can be enabled later, school by school, without redesign.

**Accounts and contacts**
1. **One account per student.** Each student has exactly one account, and the student and their parents/guardians use it together. No separate parent accounts exist.
2. **One registered contact per family, unique within a school.** Login is by OTP sent to that contact. One contact can be linked to several student accounts, which is how siblings work. Two different families can never hold the same contact in the same school.
3. **"Choose student" step.** After the OTP, a contact linked to one student goes straight in; a contact linked to several shows a list of the linked children. The family can switch between linked children without a new OTP. Each child's data stays separate, and a switch is only possible between accounts linked to the same contact.
4. **Linking is done by the school,** through bulk import, admission, or the office. If the same contact appears on several students, they are treated as siblings and listed for the admin to confirm. A configurable limit on children per contact (suggested default 6) catches typing mistakes.
5. **The registered contact should belong to a parent or guardian** for minors, so the person who consents and receives school information controls access. It should not be the child's own address.
6. **A contact is never shared across schools.** Each school is separate, so a family with children in two schools has two accounts there.
7. **Login channel is a per-school setting.** It is `EMAIL` at first. When SMS is available, a school can enable `PHONE`; existing families then switch with a normal contact change (OTP on the old contact, then OTP on the new one, as in rule 11). Guardian phone numbers already on the student record help prepare the switch.
8. **Long-lived sessions.** Family sessions last weeks, so families do not need a new OTP email at every visit. This keeps email volume and result-day load down. The duration is set per school.
9. **Fallback login.** For families without a usable email, the school can issue a username and password (printed slip, forced change at first login). Whether this is needed depends on how many families have email (open question 20).

**Changing the contact (still reachable)**
10. **Only a School Admin can change the contact,** never the student, a teacher, or platform staff.
11. **The change requires an OTP sent to the previous contact.** The new contact is also confirmed with an OTP before it becomes active.
12. **The change applies to all children linked to that contact.** An admin can instead move one child to a different contact (for example, separated parents), using the same checks.
13. **Every change is audited,** an alert goes to both the old and new contacts, all sessions are signed out, and requests expire quickly and are rate limited.

**Lost access (closed or forgotten email, lost phone, dead SIM)**
14. **Try the provider's own recovery first.** For email, the family recovers the account with their email provider. When the channel is `PHONE`, a duplicate SIM from the operator keeps the same number. The office tells families this first.
15. **Freeze on report.** If a phone or email account is lost, stolen, or compromised, any School Admin can freeze the contact straight away: login is blocked and all sessions end. No OTP is needed because this only reduces access. Unfreezing needs an OTP on that contact, or a completed recovery (rule 16).
16. **In-person recovery when the old contact cannot receive an OTP.** The guardian visits the school office with a photo ID. The first admin checks the person against the guardian details on the student record, records only the type of ID shown (no ID number or copy is stored), and enters the new contact. A **second, different admin** (Principal or School IT Admin) approves. The new contact is confirmed with an OTP before it becomes active. The same completion steps as rule 13 apply, and the old contact is removed from the account.
17. **No remote recovery in v1.** Nobody can reliably verify identity over a phone call or email. Video verification can be considered later.
18. **Abandoned or recycled contacts.** Operators reassign dead phone numbers, and email accounts can be closed or abandoned. To limit exposure, contacts are re-verified by OTP at academic year rollover, contacts not verified in the school's chosen period are flagged to the office, and messages carry minimal content (a prompt to log in, with no marks or fee amounts).

## 6. Core user journey: preview, pay, go live

1. **Register and verify:** school representative signs up with an email OTP (phone OTP when SMS is enabled).
2. **Wizard:** chooses modules, board and grading format, approximate size, plan, template, colors, and logo.
3. **Preview generated** from the saved configuration, rendered with **sample data** (never real data).
4. **Preview restrictions:** private expiring link, watermark and "Preview, not yet live" banner, `noindex`; no admin login, no real accounts, no data import, no domain connection, no public sharing, forms and payment buttons inactive.
5. **Pay:** online checkout, or request manual activation.
6. **Verified payment event triggers provisioning** (see section 8).
7. **Live:** subdomain active, first School Admin account created, welcome email with setup checklist sent.
8. **Setup:** school admin adds classes, sections, academic year, and bulk-imports students and staff.

**Rule:** nothing real (tenant, users, storage, database) is created before payment is verified. A preview is only a saved draft configuration plus a shared renderer.

## 7. Tenant lifecycle and access control

| Status | Meaning | Access |
|---|---|---|
| `DRAFT` | Registered, preview only | Private preview link only |
| `PENDING_PAYMENT` | Payment started, not confirmed | Preview only |
| `PROVISIONING` | Payment confirmed, setup running | None (short-lived) |
| `ACTIVE` | Paid and live | Full access per plan |
| `GRACE` | Renewal overdue (7-15 days, configurable) | Full access; warnings to school admin |
| `SUSPENDED` | Unpaid after grace | Public site shows a neutral page; admin sees only a renewal screen; **data kept** |
| `TERMINATED` | Cancelled or long unpaid | Data export window, then verified deletion |

| ID | Requirement | Priority |
|---|---|---|
| LC-1 | Gateway checks tenant status on every request (cached in Redis with short TTL, invalidated instantly on status change); services do not decide this themselves | P0 |
| LC-2 | Only a **verified payment webhook** (signature checked, idempotent) can move a tenant to PROVISIONING; the browser's claim of payment is never trusted | P0 |
| LC-3 | Plan entitlements (modules, limits) stored as feature flags and enforced server-side | P0 |
| LC-4 | No data deletion on non-payment until a long, documented window; export always offered before deletion | P0 |
| LC-5 | Early renewal reminders by email (and SMS when enabled) to multiple contacts before grace and suspension | P1 |
| LC-6 | Platform Admin can manually activate, extend, suspend, and restore a tenant, with an audit record | P0 |

## 8. Provisioning requirements

Provisioning is a workflow (saga) triggered by confirmed payment.

| Step | Action |
|---|---|
| 1 | Create the tenant record with plan and feature flags |
| 2 | Write chosen modules, grading scheme, and branding into tenant configuration |
| 3 | Seed default roles, classes, and starter pages |
| 4 | Create the first School Admin account and send credentials |
| 5 | Register the subdomain (wildcard DNS and wildcard certificate) |
| 6 | Premium only: create the dedicated database or deployment |
| 7 | Send the welcome email and setup checklist |

| ID | Requirement | Priority |
|---|---|---|
| PRV-1 | Idempotent: retries never create duplicate tenants or accounts | P0 |
| PRV-2 | Compensating actions or safe retry on failure; no half-created schools | P0 |
| PRV-3 | Provisioning status visible to the Platform Admin, with alerts on failure | P0 |
| PRV-4 | Shared-tier provisioning completes in seconds to minutes | P1 |
| PRV-5 | Premium dedicated stack created through infrastructure automation (semi-automated first) | P2 |
| PRV-6 | Custom domain connection: instructions, automatic DNS verification, automatic HTTPS | P1 |

## 9. Multi-tenancy requirements

| ID | Requirement |
|---|---|
| MT-1 | Every school is a tenant with a unique ID, subdomain (`school.platform.com`), and optional custom domain |
| MT-2 | Tenant resolved at the gateway from the host; carried as `tenantId` in the JWT, service calls, and events |
| MT-3 | Default isolation: shared schema with `tenant_id` on every table, enforced by Hibernate discriminator multitenancy, `tenant_id` first in every key and index, per-service least-privilege database users, and automated cross-tenant isolation tests (MySQL has no Row-Level Security) |
| MT-4 | Premium: dedicated database or full deployment using the same code and config-driven datasource |
| MT-5 | All cache keys prefixed with tenant ID; object storage paths prefixed per tenant |
| MT-6 | Per-tenant rate limits and connection quotas (noisy-neighbor protection) |
| MT-7 | A token from one school is rejected by any other school |
| MT-8 | Tenant onboarding is automated (section 8) |
| MT-9 | Offboarding: full data export and verified deletion on request or after the agreed window |
| MT-10 | Database portability: same MySQL major version locally and in the cloud, all schema changes through versioned migrations, connection settings from environment or secret store, TLS-ready connections, no reliance on local-only features, no cross-database joins between services |

### 9.1 Per-school configuration (data, not code)
- Branding: logo, colors, fonts, name, domain, homepage template
- Academic structure: classes, sections, terms/semesters, academic year dates
- Grading schemes (marks, grades, CGPA; CBSE, ICSE, state boards)
- Fee structure, late-fee rules, own payment gateway credentials
- Feature flags: online payments, assignments, SMS, family messaging
- Notification templates and sender names
- Visibility rules (for example, class rank shown on the student account or not)

## 10. Functional requirements

Priority: **P0** = needed for first school go-live, **P1** = soon after, **P2** = later. Items marked **(SS)** are needed for self-service launch.

### 10.1 Marketing site, signup, and wizard (SS)
| ID | Requirement | Priority |
|---|---|---|
| MKT-1 | Public marketing site: features, pricing, demo, contact | P1 |
| MKT-2 | Signup with email OTP verification (phone OTP when SMS is enabled) | P1 |
| MKT-3 | Wizard: modules, board and grading, size, plan, template, colors, logo | P1 |
| MKT-4 | Wizard saves progress as a draft; resumable | P1 |
| MKT-5 | Request custom work option creating a ticket and quote | P2 |
| MKT-6 | Anti-abuse: verification, rate limits, optional manual approval of new signups | P1 |
| MKT-7 | Pricing page: plan cards, Monthly/Yearly toggle with yearly saving badge, INR pricing, feature checklist, "Most popular" highlight, clear cancellation and data terms | P1 |
| MKT-8 | "Free" is shown as a free preview only; no free live plan | P1 |

### 10.2 Preview service (SS)
| ID | Requirement | Priority |
|---|---|---|
| PRE-1 | Preview renders from saved draft configuration with demo data; no per-draft database or storage | P1 |
| PRE-2 | Private, unguessable, expiring link (7-14 days), tied to the registered account | P1 |
| PRE-3 | Watermark and "Preview, not yet live" banner; `noindex` | P1 |
| PRE-4 | Real actions disabled: login, forms, payment, imports, sharing | P1 |
| PRE-5 | Scheduled cleanup of expired drafts | P1 |
| PRE-6 | Small, polished template library (3-5 templates at launch) | P1 |

### 10.3 Billing and subscription
| ID | Requirement | Priority |
|---|---|---|
| BIL-1 | Online checkout through a payment gateway for setup and subscription fees | P0 for self-serve, P1 otherwise |
| BIL-2 | Verified webhook handling with idempotency and reconciliation | P0 |
| BIL-3 | GST-compliant invoices and receipts | P0 |
| BIL-4 | Manual activation by Platform Admin for offline payments | P0 |
| BIL-5 | Renewal reminders, grace and suspension automation | P1 |
| BIL-6 | Plan upgrades and downgrades; plan limits enforced | P1 |
| BIL-7 | Refund handling per policy | P1 |
| BIL-8 | Monthly and yearly billing cycles with a yearly discount; yearly aligned to the academic year | P1 |
| BIL-9 | Student-count limit per plan with extra-student billing or upgrade prompt | P1 |
| BIL-10 | SMS quota per plan, with overage billed at cost plus margin | P1 |
| BIL-11 | One-time setup fee on the first invoice | P1 |

### 10.4 Platform administration
| ID | Requirement | Priority |
|---|---|---|
| PLT-1 | Create, activate, suspend, restore, and terminate schools | P0 |
| PLT-2 | Approve or reject signups | P1 |
| PLT-3 | Plans and feature flags per school | P0 |
| PLT-4 | Provisioning monitor with retry controls | P1 |
| PLT-5 | Usage and health dashboard per school | P1 |
| PLT-6 | Audited impersonation for support | P1 |

### 10.5 Public school website and CMS
| ID | Requirement | Priority |
|---|---|---|
| WEB-1 | Home, about, faculty, academic calendar, contact, gallery, events, notices | P0 |
| WEB-2 | School-managed CMS: Content Editor edits pages, notices, events, gallery | P0 |
| WEB-3 | Per-school theme and branding from templates | P0 |
| WEB-4 | Server-rendered public pages with per-school SEO metadata | P0 |
| WEB-5 | Gallery with photo consent handling for minors | P1 |
| WEB-6 | Public fee structure and admission information pages | P0 |
| WEB-7 | Custom domain with automatic HTTPS | P1 |

### 10.6 Identity and access
| ID | Requirement | Priority |
|---|---|---|
| AUTH-1 | OTP login for student accounts (family login) and applicants, by email at first and by phone when SMS is enabled; password plus optional 2FA for staff | P0 |
| AUTH-2 | JWT access tokens (short-lived) plus refresh tokens; role and tenant in claims | P0 |
| AUTH-3 | Role-based access control with admin sub-roles | P0 |
| AUTH-4 | One account per student; one registered contact (email at first) per family, unique within the school, which can link several sibling accounts; no separate parent accounts | P0 |
| AUTH-5 | Password reset, account lockout, session revocation | P0 |
| AUTH-6 | Ownership checks (student account to its own student record, teacher to assigned class) at service level | P0 |
| AUTH-7 | Only a School Admin can change a registered contact; the change applies to all children linked to it unless the admin moves one child to another contact | P0 |
| AUTH-8 | A contact change requires a valid OTP sent to the previous contact, and the new contact is confirmed by OTP before activation | P0 |
| AUTH-9 | Every contact change is audited; alerts go to the old and new contacts; change requests expire and are rate limited | P0 |
| AUTH-10 | In-person recovery for contacts that can no longer receive an OTP: ID check at the office, two different admins (initiator and approver), new contact confirmed by OTP, audited | P0 |
| AUTH-11 | "Choose student" step after OTP when the contact links several children, and switching between linked children without a new OTP | P0 |
| AUTH-12 | Freeze and unfreeze a registered contact: any School Admin can freeze at once; freezing ends all sessions for the linked accounts | P0 |
| AUTH-13 | Re-verify registered contacts by OTP at academic year rollover and flag contacts not verified in the school's chosen period | P1 |
| AUTH-14 | Configurable limit of children per contact; shared contacts at import or admission are listed for admin confirmation | P1 |
| AUTH-15 | Per-school login channel setting: `EMAIL` at first; `PHONE` (SMS OTP) can be enabled later without redesign, and existing families switch with a normal contact change | P0 (design), P2 (SMS build) |
| AUTH-16 | School-issued username and password for families without a usable email, with forced change at first login | P1, to confirm |
| AUTH-17 | Long-lived family sessions (duration set per school) so an OTP email is not needed at every visit | P1 |

### 10.7 Student and school records
| ID | Requirement | Priority |
|---|---|---|
| STU-1 | Student and teacher profiles; guardian contact details kept on the student record for school use (no separate guardian login) | P0 |
| STU-2 | Class, section, subject, and teacher-assignment management | P0 |
| STU-3 | Bulk import of students with guardian contact details (including guardian phone numbers for the school's own use) and the family's registered contact (email at first) (CSV/Excel); the same contact on several students is treated as siblings and listed for the admin to confirm; contacts shared by more children than the configured limit are rejected and reported | P0 |
| STU-4 | Academic year rollover and promotion | P1 |
| STU-5 | ID card generation | P2 |
| STU-6 | Paid data-migration service for schools moving from an old system | P2 |

### 10.8 Academics
| ID | Requirement | Priority |
|---|---|---|
| ACA-1 | Timetable management and viewing | P0 |
| ACA-2 | Daily attendance entry by teachers; view by the student account | P0 |
| ACA-3 | Exam definition, marks entry (draft), lock, and publish workflow | P0 |
| ACA-4 | Report card generation (PDF) in school-specific format | P0 |
| ACA-5 | Marks entry time window and approval flow for late corrections | P1 |
| ACA-6 | Assignments: teachers post, students view and submit | P1 |
| ACA-7 | Study material uploads | P1 |
| ACA-8 | Leave application from the student account, approval by class teacher | P1 |
| ACA-9 | Teacher-to-family messaging | P2 |

### 10.9 School fees and payments (the school's own fee collection)
| ID | Requirement | Priority |
|---|---|---|
| FEE-1 | Fee structures per class and category, with concessions | P0 |
| FEE-2 | Invoices and dues visible to the student account | P0 |
| FEE-3 | Online payment via the school's own gateway account, with idempotency | P0 (if enabled) |
| FEE-4 | Receipts (PDF) and payment history | P0 |
| FEE-5 | Reconciliation, refunds, and offline payment entry by Accountant | P1 |
| FEE-6 | Late-fee rules and reminders | P1 |
| FEE-7 | Payment status is never served from cache | P0 |
| FEE-8 | Gateway activation waits for the school's own KYC approval; site works without it | P0 |

### 10.10 Admission
| ID | Requirement | Priority |
|---|---|---|
| ADM-1 | Online application form with document upload | P1 |
| ADM-2 | Application fee payment | P1 |
| ADM-3 | Status tracking (submitted, review, interview, selected, rejected) | P1 |
| ADM-4 | Convert selected applicant into an enrolled student record and student account (registered contact carried over from the application; if the school already has that contact, the new student is linked to it as a sibling) | P1 |

### 10.11 Notifications
| ID | Requirement | Priority |
|---|---|---|
| NOT-1 | In-app notices and circulars targeted by class, section, or school | P0 |
| NOT-2 | Email delivery, fully asynchronous. SMS is added later through the same channel interface | P0 |
| NOT-3 | Triggered notifications by email: result published, fee due, absence. Messages name the child (siblings share a contact) and carry no marks or fee amounts | P1 |
| NOT-4 | WhatsApp or push notifications | P2 |

### 10.12 Reporting
| ID | Requirement | Priority |
|---|---|---|
| REP-1 | Principal dashboards: attendance, fee collection, result summaries | P1 |
| REP-2 | Exportable reports (Excel/PDF) from read replicas | P1 |
| REP-3 | Audit log viewer | P1 |

## 11. Operations, monitoring, and responsibilities

### 11.1 What is built and what is delivered

There are two systems, both built from Spring Boot microservices:

| System | What it is | Who uses it |
|---|---|---|
| **Platform (control plane)** | Marketing site, signup, wizard, preview, billing, provisioning, platform admin, monitoring | The platform owner and prospects |
| **School runtime (the delivered product)** | Each school's website and portal: attendance, results, fees, notices, CMS | The school, parents, students, teachers |

- Schools receive a **hosted service**, not code, servers, or microservices to manage.
- **Basic and Standard:** the school runs on the shared multi-tenant platform with logically isolated data.
- **Premium:** the same services deployed with a dedicated database or dedicated deployment.
- Source-code delivery or self-hosting on the school's own server is out of scope (see non-goals).

### 11.2 Portals

| Portal | Audience | Purpose |
|---|---|---|
| **School portal** | School admins, teachers, parents, students, visitors | The school's website plus the admin panel for managing its own isolated data |
| **Platform portal** | Platform Admin only | Tenants, plans, billing, provisioning, monitoring, support tools |
| **School customer area** | School admin (billing contact) | Invoices, current plan, usage against limits, incident status, support requests; shows only that school's account |

### 11.3 Responsibility split

| | **The school (tenant)** | **The platform owner** |
|---|---|---|
| **Data** | Owns and manages all of it: students, staff, marks, attendance, fees, content | Stores it securely, keeps it isolated, backs it up; does not browse it |
| **Access and users** | School admins create and manage their own users and roles | Creates the first admin only; stays out of day-to-day user management |
| **Website** | Edits content, notices, gallery, and branding within the template | Hosts, secures, and keeps it fast and online |
| **Software** | Uses it | Builds, updates, patches, and fixes bugs for all schools |
| **Infrastructure** | Does not touch it | Servers, database, cache, scaling, certificates, backups |
| **Health** | Reports problems | Monitors uptime, performance, errors, and backups; acts on alerts |
| **Billing** | Pays; sees plan and usage | Invoicing, renewals, plan limits, suspension rules |
| **Compliance** | Legal responsibility as data owner, including parental consent | Protects the data as processor under a data processing agreement, aligned with the DPDP Act |

Isolation is a two-way promise: a school admin sees only their own school, and the platform side does not see school data except through audited support access (11.6). Platform Admin and School Admin are separate roles with separate logins and mandatory 2FA for platform staff.

### 11.4 Onboarding emails and credential delivery

| ID | Requirement | Priority |
|---|---|---|
| ONB-1 | After payment is confirmed (status PROVISIONING), send a short "payment received, setting up your site" email | P0 |
| ONB-2 | Send the welcome email only when the tenant is ACTIVE (an SMS pointer is added when SMS is enabled) | P0 |
| ONB-3 | Welcome email contains: plan confirmation, invoice and receipt link, school website address, admin login address, admin username (verified email), a **single-use set-password link** expiring in 24-72 hours, a setup checklist, and support contact | P0 |
| ONB-4 | Emails **never** contain a plain-text password, database credentials, API keys, or server details | P0 |
| ONB-5 | First login forces the admin to set their own password and verify an email OTP; 2FA is offered | P0 |
| ONB-6 | The same access details also appear on the payment-success page and in the customer area, so a missing email does not block anyone | P0 |
| ONB-7 | The payer can name a separate **admin contact** at checkout; the Platform Admin can resend or change it with an audit record | P1 |
| ONB-8 | "Resend access link" flow, working only for the verified email (and phone, when enabled) | P0 |
| ONB-9 | Branded email templates, consistent sender, SPF/DKIM/DMARC configured, links only to platform domains; schools told that passwords are never requested by email | P0 |
| ONB-10 | Follow-up emails if setup stalls (for example, no students imported after 2-3 days) and reminders before pending steps expire | P1 |

### 11.5 Monitoring

The platform owner monitors the **health and performance** of every school's site, not the school's private data. Every metric, log, and trace carries a tenant ID so problems can be filtered by school.

| ID | Requirement | Priority |
|---|---|---|
| MON-1 | **Availability:** external uptime checks on each school's public site and login page | P0 |
| MON-2 | **Performance:** response times (p95) and error rates per school and per endpoint | P0 |
| MON-3 | **Capacity:** active users, DB connections, cache hit ratio, CPU and memory, queue lag | P0 |
| MON-4 | **Business events:** failed-login spikes, failed payments, failed notifications, provisioning errors | P1 |
| MON-5 | **Usage versus plan:** student count, storage, SMS used against quota | P1 |
| MON-6 | **Security signals:** unusual login patterns, rate-limit hits, suspicious admin actions | P1 |
| MON-7 | **Backups:** success of each backup, plus scheduled restore tests | P0 |
| MON-8 | **Certificates and domains:** expiry and DNS health for subdomains and custom domains | P0 |
| MON-9 | Central observability stack for all tenants (metrics, logs, traces) with platform-wide and per-school dashboards; dedicated Premium deployments report into the same stack | P0 |
| MON-10 | **Logging rule:** logs hold IDs and event types only; never names, phone numbers, email addresses, marks, OTPs, or tokens | P0 |
| MON-11 | Alerts go to the platform owner; a small set wakes someone up, the rest go to a daily summary | P0 |
| MON-12 | Log retention limits (for example, 14-30 days of detailed logs; aggregated metrics kept longer) | P1 |
| MON-13 | An external uptime check watches the monitoring system itself | P1 |
| MON-14 | Public status page with current health and incident history | P1 |
| MON-15 | Optional school-facing view of uptime, usage against plan, and recent incidents in the customer area | P2 |

### 11.6 Support access to school data

| ID | Requirement | Priority |
|---|---|---|
| SUP-1 | Support access to a school's data only through an audited "impersonate for support" action | P0 |
| SUP-2 | Started with a ticket reference and, where possible, the school admin's approval | P1 |
| SUP-3 | Time-limited; every action logged; the log is available to the school on request | P1 |
| SUP-4 | Platform staff use separate accounts with mandatory 2FA | P0 |
| SUP-5 | Support access terms stated in the contract and privacy terms | P0 |

### 11.7 Operational commitments

| ID | Requirement | Priority |
|---|---|---|
| OPS-1 | SLA per plan (for example, 99.5% for Basic and Standard, 99.9% for Premium) with a defined remedy such as service credit; promise only what is measured and achievable | P1 |
| OPS-2 | Support response hours per plan; on-call arrangement for result days stated honestly | P1 |
| OPS-3 | Onboarding asks schools for result dates and fee deadlines so capacity can be pre-scaled and caches pre-warmed | P1 |
| OPS-4 | Maintenance windows scheduled outside exam and result periods and announced in advance | P1 |
| OPS-5 | Incident communication templates (email and SMS to school contacts) and a short post-incident report for serious outages | P1 |

### 11.8 Data recovery and school mistakes

| ID | Requirement | Priority |
|---|---|---|
| REC-1 | Audit logs show who changed what, so school admins can trace mistakes | P0 |
| REC-2 | Soft delete with a recovery period for key records (students, marks, notices) | P1 |
| REC-3 | Documented restore process with stated limits (how far back, how often, cost for repeated requests) | P1 |
| REC-4 | Per-school backup and restore, so one school can be recovered without affecting others | P0 |

### 11.9 Release management

| ID | Requirement | Priority |
|---|---|---|
| REL-1 | Updates reach all shared-platform schools together; changes announced in advance | P1 |
| REL-2 | Gradual rollout (canary or staged) so a bad release does not hit every school at once | P1 |
| REL-3 | No releases during declared exam and result periods | P1 |
| REL-4 | Fast rollback for every release | P0 |

### 11.10 Contract and policy checklist

The service agreement and privacy terms should state:
- Data ownership (the school) and the platform's role as processor
- What is monitored and what is not (health and performance only)
- Support access rules and logging (11.6)
- SLA, support hours, response times, and remedies
- Backup frequency, restore limits, and recovery period
- Renewal, grace period, suspension, and cancellation terms
- Data export on request and deletion after the agreed window
- Parental consent responsibility (the school) and breach notification duties (both sides)
- Hosting location (India region)

## 12. Non-functional requirements

### 12.1 Performance and scale
- Design for **2-3k concurrent users per school** at peak, about 1,000 requests/second with headroom; normal load 200-400 concurrent per school.
- Peaks often cluster across schools (board result season): plan pooled capacity with autoscaling.
- Target latency: p95 under 500 ms for cached reads, under 1 s for others.
- Result publish: cache pre-warmed so the first wave does not hit the database.
- Traffic is about 90% reads; public content served mostly from CDN and cache.
- Preview traffic must not affect live schools (separate rendering path, rate limited).

### 12.2 Availability and resilience
- 99.5% uptime target for v1 (99.9% for Premium later).
- At least two instances of every critical service.
- Timeouts, retries (idempotent calls only), circuit breakers, bulkheads on remote calls.
- Graceful degradation: public site stays up if internal services struggle; cached results served if Academic is down.
- Daily automated backups per school with tested restore; point-in-time recovery for production DB.

### 12.3 Security and privacy
- HTTPS everywhere; WAF; input validation; secrets in a vault or orchestrator secret store.
- Encryption at rest for sensitive personal fields; data stored in an India region.
- Audit trail for marks, attendance, fees, tenant status changes, and admin actions.
- Compliance with India's **Digital Personal Data Protection Act 2023**: verifiable parental consent for minors, data minimization, breach process, and a data processing agreement with each school.
- Layered tenant isolation (central tenant context in the data layer, least-privilege database users per service, reviewed native SQL only, automated cross-tenant tests in CI); dedicated database for Premium for hard isolation.
- Payment webhooks verified by signature; payment credentials never stored in plain text.

### 12.4 Maintainability and operations
- Centralized logs with a correlation ID per request; metrics and tracing (Micrometer, Prometheus, Grafana, OpenTelemetry).
- Alerts on latency, error rate, queue lag, DB connections, and provisioning failures.
- CI/CD with automated tests; rolling or blue-green releases with rollback.
- Same container images deployable on a single VM (Docker Compose) or Kubernetes.

### 12.5 Usability
- Responsive, mobile-first UI; parents often use low-end phones and slow networks.
- Simple OTP login for the family account; minimal screens for teachers entering attendance and marks.
- Wizard usable by non-technical school staff.
- English first; Bengali and Hindi localization planned (P2).

## 13. Technical approach (summary)

### 13.1 Services (start coarse)
1. **API Gateway** (Spring Cloud Gateway): routing, tenant resolution, tenant-status enforcement, JWT validation, rate limiting, public-route caching
2. **Auth and Tenant service:** identity, roles, school config, plans, feature flags, tenant lifecycle (consider Keycloak for identity)
3. **Onboarding and Provisioning service:** signup, wizard drafts, preview renderer data, provisioning saga
4. **Billing service:** plans, checkout, webhooks, invoices, renewals
5. **Student and Academic service:** profiles, classes, timetable, attendance, exams, marks, results
6. **Fee and Payment service** (school fee collection)
7. **Content and Admission service:** CMS, notices, events, gallery, applications
8. **Notification service:** email now, SMS later, async fan-out

Early on, services 3 and 4 can live inside the Auth and Tenant deployment, and 5-7 can be merged as needed. Split further only when real load or team size justifies it. Each service owns its data; no cross-service database access.

### 13.2 Data and infrastructure
- **MySQL 8.4 LTS** (primary plus read replicas for Academic and Content): one database per service on a shared server at first, Flyway-managed migrations, `utf8mb4`, UTC times; developed locally, then moved to a managed cloud MySQL in an India region before the first live school if possible
- **Redis:** caching, rate limits, token blacklist, tenant-status cache
- **Message broker** (RabbitMQ, or Kafka if scale demands) with the outbox pattern
- **Object storage** (S3-compatible) for documents, report cards, images
- **CDN** in front of public content
- **Caching layers:** CDN, gateway cache, Redis (cache-aside, tenant-prefixed keys), local Caffeine for tiny static data
- Event-driven cache invalidation, always with TTL as a safety net
- Wildcard DNS and wildcard certificate for school subdomains; automated certificates for custom domains

### 13.3 Frontend
- Single tenant-aware web app (for example Next.js or React) with a theming engine reading per-tenant configuration; public pages server-rendered for SEO.
- Preview uses the same theming engine with demo data.

### 13.4 Key events
`SchoolRegistered`, `PreviewGenerated`, `PaymentConfirmed`, `TenantProvisioned`, `TenantStatusChanged`, `ResultPublished`, `FeePaid`, `AttendanceMarked`.

## 14. Success metrics

- New school live within minutes of confirmed payment (shared tiers); under one working day including setup help
- Preview-to-paid conversion rate (tracked from the first schools)
- Result-day: zero downtime and p95 latency within target at peak
- Cache hit ratio above 85% on public and result endpoints
- Zero cross-tenant data incidents
- Provisioning success rate above 99% without manual intervention
- Student-account activation (families who have logged in at least once) above 70% within the first term
- Infrastructure cost per unpaid preview close to zero

## 15. Release plan

| Phase | Scope |
|---|---|
| **0. Foundation** | Gateway, Auth and Tenant, tenant resolution and status enforcement, config, observability, CI/CD, theming skeleton |
| **1. MVP (first school, manual onboarding)** | Platform Admin creates the school by form or script; public site and CMS, profiles, timetable, attendance, marks and results, notices, fee dues and payments, bulk import; manual activation after payment |
| **2. Semi-automatic (next 3-5 schools)** | Platform Admin screen creates schools from a form; automated provisioning saga with manual approval; billing with webhooks and invoices; admission, assignments, leave, notification triggers, dashboards |
| **3. Self-service** | Marketing site, signup, wizard, preview service, online checkout, automatic provisioning on verified payment, grace/suspension automation, custom domains |
| **4. Scale** | Premium dedicated-stack automation, plan upgrades, localization, advanced reporting |
| **Continuous** | Load tests (k6/Gatling), result-day rehearsal, chaos tests, backup restore drills |

Phasing rationale: build the self-service wizard only after real schools show what they actually ask for; building it first means building it around guesses.

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Microservice complexity overwhelms a small team | Coarse services, strong observability, same images on one VM early on |
| Cross-tenant data leak | Central tenant context in the data layer, least-privilege DB users per service, tenant-prefixed cache keys, automated isolation tests, dedicated database for Premium |
| Result-day spike overwhelms the system | Cache pre-warming, request coalescing, autoscaling, pre-event load test |
| Every school demands custom design and features | Template-first policy; custom work is paid and scoped separately |
| Payment errors (double charge, mismatch) | Idempotency keys, webhook verification, reconciliation tooling |
| Fake signups and template scraping | Verification, rate limits, watermarked previews, optional manual approval |
| Suspending a school mid-exam causes real harm and complaints | Generous grace period, early reminders to several contacts, data never deleted on non-payment within a long window, terms in the contract |
| Compliance exposure with minors' data | DPDP-aligned consent, India hosting, data processing agreements, audit logs |
| Solo operator burnout and single point of failure | Automation, runbooks, managed DB and Redis where budget allows |
| Schools' payment gateway KYC delays | Site goes live first; gateway enables after approval |
| Families lose access to their registered email or phone, or contacts get recycled or abandoned | Provider recovery first, immediate freeze on report, in-person recovery with two-person approval, yearly re-verification, minimal message content |
| Email OTPs land in spam or hit a provider's daily send limit on result day | Authenticated sending domain (SPF, DKIM, DMARC), long-lived sessions, staged result-day logins, check free-tier limits, fallback username/password |
| Many families have no usable email address | Count families with email at the first school; school-issued username/password fallback; add SMS when a provider is available |

## 17. Assumptions

- First school: about 2,000 students (one account each, used by the student and parents), 50-100 staff.
- Responsive website only in v1; no native apps.
- Hybrid tenancy: shared schema with application-enforced `tenant_id` isolation by default; dedicated database for Premium.
- Database is MySQL (8.4 LTS target); the local server version is to be confirmed; the cloud database will be the same major version.
- Schools pick from a few templates; fully custom design is out of base scope.
- Preview is free and uses demo data only; there is no free live plan and live access requires payment.
- Plans are sized by included student count; yearly billing is the default.
- Online fee collection is a per-school feature flag.
- Hosting in an India cloud region.

## 18. Open questions

1. Exact prices per plan, setup fee, extra-student rate, and the monthly premium over yearly? (use the cost method in section 4.4)
2. Refund policy for cancellations shortly after payment?
3. Length of grace period and the data retention window after suspension or termination?
4. Will buyers accept shared infrastructure, or will most insist on dedicated setups?
5. Will schools accept template-based websites, or will most demand fully custom designs?
6. Siblings (resolved in v0.7): one contact can link several sibling accounts, with a "choose student" step. Still open: the default limit of children per contact (suggested 6).
7. Who publishes results, and can families see class rank or only the student's marks?
8. Which boards and grading formats must be supported first?
9. Should new signups be auto-approved, or manually reviewed at first?
10. Who handles hosting, support, and the SLA after delivery?
11. Support hours and on-call: who responds on result day, and what response times per plan are realistic?
12. Restore policy: how far back can a school's mistake be recovered, and is it free or charged?
13. Should schools get their own uptime and usage dashboard from the first release, or later?
14. Is school-admin approval required before platform staff can use support access, or is a ticket reference enough?
15. Unreachable old contact (resolved in v0.7): in-person recovery with two-person approval (section 5.6). Open points are 16 to 21 below.
16. Should there be a waiting period (for example 24 hours, with an alert to the old contact) between approval and activation of a recovered contact, or is immediate activation acceptable after the in-person check?
17. Which photo IDs does the office accept, and is recording only the ID type (suggested, for data minimization) enough, or must the school keep a copy?
18. How long can a contact go without re-verification before it is flagged (suggested: one academic year)?
19. Is the minimal message content rule acceptable to schools, given that some will want marks or fee amounts in messages?
20. What share of families at the first school have a working email address? This decides whether email OTP can be the main login or the school-issued username/password becomes the main path.
21. When SMS becomes available, which schools switch to phone login and when, and how is the SMS cost passed on (BIL-10)?

## 19. Next steps

1. Resolve the open questions, starting with pricing, grace period, and tenancy expectations.
2. Define service boundaries and the database schema (including `tenant_id`, tenant status, plan, and academic year).
3. Define event contracts between services, including the payment-to-provisioning flow.
4. Set up the foundation: repo structure, CI/CD, gateway, Auth and Tenant service.
5. Build the MVP vertical slice (attendance, marks, results) and load test it early.
