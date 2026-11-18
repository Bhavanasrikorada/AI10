const mongoose = require('mongoose');

const slaMetricSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ['EXECUTION', 'VIOLATION', 'BENCHMARK', 'HEARTBEAT'],
      default: 'EXECUTION'
    },
    executionTimeMs: {
      type: Number,
      default: 0
    },
    slaLimitSec: {
      type: Number,
      default: 0
    },
    success: {
      type: Boolean,
      default: true
    },
    violationType: {
      type: String,
      default: null
    },
    benchmarkScore: {
      type: Number,
      default: null
    },
    complianceSnapshot: {
      type: Number,
      default: 100.0
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SLAMetric', slaMetricSchema);
