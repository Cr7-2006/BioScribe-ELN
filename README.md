# 🧬 BioScribe ELN (Electronic Laboratory Notebook)

> High-integrity, version-controlled **Electronic Laboratory Notebook (ELN)** and research management platform engineered for biotech, pharma, and academic research teams. Adheres to **FDA 21 CFR Part 11** and **Good Laboratory Practice (GLP)** standards with cryptographically sealed revision histories, chemical/biological formulation calculators, structured observation loggers, and dual-authenticated electronic signatures.

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend REST API** | Node.js (v20+ / v22+ / v26), Express.js, TypeScript |
| **Database Layer** | PostgreSQL 16 (`pg` connection pool) with resilient local JSON/SQLite zero-config fallback |
| **Caching & Presence** | Redis 7 (`ioredis`) with resilient in-memory TTL caching |
| **Security & Compliance** | JWT, Bcrypt, SHA-256 Cryptographic Fingerprints, 21 CFR Part 11 Electronic Signatures |
| **Containerization** | Docker, Docker Compose, Multi-stage builds, Nginx reverse proxy |
| **VCS & CI/CD** | Git, GitHub Actions (`.github/workflows/ci.yml`) |

---

## 🏛️ Architecture Overview

```
                          ┌────────────────────────────────────────────────────────┐
                          │         React 18 + TypeScript + Vite Client            │
                          │   (Tailwind CSS, Diff Inspector, Stoichiometry, E-Sig) │
                          └───────────────────────────┬────────────────────────────┘
                                                      │ REST API (JSON / JWT)
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │            Node.js + Express.js REST API               │
                          │   (SHA-256 Hasher, Version Engine, 21 CFR Part 11)     │
                          └─────────────┬───────────────────────────┬──────────────┘
                                        │                           │
                                        ▼                           ▼
                         ┌─────────────────────────────┐   ┌────────────────────────┐
                         │        Redis 7 Cache        │   │     PostgreSQL 16      │
                         │ (Drafts & Real-time Session)│   │  (Relational & Audit)  │
                         └─────────────────────────────┘   └────────────────────────┘
```

---

## 🧪 Core Research & Compliance Features

### 1. Version-Controlled Laboratory Notebooks (`/api/experiments`)
- **Immutable Revision History**: Every protocol save or amendment produces a discrete version snapshot (`v1.0`, `v1.1`, `v2.0`).
- **Cryptographic Fingerprinting**: Each version snapshot is hashed with a tamper-evident **SHA-256** checksum over protocol steps, critical quality attributes, author identity, and timestamps.
- **Visual Revision Diff Inspector**: Side-by-side and unified diff comparison identifying added steps, removed steps, modified parameters (temperatures, durations), and textual changes.

### 2. Chemical & Biological Formulation Builder (`/api/formulations`)
- Reagent registry with CAS numbers, lot numbers, molecular weights, and GHS hazard pictograms.
- **Stoichiometry Calculator**: Live computation of molar concentrations ($mM$, $M$) and effective purity.
- **Dynamic Batch Scaling**: One-click recipe scaling (e.g. 100 mL to 5,000 mL) with automatic reagent recalculation.

### 3. Real-Time Observations & Time-Series Data Logger (`/api/experiments/:id/observations`)
- Structured logging for measurements, spectrophotometry/SPR readings, chromatography (HPLC), and environmental parameters.
- Out-of-specification anomaly flagging and timestamped operator notes.

### 4. 21 CFR Part 11 Compliant Electronic Signatures (`/api/approvals`)
- Multi-tier sign-off pipeline: `Draft` &rarr; `In Review` &rarr; `Peer Reviewed` &rarr; `QA Approved` / `Rejected`.
- **Dual-Factor Authentication Ceremony**: Requires password re-entry at the time of signature to verify identity.
- **Legal Intent Manifestation**: Captures explicit signature reasons ("Peer Review Verification", "Quality Assurance Release").
- **Cryptographic Digest**: Generates an immutable signature digest sealing the version hash with the signer's identity and timestamp. Once approved, the record is permanently locked against modifications.

