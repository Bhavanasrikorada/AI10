const { v4: uuidv4 } = require('uuid');
const { BECKN } = require('../config/constants');

/**
 * Build Beckn Context for outgoing response or callback
 */
function createContext(action, reqContext = {}) {
  const now = new Date().toISOString();
  return {
    domain: reqContext.domain || BECKN.DOMAIN,
    country: reqContext.country || 'IND',
    city: reqContext.city || 'std:080',
    action: action,
    core_version: reqContext.core_version || BECKN.VERSION,
    bap_id: reqContext.bap_id || process.env.BAP_ID || 'bap.client.baam.dpi',
    bap_uri: reqContext.bap_uri || process.env.BAP_URI || 'http://localhost:5173',
    bpp_id: process.env.BPP_ID || 'bpp.marketplace.baam.dpi',
    bpp_uri: process.env.BPP_URI || 'http://localhost:5000/beckn',
    transaction_id: reqContext.transaction_id || uuidv4(),
    message_id: reqContext.message_id || uuidv4(),
    timestamp: now,
    ttl: 'PT30S'
  };
}

/**
 * Validate incoming Beckn context
 */
function validateContext(context, expectedAction) {
  if (!context) {
    return { valid: false, error: 'Context is required in Beckn request' };
  }
  if (!context.transaction_id) {
    return { valid: false, error: 'transaction_id is required in Beckn context' };
  }
  if (expectedAction && context.action !== expectedAction) {
    return {
      valid: false,
      error: `Expected context.action '${expectedAction}' but received '${context.action}'`
    };
  }
  return { valid: true };
}

module.exports = {
  createContext,
  validateContext
};
