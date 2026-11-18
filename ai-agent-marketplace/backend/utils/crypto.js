const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Compute SHA-256 hex digest of a string or object
 */
function sha256(input) {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

/**
 * Generate cryptographic chained state hash for audit ledger
 * Matches NFR-AUD.1 specification
 */
function computeStateHash(prevHash, state, timestamp, orderId) {
  if (!prevHash || prevHash === 'GENESIS') {
    return sha256(`GENESIS${state}${timestamp}${orderId}`);
  }
  return sha256(`${prevHash}${state}${timestamp}${orderId}`);
}

/**
 * Generate DPI consent token
 */
function generateConsentToken(identity) {
  const hash = sha256(`${identity}${Date.now()}${uuidv4()}`);
  return `dpi-${hash.slice(0, 20)}`;
}

/**
 * Generate Beckn Transaction ID
 */
function generateTransactionId() {
  return uuidv4();
}

/**
 * Generate Order ID
 */
function generateOrderId() {
  return `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
}

module.exports = {
  sha256,
  computeStateHash,
  generateConsentToken,
  generateTransactionId,
  generateOrderId
};
