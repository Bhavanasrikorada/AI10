const mongoose = require('mongoose');
const { BECKN } = require('../config/constants');
const { computeStateHash } = require('../utils/crypto');

const stateHistorySchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true
    },
    ts: {
      type: Date,
      default: Date.now
    },
    hash: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    transactionId: {
      type: String,
      required: true,
      index: true
    },
    messageId: {
      type: String,
      default: ''
    },
    agentId: {
      type: String,
      required: true,
      index: true
    },
    agentName: {
      type: String,
      required: true
    },
    provider: {
      type: String,
      default: 'BAAM Reference Labs'
    },
    providerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    buyer: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    task: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true
    },
    gst: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    paymentId: {
      type: String,
      default: null
    },
    paymentMethod: {
      type: String,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    razorpayOrderId: {
      type: String,
      default: null
    },
    consentToken: {
      type: String,
      default: ''
    },
    consents: {
      data: { type: Boolean, default: false },
      exec: { type: Boolean, default: false },
      audit: { type: Boolean, default: false }
    },
    state: {
      type: String,
      enum: Object.values(BECKN.ORDER_STATES),
      default: BECKN.ORDER_STATES.INITIALIZED,
      index: true
    },
    payload: {
      type: String,
      default: null
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    receipt: {
      duration_ms: { type: Number },
      tokens_used: { type: Number },
      timestamp: { type: Date },
      result_sha256: { type: String }
    },
    paymentReceipt: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    history: [stateHistorySchema],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    error: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to transition state with cryptographic hashing (NFR-AUD.1)
orderSchema.methods.transitionState = function (newState, extra = {}) {
  const ts = new Date().toISOString();
  let prevHash = 'GENESIS';
  if (this.history && this.history.length > 0) {
    prevHash = this.history[this.history.length - 1].hash;
  }
  const hash = computeStateHash(prevHash, newState, ts, this.id);
  this.state = newState;
  this.history.push({ state: newState, ts, hash });

  if (extra.payload !== undefined) this.payload = extra.payload;
  if (extra.result !== undefined) this.result = extra.result;
  if (extra.receipt !== undefined) this.receipt = extra.receipt;
  if (extra.error !== undefined) this.error = extra.error;
  if (extra.rating !== undefined) this.rating = extra.rating;
  if (extra.paymentStatus !== undefined) this.paymentStatus = extra.paymentStatus;
  if (extra.paymentId !== undefined) this.paymentId = extra.paymentId;
  if (extra.paymentMethod !== undefined) this.paymentMethod = extra.paymentMethod;
  if (extra.paidAt !== undefined) this.paidAt = extra.paidAt;
  if (extra.paymentReceipt !== undefined) this.paymentReceipt = extra.paymentReceipt;
};

module.exports = mongoose.model('Order', orderSchema);
