import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RazorRecover AI database seed...');

  // 1. Clean existing database
  await prisma.auditLog.deleteMany();
  await prisma.recoveryAction.deleteMany();
  await prisma.aIDecision.deleteMany();
  await prisma.revenueRisk.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchantPolicy.deleteMany();
  await prisma.merchant.deleteMany();

  // 2. Create Demo Merchant
  const hashedPassword = await bcrypt.hash('password123', 10);
  const merchant = await prisma.merchant.create({
    data: {
      businessName: 'TechGear Store',
      email: 'admin@merchant.com',
      passwordHash: hashedPassword,
      website: 'https://techgear.io',
      category: 'Consumer Electronics & Hardware',
      currency: 'INR',
    },
  });
  console.log(`✅ Created Merchant: ${merchant.businessName} (${merchant.email})`);

  // 3. Create Merchant Policy
  const policy = await prisma.merchantPolicy.create({
    data: {
      merchantId: merchant.id,
      maxRetries: 2,
      maxAutoRecoveryAmount: 10000,
      highValueThreshold: 10000,
      requireCustomerApproval: true,
      requireMerchantApproval: true,
      recoveryWindowHours: 24,
      automaticRecoveryEnabled: true,
      allowedActions: ["retry_payment", "send_reminder", "customer_recheckout", "escalate", "stop"],
    },
  });
  console.log(`✅ Created Merchant Policy guardrails`);

  // 4. Create 20 Customers
  const customerNames = [
    { name: 'Arjun Kumar', email: 'arjun.k@example.com', phone: '+91 98765 43210' },
    { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98123 45678' },
    { name: 'Rahul Raj', email: 'rahul.raj@example.com', phone: '+91 99000 11223' },
    { name: 'Divya S', email: 'divya.s@example.com', phone: '+91 97777 88899' },
    { name: 'Karthik M', email: 'karthik.m@example.com', phone: '+91 98888 77766' },
    { name: 'Ananya R', email: 'ananya.r@example.com', phone: '+91 96666 55544' },
    { name: 'Vignesh Kumar', email: 'vignesh.k@example.com', phone: '+91 95555 44433' },
    { name: 'Sanjay P', email: 'sanjay.p@example.com', phone: '+91 94444 33322' },
    { name: 'Sneha Patel', email: 'sneha.p@example.com', phone: '+91 93333 22211' },
    { name: 'Rajesh Verma', email: 'rajesh.verma@example.com', phone: '+91 92222 11100' },
    { name: 'Aarav Mehta', email: 'aarav.m@example.com', phone: '+91 91111 00099' },
    { name: 'Neha Gupta', email: 'neha.g@example.com', phone: '+91 90000 99988' },
    { name: 'Rohan Joshi', email: 'rohan.j@example.com', phone: '+91 98989 89898' },
    { name: 'Meera Nair', email: 'meera.n@example.com', phone: '+91 97979 79797' },
    { name: 'Amit Shah', email: 'amit.shah@example.com', phone: '+91 96969 69696' },
    { name: 'Pooja Reddy', email: 'pooja.r@example.com', phone: '+91 95959 59595' },
    { name: 'Aditya Bhat', email: 'aditya.b@example.com', phone: '+91 94949 49494' },
    { name: 'Kavya Iyer', email: 'kavya.i@example.com', phone: '+91 93939 39393' },
    { name: 'Siddharth Rao', email: 'siddharth.r@example.com', phone: '+91 92929 29292' },
    { name: 'Tanvi Deshmukh', email: 'tanvi.d@example.com', phone: '+91 91919 19191' },
  ];

  const customers = [];
  for (const c of customerNames) {
    const created = await prisma.customer.create({
      data: {
        merchantId: merchant.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalOrders: Math.floor(2 + Math.random() * 12),
        totalSpent: Math.floor(5000 + Math.random() * 95000),
        successfulPayments: Math.floor(2 + Math.random() * 10),
        failedPayments: Math.floor(1 + Math.random() * 3),
        recoveryAttempts: Math.floor(1 + Math.random() * 2),
        recoveredAmount: Math.floor(2000 + Math.random() * 15000),
      },
    });
    customers.push(created);
  }
  console.log(`✅ Created 20 Customers`);

  // 5. Create 20 Products
  const productList = [
    { name: 'Sony WH-1000XM5 Wireless Headphones', price: 4999, category: 'Audio' },
    { name: 'Apple Watch SE 40mm', price: 14999, category: 'Wearables' },
    { name: 'Logitech MX Master 3S', price: 2499, category: 'Accessories' },
    { name: 'Dell UltraSharp 27" 4K Monitor', price: 32000, category: 'Displays' },
    { name: 'Ergonomic Memory Foam Cushion', price: 1850, category: 'Furniture' },
    { name: 'Mechanical RGB Keyboard', price: 8999, category: 'Accessories' },
    { name: 'USB-C Docking Station 11-in-1', price: 6499, category: 'Hardware' },
    { name: 'Wireless Gaming Mouse', price: 3499, category: 'Accessories' },
    { name: 'Noise Cancelling Earbuds Pro', price: 9999, category: 'Audio' },
    { name: '4K HDR Webcam with Dual Mic', price: 7999, category: 'Hardware' },
    { name: 'Portable NVMe SSD 1TB', price: 11499, category: 'Storage' },
    { name: 'Smart LED Desk Lamp', price: 2999, category: 'Lighting' },
    { name: 'Dual Monitor Stand Riser', price: 1999, category: 'Furniture' },
    { name: 'Vertical Ergonomic Mouse', price: 2799, category: 'Accessories' },
    { name: 'Wireless Mechanical Numpad', price: 1499, category: 'Accessories' },
    { name: 'Waterproof Desk Mat XL', price: 999, category: 'Accessories' },
    { name: 'GaN Fast Charger 65W', price: 1999, category: 'Power' },
    { name: 'Braided USB-C Cable 3-Pack', price: 699, category: 'Power' },
    { name: 'Laptop Cooling Pad RGB', price: 1299, category: 'Accessories' },
    { name: 'Bluetooth Conference Speaker', price: 5999, category: 'Audio' },
  ];

  const products = [];
  for (const p of productList) {
    const created = await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: p.name,
        description: `Premium ${p.name} for high performance productivity and gaming.`,
        price: p.price,
        category: p.category,
        active: true,
      },
    });
    products.push(created);
  }
  console.log(`✅ Created 20 Products`);

  // 6. Create 50 Orders, Payments, Revenue Risks, AI Decisions, Actions & Audits
  const failureReasons = [
    '3DS OTP Timeout',
    'Insufficient Funds',
    'Acquiring Bank Gateway Timeout',
    'Card Limit Exceeded',
    'Checkout Abandoned after payment error',
  ];

  for (let i = 1; i <= 50; i++) {
    const customer = customers[i % customers.length];
    const product = products[i % products.length];
    const isFailed = i <= 30; // First 30 are failed/revenue-at-risk events
    const isRecovered = i <= 18; // 18 are successfully recovered

    const orderStatus = isRecovered ? 'recovered' : isFailed ? 'failed' : 'paid';

    const order = await prisma.order.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        amount: product.price,
        currency: 'INR',
        status: orderStatus,
        razorpayOrderId: `order_rzp_${Math.floor(100000 + Math.random() * 900000)}`,
      },
    });

    const paymentStatus = isRecovered ? 'success' : isFailed ? 'failed' : 'success';
    const failureReason = isFailed ? failureReasons[i % failureReasons.length] : null;

    const payment = await prisma.payment.create({
      data: {
        merchantId: merchant.id,
        orderId: order.id,
        customerId: customer.id,
        amount: product.price,
        currency: 'INR',
        razorpayPaymentId: `pay_rzp_${Math.floor(100000 + Math.random() * 900000)}`,
        status: paymentStatus,
        failureReason: failureReason,
        attemptNumber: isRecovered ? 2 : 1,
      },
    });

    if (isFailed) {
      const riskLevel = product.price > 10000 ? 'high' : i % 2 === 0 ? 'medium' : 'low';
      const riskStatus = isRecovered ? 'recovered' : i % 3 === 0 ? 'escalated' : 'recoverable';
      const recoveredAmount = isRecovered ? product.price : 0;

      const risk = await prisma.revenueRisk.create({
        data: {
          merchantId: merchant.id,
          orderId: order.id,
          customerId: customer.id,
          paymentId: payment.id,
          amount: product.price,
          reason: failureReason || 'Payment Failure',
          riskLevel: riskLevel,
          status: riskStatus,
          eligibleForRecovery: true,
          recoveryAttempts: isRecovered ? 1 : i % 2,
          recoveredAmount: recoveredAmount,
        },
      });

      // Create AI Decision with normalized confidence 0.91
      await prisma.aIDecision.create({
        data: {
          merchantId: merchant.id,
          revenueRiskId: risk.id,
          diagnosis: failureReason || 'Transient payment failure',
          riskLevel: riskLevel,
          recommendedAction: product.price > 10000 ? 'Send Payment Reminder with UPI' : 'Retry Payment',
          confidence: Number((0.75 + (i % 20) * 0.01).toFixed(2)),
          requiresCustomerApproval: true,
          requiresMerchantApproval: product.price > 10000,
          explanation: `Customer ${customer.name} has strong purchase history. Transaction amount ₹${product.price.toLocaleString()} is evaluated against policy limits.`,
        },
      });

      // Create Recovery Action
      await prisma.recoveryAction.create({
        data: {
          merchantId: merchant.id,
          revenueRiskId: risk.id,
          actionType: product.price > 10000 ? 'send_reminder' : 'retry_payment',
          amount: product.price,
          attemptNumber: 1,
          status: isRecovered ? 'success' : 'pending',
          result: isRecovered ? 'Payment successfully recovered via Razorpay Test API' : 'Queued for execution',
          approvedBy: 'AI Agent',
        },
      });

      // Create Audit Log Entry
      await prisma.auditLog.create({
        data: {
          merchantId: merchant.id,
          eventType: isRecovered ? 'RECOVERY_SUCCESS' : 'REVENUE_RISK_CREATED',
          entityId: risk.id,
          action: isRecovered ? 'Razorpay Test Payment Recovered' : 'Revenue Risk Detected',
          reason: failureReason,
          amount: product.price,
          policyResult: product.price > 10000 ? 'Approval Required' : 'Allowed',
          actor: isRecovered ? 'Customer' : 'AI Agent',
          status: 'Completed',
          metadata: {
            orderId: order.id,
            customerName: customer.name,
            productName: product.name,
          },
        },
      });
    }
  }

  console.log(`✅ Created 50 Orders, Payments, Revenue Risks, AI Decisions & Audit Logs`);
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
