import { createSimulatedPayment, createBatchSimulation, isSimulationModeEnabled } from '../services/simulationService.js';

export async function handleSimulatePayment(req, res, next) {
  try {
    if (!isSimulationModeEnabled()) {
      return res.status(403).json({
        success: false,
        message: 'Payment simulation mode is currently disabled.',
      });
    }

    const merchantId = req.merchant.id;
    const { amount, currency, failureReason, customerId } = req.body;

    const result = await createSimulatedPayment({
      merchantId,
      amount: amount || 4999,
      currency: currency || 'INR',
      failureReason: failureReason || 'INSUFFICIENT_FUNDS',
      customerId,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleSimulateBatch(req, res, next) {
  try {
    if (!isSimulationModeEnabled()) {
      return res.status(403).json({
        success: false,
        message: 'Payment simulation mode is currently disabled.',
      });
    }

    const merchantId = req.merchant.id;
    const { count } = req.body;

    const result = await createBatchSimulation({
      merchantId,
      count: count || 10,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function runSimulation(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const result = await createSimulatedPayment({
      merchantId,
      amount: 4999,
      currency: 'INR',
      failureReason: '3DS_OTP_TIMEOUT',
    });

    res.json({
      success: true,
      data: {
        ...result,
        totalEvents: 50,
        totalRevenueAtRisk: 125000,
        eligibleEvents: 45,
        recoveryAttempts: 30,
        successfulRecoveries: 22,
        failedRecoveries: 8,
        revenueRecovered: 88000,
        recoveryRate: 73.3,
      },
    });
  } catch (error) {
    next(error);
  }
}
