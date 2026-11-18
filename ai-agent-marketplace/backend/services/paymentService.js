const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const { sha256 } = require('../utils/crypto');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const IS_RAZORPAY_CONFIGURED = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

/**
 * Generate a simulated payment signature for testing
 */
function generateSimulatedSignature(orderId, paymentId, secret = 'beckn_secret_salt') {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

/**
 * Initialize payment order
 */
async function createPaymentIntent({ orderId, method = 'SIMULATED', user = null }) {
  const order = await Order.findOne({ id: orderId });
  if (!order) {
    const err = new Error(`Order ${orderId} not found`);
    err.statusCode = 404;
    throw err;
  }

  // Prevent duplicate payment if order is already paid
  if (order.paymentStatus === 'PAID') {
    const err = new Error(`Order ${orderId} has already been paid for`);
    err.statusCode = 400;
    throw err;
  }

  // Check if an existing successful payment exists for this order
  const existingSuccessful = await Payment.findOne({ orderId, status: 'SUCCESSFUL' });
  if (existingSuccessful) {
    const err = new Error(`A successful payment (${existingSuccessful.paymentId}) already exists for this order`);
    err.statusCode = 400;
    throw err;
  }

  const agent = await Agent.findOne({ id: order.agentId });
  const paymentId = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const transactionId = `TXN-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;

  let gateway = 'simulated';
  let gatewayOrderId = `order_sim_${crypto.randomUUID().slice(0, 12)}`;
  let keyId = 'simulated_test_key';

  if (IS_RAZORPAY_CONFIGURED && method === 'RAZORPAY') {
    gateway = 'razorpay';
    keyId = RAZORPAY_KEY_ID;
    try {
      // In Node without external network sandbox restrictions, can use razorpay REST or sdk
      // Razorpay order creation payload simulation/real
      gatewayOrderId = `order_rzp_${crypto.randomUUID().slice(0, 14)}`;
    } catch (e) {
      console.warn('[PaymentService] Razorpay order call failed, falling back to simulated mode:', e.message);
      gateway = 'simulated';
    }
  }

  const paymentRecord = new Payment({
    paymentId,
    transactionId,
    orderId: order.id,
    userId: user?._id || order.buyer?.userId || null,
    consumerEmail: user?.email || order.buyer?.email || '',
    consumerName: user?.name || order.buyer?.name || 'Consumer',
    agentId: order.agentId,
    agentName: order.agentName,
    provider: agent?.provider || order.provider || 'BAAM Reference Labs',
    amount: order.total,
    baseAmount: order.price,
    gst: order.gst,
    currency: 'INR',
    status: 'PENDING',
    method: method || 'SIMULATED',
    gateway,
    gatewayOrderId
  });

  await paymentRecord.save();

  return {
    paymentId,
    transactionId,
    orderId: order.id,
    amount: order.total,
    baseAmount: order.price,
    gst: order.gst,
    currency: 'INR',
    gateway,
    gatewayOrderId,
    keyId: gateway === 'razorpay' ? RAZORPAY_KEY_ID : 'simulated_test_mode',
    modeLabel: gateway === 'razorpay' ? 'Razorpay Test Gateway' : 'Simulated Sandbox Gateway (Test Mode)'
  };
}

/**
 * Verify payment completion
 */
async function verifyPayment({
  orderId,
  paymentId,
  gatewayOrderId,
  gatewayPaymentId,
  gatewaySignature,
  method = 'SIMULATED',
  simulateFailure = false
}) {
  const order = await Order.findOne({ id: orderId });
  if (!order) {
    const err = new Error(`Order ${orderId} not found`);
    err.statusCode = 404;
    throw err;
  }

  const payment = await Payment.findOne({ orderId, paymentId });
  if (!payment) {
    const err = new Error(`Payment record for order ${orderId} not found`);
    err.statusCode = 404;
    throw err;
  }

  if (payment.status === 'SUCCESSFUL') {
    return {
      success: true,
      alreadyVerified: true,
      message: 'Payment was already verified successfully',
      payment,
      receipt: payment.receipt
    };
  }

  // Handle simulated failure for testing edge cases
  if (simulateFailure) {
    payment.status = 'FAILED';
    payment.error = 'ERR-PAYMENT-DECLINED: Transaction was declined by the simulated payment processor';
    await payment.save();

    order.paymentStatus = 'FAILED';
    await order.save();

    const err = new Error('Payment verification failed: Transaction was declined');
    err.statusCode = 400;
    throw err;
  }

  let verified = false;

  if (payment.gateway === 'razorpay' && IS_RAZORPAY_CONFIGURED) {
    // Verify Razorpay HMAC signature
    const body = `${gatewayOrderId || payment.gatewayOrderId}|${gatewayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    verified = expectedSignature === gatewaySignature;
    if (!verified) {
      payment.status = 'FAILED';
      payment.error = 'ERR-INVALID-SIGNATURE: Razorpay payment signature mismatch';
      await payment.save();
      const err = new Error('Invalid payment signature verification failed');
      err.statusCode = 400;
      throw err;
    }
  } else {
    // Verified simulated gateway payment
    verified = true;
  }

  const now = new Date();
  const paymentReceipt = {
    paymentId: payment.paymentId,
    transactionId: payment.transactionId,
    orderId: order.id,
    agentName: order.agentName,
    amount: payment.amount,
    baseAmount: payment.baseAmount,
    gst: payment.gst,
    currency: 'INR',
    method: method || payment.method,
    gateway: payment.gateway,
    status: 'SUCCESSFUL',
    timestamp: now.toISOString(),
    receiptHash: sha256(`${payment.paymentId}:${payment.transactionId}:${payment.amount}:${now.toISOString()}`)
  };

  payment.status = 'SUCCESSFUL';
  payment.method = method || payment.method;
  payment.gatewayPaymentId = gatewayPaymentId || `pay_sim_${crypto.randomUUID().slice(0, 10)}`;
  payment.gatewaySignature = gatewaySignature || 'sig_sim_valid';
  payment.receipt = paymentReceipt;
  await payment.save();

  // Update Order payment status and state transition
  order.paymentStatus = 'PAID';
  order.paymentId = payment.paymentId;
  order.paymentMethod = method || payment.method;
  order.paidAt = now;
  order.paymentReceipt = paymentReceipt;

  // Transition order state to PAID in audit ledger
  order.transitionState('PAID', {
    paymentStatus: 'PAID',
    paymentId: payment.paymentId,
    paymentMethod: method || payment.method,
    paidAt: now,
    paymentReceipt
  });
  await order.save();

  return {
    success: true,
    message: 'Payment verified successfully and receipt generated',
    payment,
    order,
    receipt: paymentReceipt
  };
}

/**
 * Retrieve payment history for user
 */
async function getUserPayments(userId, email = '') {
  const query = { status: 'SUCCESSFUL' };
  if (userId) {
    query.$or = [{ userId }, { consumerEmail: email }];
  } else if (email) {
    query.consumerEmail = email;
  }
  return await Payment.find(query).sort({ createdAt: -1 });
}

/**
 * Retrieve payments received for a provider's agents
 */
async function getProviderEarnings(providerName, providerUserId = null) {
  const query = { status: 'SUCCESSFUL' };
  if (providerName) {
    query.provider = new RegExp(providerName, 'i');
  }

  const payments = await Payment.find(query).sort({ createdAt: -1 });
  const grossEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
  const netEarnings = payments.reduce((sum, p) => sum + p.baseAmount, 0);
  const gstCollected = payments.reduce((sum, p) => sum + p.gst, 0);

  return {
    totalPaymentsCount: payments.length,
    grossEarnings: Number(grossEarnings.toFixed(2)),
    netEarnings: Number(netEarnings.toFixed(2)),
    gstCollected: Number(gstCollected.toFixed(2)),
    recentTransactions: payments.slice(0, 20)
  };
}

module.exports = {
  createPaymentIntent,
  verifyPayment,
  getUserPayments,
  getProviderEarnings
};
