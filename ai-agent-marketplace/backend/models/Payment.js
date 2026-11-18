const mongoose = require('mongoose');
const { PAYMENT_STATUSES, PAYMENT_METHODS } = require('../config/constants');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    consumerEmail: {
      type: String,
      default: ''
    },
    consumerName: {
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
    amount: {
      type: Number,
      required: true
    },
    baseAmount: {
      type: Number,
      required: true
    },
    gst: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PENDING',
      index: true
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'SIMULATED'
    },
    gateway: {
      type: String,
      enum: ['simulated', 'razorpay'],
      default: 'simulated'
    },
    gatewayOrderId: {
      type: String,
      default: null
    },
    gatewayPaymentId: {
      type: String,
      default: null
    },
    gatewaySignature: {
      type: String,
      default: null
    },
    receipt: {
      type: mongoose.Schema.Types.Mixed,
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

module.exports = mongoose.model('Payment', paymentSchema);
