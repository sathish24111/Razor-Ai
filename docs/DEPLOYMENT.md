# RazorRecover AI — Production Deployment Guide

This guide outlines the production deployment procedure for **RazorRecover AI**.

---

## 1. Architecture Overview

- **Frontend**: React + Vite + Tailwind CSS (Deployable to Vercel / Netlify / AWS S3 + CloudFront)
- **Backend API**: Node.js + Express.js (Deployable to Render / Railway / Fly.io / AWS ECS)
- **Database**: Local/Managed MySQL 8.0 (AWS RDS / PlanetScale / Aiven / DigitalOcean Managed Databases)
- **ORM**: Prisma ORM v5.22.0
- **Payments**: Razorpay TEST MODE API
- **AI Telemetry**: OpenAI REST API (`gpt-4o-mini`)

---

## 2. Environment Variables Checklist

### Backend (`.env`)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="mysql://username:password@hostname:3306/razorrecover"
JWT_SECRET="your_production_secure_jwt_secret_key_2026"
CLIENT_URL="https://your-frontend.vercel.app"
CORS_ORIGIN="https://your-frontend.vercel.app"
PAYMENT_SIMULATION_MODE=true
OPENAI_MODEL="gpt-4o-mini"

# Razorpay TEST Credentials
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="xxxxxx"
RAZORPAY_WEBHOOK_SECRET="whsec_xxxxxx"

# OpenAI API Key
OPENAI_API_KEY="sk-proj-xxxxxx"
```

### Frontend (`.env.production`)
```env
VITE_API_URL="https://your-backend-api.onrender.com/api"
VITE_RAZORPAY_KEY_ID="rzp_test_xxxxxx"
```

---

## 3. Database Deployment & Migration

1. Create a MySQL 8.0 database instance.
2. Configure `DATABASE_URL` in backend environment settings.
3. Apply Prisma migrations to the production database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. (Optional) Seed initial merchant policies and products:
   ```bash
   npx prisma db seed
   ```

---

## 4. Backend Deployment (Render / Railway)

1. Connect backend repository branch to hosting platform.
2. Build Command:
   ```bash
   npm install && npx prisma generate
   ```
3. Start Command:
   ```bash
   npm run server
   ```
4. Set Environment Variables in deployment panel.
5. Verify `/api/health` and `/api/ready` endpoints return HTTP `200 OK` status.

---

## 5. Frontend Deployment (Vercel)

1. Connect React application root directory to Vercel.
2. Build Command:
   ```bash
   npm run build
   ```
3. Output Directory: `dist`
4. Set Environment Variable: `VITE_API_URL` pointing to live backend API.

---

## 6. Razorpay Webhook Configuration

1. Log in to Razorpay Dashboard (TEST Mode).
2. Go to **Settings** $\rightarrow$ **Webhooks** $\rightarrow$ **Add New Webhook**.
3. Set Webhook URL: `https://your-backend-api.onrender.com/api/webhooks`.
4. Secret: Set matching `RAZORPAY_WEBHOOK_SECRET`.
5. Active Events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`

---

## 7. Production Security Audit Verification

- ✅ JWT Authorization required on all protected endpoints.
- ✅ Sensitive data sanitizer strips API keys, passwords, and tokens from Audit Log metadata.
- ✅ Rate limiting enabled on authentication (`/api/auth/login`) and simulation endpoints.
- ✅ Helmet HTTP security headers enabled.
- ✅ Single Financial Authority: Policy Engine validates all actions before payment retries.