### 5. Tamper-Evident Audit Trail (`/api/audit-trail`)
- Append-only regulatory ledger recording all creates, updates, version commits, electronic signatures, and exports.
- Every audit entry includes an independently verifiable SHA-256 checksum.

### 6. Official GLP Printable / PDF Export
- Generates clean, publication- and audit-ready experiment reports complete with protocol steps table, observation metrics, and certified electronic signature blocks.

---

## 🚀 Quickstart Guide

### Option A: Local Standalone Mode (Zero External Dependencies Required)

BioScribe features an automatic resilient fallback layer that allows you to run immediately without needing a local PostgreSQL or Redis server pre-installed!

#### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```
*The server will boot on `http://localhost:5000` and automatically seed initial research projects, formulations, and experiment records.*

#### 2. Start Frontend Client (in a new terminal)
```bash
cd client
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

### Option B: Docker Compose Multi-Container Deployment

Spin up the full containerized production stack (PostgreSQL 16, Redis 7, Express API, and Nginx-backed React frontend) with a single command:

```bash
docker compose up --build
```
* Access the BioScribe Application at: `http://localhost:80`
* Access the REST API at: `http://localhost:5000/api`

---

## 👥 Demo Scientific Accounts (1-Click Role Switcher)

The application includes an in-app role switcher in the top navigation bar to test review and sign-off ceremonies across different laboratory roles:

| Name | Role | Email | Default Password | Laboratory Function |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. Elena Vance** | Researcher (Author) | `elena.vance@bioscribe.io` | `Password123!` | Protocol Authoring & Data Logging |
| **Dr. Marcus Chen** | Reviewer (PI) | `marcus.chen@bioscribe.io` | `Password123!` | Peer Review Verification |
| **Sarah Jenkins, RAC** | QA Manager (Auditor) | `sarah.jenkins@bioscribe.io` | `Password123!` | 21 CFR Part 11 Regulatory Release |
| **Admin** | Administrator | `admin@bioscribe.io` | `Password123!` | System Configuration & Diagnostics |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT bearer token |
| `GET` | `/api/auth/me` | Fetch authenticated researcher profile |
| `GET` | `/api/auth/seed-accounts` | List demo accounts for rapid testing |
| `GET` | `/api/stats` | Dashboard telemetry, compliance metrics & counts |
| `GET` | `/api/projects` | List research studies and therapeutic areas |
| `POST` | `/api/projects` | Register new research project |
| `GET` | `/api/experiments` | Search and filter laboratory notebooks |
| `POST` | `/api/experiments` | Create new notebook entry with initial version 1.0 |
| `GET` | `/api/experiments/:id` | Get experiment details, versions, and observations |
| `POST` | `/api/experiments/:id/versions` | Commit new version revision with SHA-256 fingerprint |
| `GET` | `/api/experiments/:id/diff` | Compare protocol differences between two revisions |
| `GET` | `/api/experiments/:id/observations`| Retrieve structured observation log |
| `POST` | `/api/experiments/:id/observations`| Record new analytical data point / measurement |
| `DELETE`| `/api/observations/:id` | Remove observation (unapproved drafts only) |
| `GET` | `/api/formulations` | List chemical/biological formulation recipes |
| `POST` | `/api/formulations` | Create new formulation recipe |
| `POST` | `/api/formulations/calculate` | Compute stoichiometry and batch scaling |
| `GET` | `/api/approvals` | List approval requests & sign-off queue |
| `POST` | `/api/approvals/request` | Submit notebook version for review |
| `POST` | `/api/approvals/:id/sign` | Execute 21 CFR Part 11 Electronic Signature ceremony |
| `GET` | `/api/audit-trail` | Fetch immutable audit ledger with checksum validation |

---

## 🧪 Automated Testing

Execute the end-to-end verification test suite covering authentication, version commits, SHA-256 hashing, diffing, batch scaling, and electronic signature ceremonies:

```bash
cd server
npm test
```

---

## 🛡️ License

Proprietary Research & Development Platform. Designed for GLP and FDA 21 CFR Part 11 compliance.
