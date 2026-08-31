# RazorRecover AI

> Autonomous AI-Powered Payment Recovery Platform with Deterministic Financial Guardrails & Real-Time Audit Telemetry.

---

## 1. Problem Statement
E-commerce merchants lose up to **15–25% of legitimate transaction revenue** to soft payment failures—such as 3DS OTP timeouts, temporary bank gateway errors, network blips, and soft balance limits. Generic automated retries risk card issuer blocklisting, customer fatigue, and uncoordinated duplicate charges.

## 2. Solution
**RazorRecover AI** provides an intelligent, policy-governed payment recovery orchestration platform. It analyzes raw failure telemetry using OpenAI LLMs, determines optimal recovery strategies (Smart Retry, 1-Click UPI Re-Checkout, Customer Reminder), validates actions against strict merchant financial policies, and executes recovery via Razorpay TEST Mode while logging an immutable audit trail.

---

## 3. Architecture & Core Principles

```
Payment Failure (Webhook / Sim)
            ↓
  RevenueRisk Logged
            ↓
  LLM Telemetry Diagnosis  (Analyst)
            ↓
  Policy Engine Check      (Final Financial Authority)
            ↓
┌───────────────────────────────────────┐
│           POLICY ENGINE               │
└───────────────────┬───────────────────┘
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
       ALLOWED          APPROVAL REQUIRED
          ↓                   ↓
  Autonomous Recovery     Merchant Review & Approval
  Agent (Orchestrator)        ↓
          ↓                Approve / Reject
  Razorpay TEST API           ↓
          ↓               Razorpay TEST API
  Revenue Recovered           ↓
          ↓               Revenue Recovered
  MySQL & Audit Log           ↓
                      MySQL & Audit Log
```

### Core Architecture Axioms:
- **AI = Analyst**: LLM diagnoses failure root cause and recommends actions. The LLM **NEVER** executes payments or overrides rules.
- **Policy Engine = Final Authority**: Single source of truth. Enforces merchant auto-recovery limits, retry caps, time windows, and permitted actions.
- **Recovery Agent = Orchestrator**: Executes policy-approved recovery actions atomically.
- **Merchant = Policy Owner**: Retains 100% control over recovery thresholds and approval workflows.

---

## 4. Key Features

1. **Multi-Tenant Merchant Isolation**: Complete JWT-based data isolation across payments, orders, risks, policy, audit, and analytics.
2. **LLM Payment Failure Diagnosis**: Evaluates soft vs hard failures using OpenAI REST API with deterministic fallback engine.
3. **Deterministic Policy Engine Guardrails**: Enforces `maxRetries` (2), `maxAutoRecoveryAmount` (₹10,000 ceiling), `recoveryWindowHours` (24h), and allowed recovery actions.
4. **Controlled Autonomous AI Recovery Agent**: Atomically executes Razorpay TEST retries or creates customer re-checkout links.
5. **Payment Failure Simulation Engine**: Controlled sandbox generating single and batch failure scenarios (`INSUFFICIENT_FUNDS`, `3DS_OTP_TIMEOUT`, `GATEWAY_ERROR`) without calling external payment APIs.
6. **Database-Derived Analytics Engine**: 100% database-computed metrics for revenue recovered, risk funnel conversion, failure reasons breakdown, and CSV export.
7. **SOC2-Ready Compliance Audit Trail**: Immutable audit logging with automatic sensitive credential sanitization (stripping passwords, JWTs, and API keys) and timestamp integrity verification.

---

## 5. Technology Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express.js, Helmet, Express-Rate-Limit
- **Database & ORM**: MySQL 8.0, Prisma ORM v5.22.0
- **Authentication**: JWT, bcrypt
- **Payment Execution**: Razorpay Node.js SDK (v2.9.8) — TEST MODE
- **AI Telemetry**: OpenAI API (`gpt-4o-mini`)

---

## 6. Quick Start & Local Setup

### Prerequisites
- Node.js v18+
- MySQL 8.0 local server running on port `3306`

### 1. Clone Repository & Install Dependencies
```bash
cd razorrecover-ai
npm install
```

### 2. Configure Database & Environment
Ensure local MySQL is running (`mysql://root:1234@localhost:3306/razorrecover`).
Verify `.env` configuration:
```env
PORT=5000
DATABASE_URL="mysql://root:1234@localhost:3306/razorrecover"
JWT_SECRET="razorrecover_super_secret_jwt_key_2026_production"
CLIENT_URL="http://localhost:5173"
PAYMENT_SIMULATION_MODE=true
OPENAI_MODEL="gpt-4o-mini"

RAZORPAY_KEY_ID="rzp_test_placeholder_key"
RAZORPAY_KEY_SECRET="rzp_test_placeholder_secret"
RAZORPAY_WEBHOOK_SECRET="whsec_placeholder_secret"
OPENAI_API_KEY="sk-placeholder_key"
```

### 3. Initialize & Seed Database
```bash
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

### 4. Run Backend & Frontend
```bash
# Terminal 1: Backend Server (http://localhost:5000)
npm run server

# Terminal 2: React Frontend (http://localhost:5173)
npm run dev
```

---

## 7. 5-Minute Hackathon Demo Script Walkthrough

### Step 1: Login & Dashboard (0:00 - 1:00)
1. Open `http://localhost:5173` and click **Login** (`admin@merchant.com` / `password123`).
2. Demonstrate Executive Summary Dashboard showing Revenue at Risk (₹74,990), Revenue Recovered, and Recovery Rate.

### Step 2: Payment Failure Simulation (1:00 - 2:00)
1. Navigate to **Simulation Center**.
2. Click **Run Single Simulation** (Simulates ₹4,999 OTP timeout failure).
3. Observe real-time 8-step execution stepper (`EVENT DETECTED` $\rightarrow$ `AI DIAGNOSIS` $\rightarrow$ `POLICY CHECK` $\rightarrow$ `RAZORPAY TEST PAYMENT` $\rightarrow$ `REVENUE RECOVERED`).

### Step 3: AI Diagnosis & Policy Safeguard (2:00 - 3:00)
1. Open **AI Decision Center**.
2. View AI telemetry diagnosis (91% confidence, recommended action: Customer Recheckout).
3. View Policy Engine verdict badge (`ALLOWED`).

### Step 4: High-Value Approval Workflow (3:00 - 4:00)
1. Navigate to **Simulation Center** and click **Generate Batch Scenarios** (generates ₹24,999 high-value failure).
2. Open **Recovery Event Details** for the ₹24,999 event.
3. Show Policy Engine Verdict: `⚠ EXCEEDS AUTO RECOVERY CEILING — MERCHANT APPROVAL REQUIRED`.
4. Click **Approve & Launch Recovery** to execute merchant manual approval.

### Step 5: Analytics & Audit Inspector (4:00 - 5:00)
1. Open **Analytics & Reports** to inspect the recovery conversion funnel and failure reasons pie chart. Click **Export Analytics CSV**.
2. Open **Compliance Audit Trail**, inspect a log line showing sanitized metadata, and verify `Integrity Verified: PASS`.

---

## 8. License & Credits
Built for Hackathon Demonstration by Google DeepMind Agentic AI pair programming system.
