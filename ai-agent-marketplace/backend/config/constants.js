/**
 * System and Beckn Protocol Constants
 */

module.exports = {
  BECKN: {
    DOMAIN: 'ai-agents',
    VERSION: '1.1.0',
    ACTIONS: {
      SEARCH: 'search',
      ON_SEARCH: 'on_search',
      SELECT: 'select',
      ON_SELECT: 'on_select',
      INIT: 'init',
      ON_INIT: 'on_init',
      CONFIRM: 'confirm',
      ON_CONFIRM: 'on_confirm',
      STATUS: 'status',
      ON_STATUS: 'on_status',
      RATING: 'rating',
      ON_RATING: 'on_rating'
    },
    ORDER_STATES: {
      INITIALIZED: 'INITIALIZED',
      PAID: 'PAID',
      CONFIRMED: 'CONFIRMED',
      QUEUED: 'QUEUED',
      PROCESSING: 'PROCESSING',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
      TIMED_OUT: 'TIMED_OUT',
      CANCELLED: 'CANCELLED'
    }
  },
  PAYMENT_STATUSES: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'],
  PAYMENT_METHODS: ['UPI', 'CARD', 'NETBANKING', 'SIMULATED', 'RAZORPAY'],
  CATEGORIES: ['Document', 'Data', 'Code', 'Legal', 'HR', 'Support', 'Finance', 'Vision', 'Analytics'],
  AGENT_STATUSES: ['ACTIVE', 'DEGRADED', 'MAINTENANCE', 'SUSPENDED'],
  USER_ROLES: ['consumer', 'provider', 'admin'],
  METRICS: {
    MAX_LATENCY: 20, // seconds, ranking normalization
    MAX_PRICE: 20,   // INR, ranking normalization
    GST_RATE: 0.18,  // 18% GST for digital services
    MIN_SLA_COMPLIANCE: 95.0, // Suspension threshold
    MIN_TRUST_SCORE: 3.0       // Suspension threshold
  },
  TRUST_WEIGHTS: {
    CONSUMER_RATING: 0.40, // R
    SLA_COMPLIANCE: 0.35,  // S
    BENCHMARK_SCORE: 0.25  // B
  },
  RANK_WEIGHTS: {
    TRUST: 0.40,
    LATENCY: 0.30,
    PRICE: 0.30
  }
};
