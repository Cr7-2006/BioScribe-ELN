# 🧬 BioScribe ELN (Electronic Laboratory Notebook)

> High-integrity, version-controlled **Electronic Laboratory Notebook (ELN)** and research management platform engineered for biotech, chemical formulation, and academic research teams. Features cryptographically sealed revision histories, chemical/biological formulation calculators, 2D barcode reagent inventory scanners, advanced full-text search, structured observation loggers, and authenticated electronic signatures.

---

## 🛠️ Technology Stack (MERN Development)

| Layer | Technologies & Tools |
| :--- | :--- |
| **Architecture** | **MERN Stack** (MongoDB, Express.js, React, Node.js) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, jsPDF |
| **Backend REST API** | Node.js (v20+ / v22+ / v26), Express.js, TypeScript |
| **Database Layer** | MongoDB 7.0 (Mongoose ODM schemas & models) / MongoDB Atlas |
| **State & Protocol Caching**| Native Node.js State & Draft Store |
| **Security & Verification** | JWT, Bcrypt, SHA-256 Cryptographic Seals, Electronic Signatures |
| **Database Tooling** | MongoDB Compass GUI |

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
                          │   (SHA-256 Hasher, Version Engine, Search, Auth)       │
                          └───────────────────────────┬────────────────────────────┘
                                                      │
                                                      ▼
                                           ┌────────────────────────┐
                                           │      MongoDB 7.0       │
                                           │ (Mongoose Collections) │
                                           └────────────────────────┘
```

---

## 🧪 Core Research & System Features

### 1. Version-Controlled Laboratory Notebooks (`/api/experiments`)
- **Immutable Revision History**: Every protocol save or amendment produces a discrete version snapshot (`v1.0`, `v1.1`, `v2.0`).
- **Cryptographic Fingerprinting**: Each version snapshot is hashed with a tamper-evident **SHA-256** checksum over protocol steps, critical quality attributes, author identity, and timestamps.
- **Visual Revision Diff Inspector**: Side-by-side and unified diff comparison identifying added steps, removed steps, modified parameters (temperatures, durations), and textual changes.

### 2. Certified PDF Report Export
- **Cryptographic Verification Seal**: Embeds a tamper-proof verification stamp and 2D QR validation code linked to the document's SHA-256 hash.
- **Publication-Grade Run Sheets**: Generates official laboratory run sheets including sequential protocol steps, analytical observation logs, formulation stoichiometry tables, and reviewer electronic signatures.

### 3. 2D Barcode & QR Code Scanning for Reagents
- **Container Verification**: Scans chemical lots to verify CAS numbers, storage temperatures, and expiration dates.
- **Expiry Protection**: Color-coded safety status flags expired or expiring chemicals before they can be used in formulations.
- **Printable 2D QR Labels**: Generates standardized container stickers with GHS chemical safety badges.
- **1-Click Auto-Population**: Directly imports scanned reagent parameters into formulations.

### 4. Advanced Full-Text Search (`Ctrl+K`)
- **Unified Global Search**: Searches across experiments, protocol versions, formulations, chemical CAS numbers, and audit logs.
- **Keyboard Shortcut**: Instant modal activated anywhere using `Ctrl+K` or `Cmd+K` with categorized filter pills and direct navigation.

### 5. Chemical & Biological Formulation Builder (`/api/formulations`)
- Reagent registry with CAS numbers, lot numbers, molecular weights, and GHS hazard classifications.
- **Stoichiometry Calculator**: Live computation of molar concentrations ($mM$, $M$) and effective purity.
- **Dynamic Batch Scaling**: One-click recipe scaling (e.g. 100 mL to 5,000 mL) with automatic reagent recalculation.

### 6. Electronic Signature Attestation (`/api/approvals`)
- Multi-tier sign-off pipeline: `Draft` &rarr; `In Review` &rarr; `Peer Reviewed` &rarr; `QA Approved` / `Rejected`.
- **Identity Re-authentication**: Requires credential verification at time of signature ceremony.
- **Legal Attestation Reason**: Captures explicit signature intent ("Peer Review Verification", "Quality Assurance Release").
- **Cryptographic Digest**: Generates an immutable signature digest sealing the version hash with the signer's identity and timestamp.

### 7. Tamper-Evident Audit Trail (`/api/audit-trail`)
- Append-only ledger recording all creates, updates, version commits, electronic signatures, and exports.
- Every audit entry includes an independently verifiable SHA-256 checksum.

---

## 🚀 Quickstart Guide (Running on this PC)

Running BioScribe ELN requires Node.js and MongoDB (no Docker needed):

#### 1. Start Backend Server (Express + MongoDB)
```powershell
cd server
npm run dev
```
*The server boots on `http://localhost:5001`, connects to MongoDB on `mongodb://localhost:27017/bioscribe_eln`, and loads existing research projects, formulations, and experiment records.*

#### 2. Start Frontend Client (React + Vite)
In a new terminal window:
```powershell
cd client
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🍃 MongoDB Compass GUI Integration

You can view and inspect the live database documents using **MongoDB Compass**:

1. Launch **MongoDB Compass** (`C:\Users\KAMALESH\AppData\Local\MongoDBCompass\MongoDBCompass.exe`).
2. Paste the connection string:
   ```text
   mongodb://localhost:27017
   ```
3. Click **Connect**.
4. In the databases list, open **`bioscribe_eln`** to view all live collections:
   - **`users`**: Researcher, reviewer, QA, and administrator profiles
   - **`projects`**: High-level therapeutic and biotechnology research projects
   - **`experiments`**: Active laboratory notebook experiment records
   - **`experimentversions`**: Protocol revision snapshots with SHA-256 hashes
   - **`observations`**: Structured experimental measurements and readings
   - **`formulations`**: Chemical recipes, CAS numbers, and stoichiometry
   - **`approvals`**: Electronic signature ceremony records
   - **`auditlogs`**: Tamper-evident audit ledger with checksum validation

---

## 👥 Demo Scientific Accounts

| Name | Role | Email | Default Password | Laboratory Function |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. Elena Vance** | Researcher (Author) | `elena.vance@bioscribe.io` | `Password123!` | Protocol Authoring & Data Logging |
| **Dr. Marcus Chen** | Reviewer (PI) | `marcus.chen@bioscribe.io` | `Password123!` | Peer Review Verification |
| **Sarah Jenkins** | QA Manager (Auditor) | `sarah.jenkins@bioscribe.io` | `Password123!` | Formal Quality Assurance Release |
| **Admin** | Administrator | `admin@bioscribe.io` | `Password123!` | User Access & System Controls |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT bearer token |
| `GET` | `/api/auth/me` | Fetch authenticated researcher profile |
| `GET` | `/api/auth/seed-accounts` | List demo accounts for rapid testing |
| `GET` | `/api/stats` | Dashboard telemetry, verification metrics & counts |
| `GET` | `/api/search` | Global full-text search across experiments, formulations, CAS#, audit logs |
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
| `POST` | `/api/approvals/:id/sign` | Execute Electronic Signature ceremony |
| `GET` | `/api/audit-trail` | Fetch immutable audit ledger with checksum validation |
