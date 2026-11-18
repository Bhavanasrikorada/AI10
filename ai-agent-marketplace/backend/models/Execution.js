const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true
    },
    agentId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'TIMED_OUT'],
      default: 'QUEUED'
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    durationMs: {
      type: Number,
      default: 0
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    inputSha256: {
      type: String,
      default: ''
    },
    outputSha256: {
      type: String,
      default: ''
    },
    slaLimitSec: {
      type: Number,
      default: 10
    },
    slaBreached: {
      type: Boolean,
      default: false
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

module.exports = mongoose.model('Execution', executionSchema);
