# BioScribe ELN - Native MERN Stack & MongoDB Deployment Guide

This guide details how to run and connect BioScribe ELN natively on Windows using Node.js and MongoDB (Local MongoDB instance or Cloud MongoDB Atlas) without Docker.

---

## 1. System Prerequisites

The following components are present and configured on this PC:
- **Node.js** (v20+ / v22+ / v26+) & **npm**
- **MongoDB Database**:
  - **Option A (Local)**: Local MongoDB service running on `mongodb://localhost:27017` (Active process `mongod`)
  - **Option B (Cloud)**: MongoDB Atlas connection string (`mongodb+srv://...`)
- **MongoDB Compass**: Visual database GUI for inspecting collections and documents.

---

## 2. Quick Start: Running the MERN Stack Manually

### Step 1: Verify Local MongoDB Service
MongoDB is already actively running on port 27017 on this machine. You can verify it in PowerShell:
```powershell
Get-Process -Name "*mongo*"
```

### Step 2: Start the Backend Server (Express + Mongoose)
Open a terminal prompt and run:
```powershell
cd server
npm run dev
```
- The backend initializes on **`http://localhost:5001`**.
- It connects to `mongodb://localhost:27017/bioscribe_eln`.
- All 8 collections (`users`, `projects`, `experiments`, `experimentversions`, `observations`, `formulations`, `approvals`, `auditlogs`) are auto-loaded.

### Step 3: Start the Frontend Client (React 18 + Vite)
Open a second terminal prompt and run:
```powershell
cd client
npm run dev
```
- The frontend will open at **`http://localhost:5173`**.
- Vite reverse-proxies `/api` requests directly to `http://localhost:5001`.

---

## 3. Database Inspection: MongoDB Compass

You can inspect all laboratory data directly in **MongoDB Compass**:
1. Open **MongoDB Compass** on your PC (`C:\Users\KAMALESH\AppData\Local\MongoDBCompass\MongoDBCompass.exe`).
2. Enter the connection URI:
   ```text
   mongodb://localhost:27017
   ```
3. Click **Connect**.
4. Select the database **`bioscribe_eln`** to view all collections:
   - `experiments`: Experiment protocols and hypothesis records
   - `experimentversions`: Immutable protocol version history with SHA-256 fingerprints
   - `formulations`: Chemical recipes, CAS numbers, lot numbers, stoichiometry
   - `observations`: Experimental measurements and telemetry records
   - `approvals`: Multi-tier electronic sign-off and review logs
   - `auditlogs`: Cryptographic tamper-evident audit ledger
   - `users`: Laboratory accounts (Researcher, Reviewer, QA Manager, Administrator)
   - `projects`: High-level research programs

---

## 4. Switching to Cloud MongoDB Atlas (Optional)

If you wish to switch from local MongoDB to a cloud MongoDB Atlas cluster:

1. Open your [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
2. Under **Deployment** -> **Database**, click **Connect** on your cluster.
3. Select **Drivers** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/bioscribe_eln?retryWrites=true&w=majority
   ```
4. Open [`server/.env`](file:///c:/Users/KAMALESH/Desktop/fsd/server/.env) and update `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/bioscribe_eln?retryWrites=true&w=majority
   ```
5. Restart the backend server (`npm run dev`).
6. (Optional) Run initial seed migration to Atlas:
   ```powershell
   cd server
   npm run seed
   ```

---

## 5. Newly Implemented Full-Stack Features

1. **Certified PDF Report Export**:
   - Official laboratory run sheets & experiment records featuring cryptographic SHA-256 seals, 2D QR validation codes, reviewer electronic signatures, and tamper-proof verification stamps.
   - Available via the "Certified PDF" button in Experiment Details and Master Formulations.

2. **2D Barcode / QR Code Scanning for Reagents**:
   - QR code and barcode scanning simulator with chemical lot lookup, storage temperature checks, and automatic expiration date verification.
   - Printable 2D container stickers with GHS chemical safety badges.
   - Available from the top navigation bar and Formulations page.

3. **Advanced Full-Text Search (`Ctrl+K`)**:
   - Multi-collection backend search across experiments, formulations, chemical CAS numbers, and audit logs.
   - Universal modal with keyboard shortcuts (`Ctrl+K` / `Cmd+K`, Arrow keys, Enter).

4. **Native MERN Architecture**:
   - Operates natively on Windows with Node.js, Express, React, and MongoDB without any container overhead.
