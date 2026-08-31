# RazorRecover AI — REST API Documentation

This document describes all API endpoints exposed by the RazorRecover AI backend server (`http://localhost:5000/api`).

---

## 1. Authentication & Multi-Tenancy

### `POST /api/auth/register`
- **Auth**: None
- **Body**: `{ "name": "Merchant Name", "email": "admin@merchant.com", "password": "secure_password", "businessName": "Acme Store" }`
- **Response**: `{ "success": true, "data": { "token": "JWT_TOKEN", "merchant": {...} } }`

### `POST /api/auth/login`
- **Auth**: None (Rate limited: 15 req/15 min)
- **Body**: `{ "email": "admin@merchant.com", "password": "secure_password" }`
- **Response**: `{ "success": true, "data": { "token": "JWT_TOKEN", "merchant": {...} } }`

### `GET /api/auth/me`
- **Auth**: `Bearer <JWT>`
- **Response**: `{ "success": true, "data": { "merchant": {...} } }`

---

## 2. Payments & Razorpay Integration

### `POST /api/payments/razorpay/order`
- **Auth**: `Bearer <JWT>`
- **Body**: `{ "amount": 4999, "currency": "INR", "customerId": "CUST_ID" }`
- **Response**: `{ "success": true, "data": { "orderId": "ORD-1024", "razorpayOrderId": "order_xxx", "amount": 499900, "key": "rzp_test_xxx" } }`

### `POST /api/payments/razorpay/verify`
- **Auth**: `Bearer <JWT>`
- **Body**: `{ "razorpay_order_id": "order_xxx", "razorpay_payment_id": "pay_xxx", "razorpay_signature": "hmac_signature" }`
- **Response**: `{ "success": true, "message": "Payment verified successfully!" }`

### `POST /api/webhooks`
- **Auth**: Razorpay Signature Header (`X-Razorpay-Signature`)
- **Body**: Raw Razorpay Webhook Event (`payment.captured`, `payment.failed`, `order.paid`)
- **Response**: `{ "status": "ok" }`

---

## 3. AI Telemetry & Diagnosis

### `POST /api/ai/analyze/:riskId`
- **Auth**: `Bearer <JWT>`
- **Response**:
```json
{
  "success": true,
  "data": {
    "diagnosis": "insufficient_funds",
    "riskLevel": "medium",
    "recommendedAction": "customer_recheckout",
    "confidence": 0.91,
    "requiresCustomerAction": true,
    "requiresMerchantApproval": false,
    "recoverability": "medium",
    "explanation": "Customer card declined due to soft balance limit."
  }
}
```

---

## 4. Controlled Autonomous Recovery Agent & Policy Engine

### `POST /api/recovery/agent/execute`
- **Auth**: `Bearer <JWT>`
- **Body**: `{ "riskId": "EVT-1024", "actionType": "retry_payment" }`
- **Response**: `{ "success": true, "status": "recovered", "message": "Successfully recovered ₹4,999!" }`

### `POST /api/recovery/agent/scan`
- **Auth**: `Bearer <JWT>`
- **Response**: `{ "success": true, "data": { "scannedCount": 5, "processedCount": 5, "recoveredCount": 3, "blockedCount": 2 } }`

### `POST /api/recovery/:riskId/approve`
- **Auth**: `Bearer <JWT>`
- **Response**: `{ "success": true, "status": "recovered", "message": "Merchant approved recovery execution." }`

### `POST /api/recovery/:riskId/stop`
- **Auth**: `Bearer <JWT>`
- **Response**: `{ "success": true, "message": "Automatic recovery stopped successfully." }`

---

## 5. Merchant Policy Management

### `GET /api/policies`
- **Auth**: `Bearer <JWT>`
- **Response**: Returns current merchant financial safeguard rules (`maxRetries`, `maxAutoRecoveryAmount`, `highValueThreshold`, `recoveryWindowHours`, `automaticRecoveryEnabled`, `allowedActions`).

### `PUT /api/policies`
- **Auth**: `Bearer <JWT>`
- **Body**: `{ "maxRetries": 2, "maxAutoRecoveryAmount": 10000, "highValueThreshold": 10000, "recoveryWindowHours": 24, "automaticRecoveryEnabled": true, "allowedActions": ["retry_payment", "customer_recheckout", "send_reminder", "escalate", "stop"] }`
- **Response**: `{ "success": true, "data": updatedPolicy }`

---

## 6. Simulation & Analytics

### `POST /api/simulation/payment`
- **Auth**: `Bearer <JWT>`
- **Body**: `{ "amount": 4999, "currency": "INR", "failureReason": "INSUFFICIENT_FUNDS" }`
- **Response**: `{ "success": true, "riskId": "...", "status": "recoverable" }`

### `POST /api/simulation/batch`
- **Auth**: `Bearer <JWT>`
- **Body**: `{ "count": 10 }`
- **Response**: `{ "success": true, "created": 10, "recoverable": 10 }`

### `GET /api/analytics/overview`
- **Auth**: `Bearer <JWT>`
- **Response**: Total revenue, recovered revenue, at-risk revenue, lost revenue, recovery rate percentage.

### `GET /api/analytics/export`
- **Auth**: `Bearer <JWT>`
- **Response**: CSV file download (`razorrecover_analytics_<timestamp>.csv`)

---

## 7. Audit & Compliance

### `GET /api/audit`
- **Auth**: `Bearer <JWT>`
- **Params**: `?eventType=POLICY_UPDATE&search=Order`
- **Response**: Paginated list of sanitized audit log entries.

### `GET /api/audit/verify`
- **Auth**: `Bearer <JWT>`
- **Response**: `{ "success": true, "data": { "verified": true, "totalRecords": 45, "integrityStatus": "PASS" } }`

### `GET /api/audit/export`
- **Auth**: `Bearer <JWT>`
- **Response**: CSV file download (`razorrecover_audit_<timestamp>.csv`)

---

## 8. System Health & Readiness

### `GET /api/health`
- **Auth**: None
- **Response**: `{ "status": "ok", "service": "RazorRecover AI", "version": "v2.4.0", "database": "MySQL (Prisma ORM)", "razorpayMode": "TEST_MODE" }`

### `GET /api/ready`
- **Auth**: None
- **Response**: `{ "status": "ready", "database": "connected" }`
