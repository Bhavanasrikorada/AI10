const { createContext, validateContext } = require('../beckn/context');
const { createAck, createNack } = require('../beckn/dispatcher');
const { buildBecknCatalog } = require('../beckn/catalogBuilder');
const {
  validateSearchMessage,
  validateSelectMessage,
  validateInitMessage,
  validateConfirmMessage,
  validateStatusMessage,
  validateRatingMessage
} = require('../beckn/schema');
const { searchAgents, getAgentById } = require('../services/agentService');
const { addRating } = require('../services/trustService');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const orchestrator = require('../orchestrator');
const {
  generateOrderId,
  generateConsentToken,
  computeStateHash
} = require('../utils/crypto');

/**
 * @desc    Beckn /search endpoint
 * @route   POST /beckn/search
 */
async function search(req, res, next) {
  try {
    const { context, message } = req.body;
    const ctxVal = validateContext(context, 'search');
    if (!ctxVal.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-CONTEXT', ctxVal.error));
    }

    const { filters } = validateSearchMessage(message);
    const agents = await searchAgents(filters);
    const catalog = buildBecknCatalog(agents);

    const onSearchContext = createContext('on_search', context);

    // Return Beckn compliant ACK alongside on_search message
    res.status(200).json({
      context: onSearchContext,
      message: {
        ack: { status: 'ACK' },
        catalog
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Beckn /select endpoint
 * @route   POST /beckn/select
 */
async function select(req, res, next) {
  try {
    const { context, message } = req.body;
    const ctxVal = validateContext(context, 'select');
    if (!ctxVal.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-CONTEXT', ctxVal.error));
    }

    const val = validateSelectMessage(message);
    if (!val.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-MESSAGE', val.error));
    }

    const agent = await getAgentById(val.itemId);
    if (!agent) {
      return res.status(404).json(createNack(context, 'ERR-ITEM-NOT-FOUND', `Agent ${val.itemId} not found`));
    }

    if (agent.status === 'SUSPENDED' || agent.status === 'MAINTENANCE') {
      return res.status(400).json(createNack(context, 'ERR-ITEM-UNAVAILABLE', `Agent is currently ${agent.status}`));
    }

    const gst = Number((agent.price * 0.18).toFixed(2));
    const total = Number((agent.price + gst).toFixed(2));

    const onSelectContext = createContext('on_select', context);

    res.status(200).json({
      context: onSelectContext,
      message: {
        ack: { status: 'ACK' },
        order: {
          provider: {
            id: agent.provider.toLowerCase().replace(/\W+/g, '-'),
            descriptor: { name: agent.provider }
          },
          items: [
            {
              id: agent.id,
              descriptor: { name: agent.name },
              price: { currency: 'INR', value: String(agent.price) }
            }
          ],
          quote: {
            price: agent.price,
            gst,
            total,
            currency: 'INR'
          },
          sla: {
            latency_s: agent.latency,
            uptime_pct: agent.uptime,
            compliance_pct: agent.slaCompliance
          }
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Beckn /init endpoint (DPI Consent Gate)
 * @route   POST /beckn/init
 */
async function init(req, res, next) {
  try {
    const { context, message } = req.body;
    const ctxVal = validateContext(context, 'init');
    if (!ctxVal.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-CONTEXT', ctxVal.error));
    }

    const val = validateInitMessage(message);
    if (!val.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-MESSAGE', val.error));
    }

    // FR-3.3: DPI Consent Gate check
    const { consents, buyer, itemId, task } = val;
    if (!consents.data || !consents.exec || !consents.audit) {
      return res.status(400).json(
        createNack(
          context,
          'ERR-CONSENT-REQUIRED',
          'Consent gate blocked: all three consent artifacts (data, exec, audit) must be granted'
        )
      );
    }

    const agent = await getAgentById(itemId);
    if (!agent) {
      return res.status(404).json(createNack(context, 'ERR-ITEM-NOT-FOUND', `Agent ${itemId} not found`));
    }

    const orderId = generateOrderId();
    const token = val.consentToken || generateConsentToken(buyer?.email || 'buyer');
    const gst = Number((agent.price * 0.18).toFixed(2));
    const total = Number((agent.price + gst).toFixed(2));

    const nowIso = new Date().toISOString();
    const genesisHash = computeStateHash('GENESIS', 'INITIALIZED', nowIso, orderId);

    const order = new Order({
      id: orderId,
      transactionId: context.transaction_id,
      messageId: context.message_id,
      agentId: agent.id,
      agentName: agent.name,
      price: agent.price,
      gst,
      total,
      task: task || '',
      buyer: {
        name: buyer?.name || '',
        email: buyer?.email || ''
      },
      consentToken: token,
      consents,
      state: 'INITIALIZED',
      history: [{ state: 'INITIALIZED', ts: nowIso, hash: genesisHash }]
    });

    await order.save();

    const onInitContext = createContext('on_init', context);

    res.status(200).json({
      context: onInitContext,
      message: {
        ack: { status: 'ACK' },
        order: {
          order_id: order.id,
          status: 'INITIALIZED',
          consent_token: token,
          price: { currency: 'INR', value: String(total) }
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Beckn /confirm endpoint (Lock order & execute)
 * @route   POST /beckn/confirm
 */
async function confirm(req, res, next) {
  try {
    const { context, message } = req.body;
    const ctxVal = validateContext(context, 'confirm');
    if (!ctxVal.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-CONTEXT', ctxVal.error));
    }

    const val = validateConfirmMessage(message);
    if (!val.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-MESSAGE', val.error));
    }

    const order = await Order.findOne({ id: val.orderId });
    if (!order) {
      return res.status(404).json(createNack(context, 'ERR-ORDER-NOT-FOUND', `Order ${val.orderId} not found`));
    }

    // Enforce Payment before confirmation and execution
    if (order.paymentStatus !== 'PAID' && !req.body.isDemoMode) {
      return res.status(400).json(
        createNack(
          context,
          'ERR-PAYMENT-REQUIRED',
          'Payment verification is required before order can be confirmed and executed'
        )
      );
    }

    // Transition to CONFIRMED
    order.transitionState('CONFIRMED', { payload: val.executionPayload });
    await order.save();

    // Trigger Execution Orchestrator
    let execResult;
    try {
      execResult = await orchestrator.executeTask(order.id, val.executionPayload, {
        forceTimeout: req.body.forceTimeout || false
      });
    } catch (execErr) {
      // Return Beckn error payload for execution failure
      return res.status(200).json({
        context: createContext('on_confirm', context),
        message: {
          ack: { status: 'NACK' },
          order: {
            order_id: order.id,
            status: order.state,
            error: execErr.message
          }
        },
        error: {
          type: 'EXECUTION-ERROR',
          code: execErr.message.includes('ERR-EXEC-SLA-TIMEOUT') ? 'ERR-EXEC-SLA-TIMEOUT' : 'ERR-TASK-FAILED',
          message: execErr.message
        }
      });
    }

    const onConfirmContext = createContext('on_confirm', context);

    res.status(200).json({
      context: onConfirmContext,
      message: {
        ack: { status: 'ACK' },
        order: {
          order_id: order.id,
          status: 'COMPLETED',
          result: execResult.result,
          receipt: execResult.receipt
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Beckn /status endpoint
 * @route   POST /beckn/status
 */
async function status(req, res, next) {
  try {
    const { context, message } = req.body;
    const ctxVal = validateContext(context, 'status');
    if (!ctxVal.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-CONTEXT', ctxVal.error));
    }

    const val = validateStatusMessage(message);
    if (!val.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-MESSAGE', val.error));
    }

    const order = await Order.findOne({ id: val.orderId });
    if (!order) {
      return res.status(404).json(createNack(context, 'ERR-ORDER-NOT-FOUND', `Order ${val.orderId} not found`));
    }

    const onStatusContext = createContext('on_status', context);

    res.status(200).json({
      context: onStatusContext,
      message: {
        ack: { status: 'ACK' },
        order: {
          order_id: order.id,
          agent_name: order.agentName,
          status: order.state,
          total: order.total,
          history: order.history,
          result: order.result,
          receipt: order.receipt,
          rating: order.rating
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Beckn /rating endpoint
 * @route   POST /beckn/rating
 */
async function rating(req, res, next) {
  try {
    const { context, message } = req.body;
    const ctxVal = validateContext(context, 'rating');
    if (!ctxVal.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-CONTEXT', ctxVal.error));
    }

    const val = validateRatingMessage(message);
    if (!val.valid) {
      return res.status(400).json(createNack(context, 'ERR-INVALID-MESSAGE', val.error));
    }

    let agentId = val.agentId;
    if (!agentId && val.orderId) {
      const order = await Order.findOne({ id: val.orderId });
      if (order) agentId = order.agentId;
    }

    if (!agentId) {
      return res.status(400).json(createNack(context, 'ERR-AGENT-REQUIRED', 'agent_id could not be resolved'));
    }

    const result = await addRating(agentId, {
      orderId: val.orderId || 'BECKN-RATING',
      score: val.score,
      tags: val.tags,
      text: val.text,
      user: 'Beckn Consumer'
    });

    if (val.orderId) {
      const order = await Order.findOne({ id: val.orderId });
      if (order) {
        order.rating = Number(val.score);
        await order.save();
      }
    }

    const onRatingContext = createContext('on_rating', context);

    res.status(200).json({
      context: onRatingContext,
      message: {
        ack: { status: 'ACK' },
        rating: {
          value: val.score,
          agent_id: agentId,
          recomputed_trust: result.agent.trustScore,
          reviews_count: result.agent.n
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  search,
  select,
  init,
  confirm,
  status,
  rating
};
