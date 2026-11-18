const Order = require('../models/Order');
const Agent = require('../models/Agent');
const orchestrator = require('../orchestrator');
const { computeStateHash, generateOrderId, generateConsentToken, generateTransactionId } = require('../utils/crypto');
const { getOrderLedger } = require('../services/auditService');

/**
 * @desc    Get all orders
 * @route   GET /api/orders
 * @access  Public
 */
async function getOrders(req, res, next) {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get single order with verified audit ledger
 * @route   GET /api/orders/:id
 * @access  Public
 */
async function getOrder(req, res, next) {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const ledger = await getOrderLedger(order.id);
    res.status(200).json({
      success: true,
      data: order,
      ledger
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Create new initialized order (FR-3.3 Consent Gate & Genesis hash)
 * @route   POST /api/orders
 * @access  Public
 */
async function createOrder(req, res, next) {
  try {
    const { agentId, task, buyer, consents, transactionId } = req.body;

    const agent = await Agent.findOne({ id: agentId });
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    if (agent.status === 'SUSPENDED' || agent.status === 'MAINTENANCE') {
      return res.status(400).json({
        success: false,
        error: `Agent is ${agent.status.toLowerCase()} and cannot be hired`
      });
    }

    // Consent Gate verification (FR-3.3)
    if (!consents || !consents.data || !consents.exec || !consents.audit) {
      return res.status(400).json({
        success: false,
        error: 'ERR-CONSENT-REQUIRED: All three DPI consent artifacts (data, exec, audit) must be granted'
      });
    }

    const orderId = req.body.id || generateOrderId();
    const txnId = transactionId || generateTransactionId();
    const consentToken = req.body.consentToken || generateConsentToken(buyer?.email || 'buyer');

    const gst = Number((agent.price * 0.18).toFixed(2));
    const total = Number((agent.price + gst).toFixed(2));
    const nowIso = new Date().toISOString();
    const genesisHash = computeStateHash('GENESIS', 'INITIALIZED', nowIso, orderId);

    const order = new Order({
      id: orderId,
      transactionId: txnId,
      agentId: agent.id,
      agentName: agent.name,
      price: agent.price,
      gst,
      total,
      task: task || '',
      buyer: buyer || { name: '', email: '' },
      consentToken,
      consents,
      state: 'INITIALIZED',
      history: [{ state: 'INITIALIZED', ts: nowIso, hash: genesisHash }]
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order initialized and consent token issued',
      data: order
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Transition order state with chained hash
 * @route   PATCH /api/orders/:id/transition
 * @access  Public
 */
async function transitionOrder(req, res, next) {
  try {
    const { state, extra } = req.body;
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.transitionState(state, extra || {});
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order transitioned to ${state}`,
      data: order
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Execute task for an order through orchestrator
 * @route   POST /api/orders/:id/execute
 * @access  Public
 */
async function executeOrder(req, res, next) {
  try {
    const { payload, forceTimeout } = req.body;
    const orderId = req.params.id;

    const result = await orchestrator.executeTask(orderId, payload, { forceTimeout });
    res.status(200).json({
      success: true,
      message: 'Task executed successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get consumer dashboard orders and summary stats
 * @route   GET /api/orders/consumer
 * @access  Public / Consumer
 */
async function getConsumerOrders(req, res, next) {
  try {
    const email = req.user?.email || req.query.email || '';
    const userId = req.user?._id || req.query.userId || null;

    let query = {};
    if (userId || email) {
      const orClauses = [];
      if (userId) orClauses.push({ 'buyer.userId': userId });
      if (email) orClauses.push({ 'buyer.email': email });
      query = { $or: orClauses };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.state === 'COMPLETED').length;
    const pendingOrders = orders.filter((o) => ['INITIALIZED', 'PAID', 'CONFIRMED', 'QUEUED', 'PROCESSING'].includes(o.state)).length;
    const totalSpent = orders.filter((o) => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.total, 0);

    // Get unique recently used agents
    const recentAgentIds = [...new Set(orders.map((o) => o.agentId))].slice(0, 5);
    const recentAgents = await Agent.find({ id: { $in: recentAgentIds } });

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalSpent: Number(totalSpent.toFixed(2))
      },
      recentAgents,
      orders
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get provider dashboard analytics and received orders
 * @route   GET /api/orders/provider
 * @access  Public / Provider
 */
async function getProviderOrders(req, res, next) {
  try {
    const providerName = req.query.provider || req.user?.organization || 'BAAM Reference Labs';
    const providerUserId = req.user?._id || null;

    // Find all agents by this provider
    const agentQuery = providerUserId
      ? { $or: [{ providerUser: providerUserId }, { provider: new RegExp(providerName, 'i') }] }
      : { provider: new RegExp(providerName, 'i') };

    const myAgents = await Agent.find(agentQuery);
    const agentIds = myAgents.map((a) => a.id);

    // Find orders for these agents
    const orders = await Order.find({ agentId: { $in: agentIds } }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const completedExecutions = orders.filter((o) => o.state === 'COMPLETED').length;
    const failedExecutions = orders.filter((o) => ['FAILED', 'TIMED_OUT'].includes(o.state)).length;

    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
    const grossEarnings = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const netEarnings = paidOrders.reduce((sum, o) => sum + o.price, 0);
    const gstCollected = paidOrders.reduce((sum, o) => sum + o.gst, 0);

    const activeAgentsCount = myAgents.filter((a) => a.status === 'ACTIVE').length;

    res.status(200).json({
      success: true,
      provider: providerName,
      stats: {
        totalAgents: myAgents.length,
        activeAgents: activeAgentsCount,
        totalOrdersReceived: totalOrders,
        completedExecutions,
        failedExecutions,
        grossEarnings: Number(grossEarnings.toFixed(2)),
        netEarnings: Number(netEarnings.toFixed(2)),
        gstCollected: Number(gstCollected.toFixed(2))
      },
      agents: myAgents,
      orders
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  transitionOrder,
  executeOrder,
  getConsumerOrders,
  getProviderOrders
};
