# 🎓 SikhshyaMitra (शिक्षा मित्र)
> **A Modern, Secure, High-Performance Multi-Tenant School Management Platform**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📖 Overview

**SikhshyaMitra** is a multi-tenant school ERP and academic operating system designed for Indian K-12 education (CBSE, ICSE, State Boards). Built with a distributed microservice architecture, it delivers institutional verification, low-latency API routing, automated academic management, and enterprise-grade security.

---

## 🏛️ Architecture & System Modules

```
                    Internet / DNS
                          │
                   ┌──────▼──────┐
                   │ Cloudflare  │ (CDN & SSL)
                   └──────┬──────┘
                          │
                ┌─────────▼─────────┐
                │  school-gateway   │ :8080 (Spring Cloud Gateway)
                │  • Bloom Filter   │ (Rejects invalid hostnames in µs)
                │  • Caffeine Cache │ (Fast tenant resolution)
                │  • JWT Validation │ (Downstream security headers)
                └─────────┬─────────┘
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  school-auth  │ │school-academic│ │school-frontend│
│     :8081     │ │     :8082     │ │     :5173     │
│ • Google OAuth│ │ • Standards   │ │ • React + Vite│
│ • UDISE / Docs│ │ • Sections    │ │ • Modern UI   │
│ • Token Rotate│ │ • Subjects    │ │ • Google Sign │
│ • Rate Limiter│ │ • Year setup  │ │ • Admin Dash  │
└───────┬───────┘ └───────┬───────┘ └───────────────┘
        │                 │
        └────────┬────────┘
                 ▼
       ┌───────────────────┐
       │   MySQL 8.4 DBs   │
       │ sp_auth, academic │
       └───────────────────┘
```

### 🧩 Services
- **`school-gateway`** (:8080) — High-throughput reverse proxy with Guava Bloom Filters for sub-microsecond invalid subdomain rejection and strict security headers (`CSP`, `HSTS`, `X-Frame-Options`).
- **`school-auth`** (:8081) — Multi-tenant authentication, Google OAuth 2.0 ID-token verification, UDISE code validation, anti-impersonation Levenshtein checks, SHA-256 refresh token rotation, and in-memory rate limiting with Bucket4j.
- **`school-academic`** (:8082) — Academic years, standards (grades), sections, and subjects isolated per tenant.
- **`school-frontend`** (:5173) — Modern, glassmorphic UI built with React 19, Tailwind CSS, Lucide icons, Google OAuth integration, and dynamic school verification banners.
- **`school-fee` / `school-notification` / `school-content` / `school-platform`** — Future microservice modules scaffolded for fees, communications, school public portals, and super-admin document review.

---

## 🛡️ Key Security & Architecture Innovations

1. **Anti-Impersonation & Fake School Prevention**:
   - Schools register under `PENDING_VERIFICATION` status.
   - Levenshtein distance matching prevents copycat domains or names.
   - Principals with general email domains (`@gmail.com`, `@yahoo.in`) get temporary `TRIAL` access until official documents (UDISE registration, recognition certificate) are uploaded and verified.
2. **Hardened Authentication**:
   - Zero hardcoded production secrets (`${JWT_SECRET}`, `${GOOGLE_CLIENT_ID}` loaded from environment).
   - Refresh token rotation (SHA-256 hashed).
   - In-memory rate limiting on authentication endpoints to defend against brute-force attacks.
3. **Query Optimization & LLD**:
   - Bloom filter in Gateway rejects nonexistent tenant subdomains before hitting the database.
   - Logical multi-tenant sharding (`tenant_id` leading composite indexes).
   - Caffeine caching for sub-millisecond tenant resolution.

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Java 21 JDK
- Node.js 18+ and npm

### 1. Run with Docker Compose
```bash
docker-compose up -d
```
This spins up:
- MySQL 8.4 container pre-initialized with all isolated databases (`sp_auth`, `sp_academic`, etc.)
- Gateway (:8080), Auth (:8081), and Academic (:8082) services

### 2. Run Frontend
```bash
cd school-frontend
cp .env.example .env
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License
Distributed under the MIT License.
