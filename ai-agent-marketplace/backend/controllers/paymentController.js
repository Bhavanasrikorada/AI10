const {
  createPaymentIntent,
  verifyPayment: verifyPaymentService,
  getUserPayments,
  getProviderEarnings
} = require('../services/paymentService');
const Payment = require('../models/Payment');

/**
 * @desc    Initialize payment order / intent
 * @route   POST /api/payments/create-order
 * @access  Public / Optional Auth
 */
async function createOrder(req, res, next) {
  try {
    const { orderId, method } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const result = await createPaymentIntent({
      orderId,
      method,
      user: req.user || null
    });

    res.status(200).json({
      success: true,
      message: 'Payment order initialized',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Verify payment completion
 * @route   POST /api/payments/verify
 * @access  Public / Optional Auth
 */
async function verifyPayment(req, res, next) {
  try {
    const {
      orderId,
      paymentId,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      method,
      simulateFailure
    } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        error: 'orderId and paymentId are required for payment verification'
      });
    }

    const result = await verifyPaymentService({
      orderId,
      paymentId,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      method,
      simulateFailure: Boolean(simulateFailure)
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get user payment history
 * @route   GET /api/payments/history
 * @access  Private / Optional Auth
 */
async function getHistory(req, res, next) {
  try {
    const userId = req.user?._id || req.query.userId || null;
    const email = req.user?.email || req.query.email || '';

    const history = await getUserPayments(userId, email);
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get payment for specific order
 * @route   GET /api/payments/order/:orderId
 * @access  Public
 */
async function getByOrder(req, res, next) {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'No payment record found for this order' });
    }
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get provider earnings summary
 * @route   GET /api/payments/provider-earnings
 * @access  Public / Provider
 */
async function getEarnings(req, res, next) {
  try {
    const providerName = req.query.provider || req.user?.organization || 'BAAM Reference Labs';
    const earnings = await getProviderEarnings(providerName, req.user?._id);
    res.status(200).json({
      success: true,
      data: earnings
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  getHistory,
  getByOrder,
  getEarnings
};
