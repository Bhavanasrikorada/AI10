const { createContext } = require('./context');

/**
 * Generate standard Beckn ACK
 */
function createAck(reqContext) {
  return {
    context: createContext(reqContext?.action || 'ack', reqContext),
    message: {
      ack: {
        status: 'ACK'
      }
    }
  };
}

/**
 * Generate standard Beckn NACK / Error
 */
function createNack(reqContext, errorCode, errorMessage) {
  return {
    context: createContext(reqContext?.action || 'nack', reqContext),
    message: {
      ack: {
        status: 'NACK'
      }
    },
    error: {
      type: 'CORE-ERROR',
      code: errorCode || 'ERR-BECKN-GENERIC',
      message: errorMessage || 'An error occurred while processing Beckn request'
    }
  };
}

module.exports = {
  createAck,
  createNack
};
