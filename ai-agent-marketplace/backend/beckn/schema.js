/**
 * Beckn message validation utilities
 */

function validateSearchMessage(message) {
  if (!message) return { valid: true, filters: {} };
  const intent = message.intent || {};
  const filters = {
    query: intent.item?.descriptor?.name || intent.query || '',
    category: intent.category?.id || intent.category || 'All',
    provider: intent.provider?.id || intent.provider || '',
    maxPrice: intent.item?.price?.value ? parseFloat(intent.item.price.value) : null,
    maxLatency: intent.fulfillment?.tracking ? parseInt(intent.fulfillment.tracking, 10) : null,
    minTrust: intent.tags?.min_trust ? parseFloat(intent.tags.min_trust) : null
  };
  return { valid: true, filters };
}

function validateSelectMessage(message) {
  if (!message || !message.order || !message.order.item_id) {
    return { valid: false, error: 'message.order.item_id is required for /select' };
  }
  return { valid: true, itemId: message.order.item_id, taskParams: message.order.task_params };
}

function validateInitMessage(message) {
  if (!message || !message.order) {
    return { valid: false, error: 'message.order is required for /init' };
  }
  const { order } = message;
  const buyer = order.billing || order.customer || { email: order.consumer_identity, name: order.consumer_name };

  if (!order.item_id && !order.agent_id) {
    return { valid: false, error: 'order.item_id is required' };
  }
  return {
    valid: true,
    itemId: order.item_id || order.agent_id,
    buyer,
    consents: order.consents || {
      data: Boolean(order.consent_token),
      exec: Boolean(order.consent_token),
      audit: Boolean(order.consent_token)
    },
    consentToken: order.consent_token,
    task: order.task_params || order.task || ''
  };
}

function validateConfirmMessage(message) {
  if (!message || !message.order || !message.order.order_id) {
    return { valid: false, error: 'message.order.order_id is required for /confirm' };
  }
  return {
    valid: true,
    orderId: message.order.order_id,
    executionPayload: message.order.execution_payload || message.order.payload || ''
  };
}

function validateStatusMessage(message) {
  if (!message || (!message.order_id && (!message.order || !message.order.order_id))) {
    return { valid: false, error: 'order_id is required for /status' };
  }
  return { valid: true, orderId: message.order_id || message.order.order_id };
}

function validateRatingMessage(message) {
  if (!message || !message.score) {
    return { valid: false, error: 'message.score is required for /rating' };
  }
  return {
    valid: true,
    orderId: message.order_id,
    agentId: message.agent_id,
    score: message.score,
    tags: message.tags || [],
    text: message.text || message.feedback || ''
  };
}

module.exports = {
  validateSearchMessage,
  validateSelectMessage,
  validateInitMessage,
  validateConfirmMessage,
  validateStatusMessage,
  validateRatingMessage
};
