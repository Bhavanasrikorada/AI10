const mongoose = require('mongoose');
const { CATEGORIES, AGENT_STATUSES, TRUST_WEIGHTS, METRICS } = require('../config/constants');

const versionSchema = new mongoose.Schema({
  v: { type: String, required: true },
  date: { type: String, required: true },
  change: { type: String, required: true }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  user: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: { type: Number, required: true, min: 1, max: 5 },
  tags: [{ type: String }],
  text: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const agentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters']
    },
    cat: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES
    },
    provider: {
      type: String,
      required: true,
      default: 'BAAM Reference Labs'
    },
    providerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: AGENT_STATUSES,
      default: 'ACTIVE',
      index: true
    },
    suspensionReason: {
      type: String,
      default: ''
    },
    featured: {
      type: Boolean,
      default: false
    },
    desc: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters']
    },
    tags: [{
      type: String,
      trim: true
    }],
    latency: {
      type: Number,
      required: [true, 'Latency bound is required'],
      min: [1, 'Latency must be at least 1s'],
      max: [60, 'Latency cannot exceed 60s']
    },
    price: {
      type: Number,
      required: [true, 'Price per task is required'],
      min: [0.1, 'Price must be greater than 0']
    },
    uptime: {
      type: Number,
      default: 99.5,
      min: [90, 'Uptime must be at least 90%'],
      max: [100, 'Uptime cannot exceed 100%']
    },
    slaCompliance: {
      type: Number,
      default: 100.0,
      min: 0,
      max: 100
    },
    r: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5
    },
    s: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5
    },
    b: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5
    },
    n: {
      type: Number,
      default: 0
    },
    trustScore: {
      type: Number,
      default: 4.15
    },
    input: {
      type: String,
      required: [true, 'Input contract is required']
    },
    output: {
      type: String,
      required: [true, 'Output contract is required']
    },
    versions: [versionSchema],
    reviews: [reviewSchema],
    successfulExecutions: {
      type: Number,
      default: 0
    },
    failedExecutions: {
      type: Number,
      default: 0
    },
    totalExecutionTimeMs: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Method to calculate Trust Score according to FR-6.2 formula:
// T = 0.40 * R + 0.35 * S + 0.25 * B
agentSchema.methods.calculateTrustScore = function () {
  const r = this.r || 0;
  const s = this.s || 0;
  const b = this.b || 0;
  const t = Number((
    TRUST_WEIGHTS.CONSUMER_RATING * r +
    TRUST_WEIGHTS.SLA_COMPLIANCE * s +
    TRUST_WEIGHTS.BENCHMARK_SCORE * b
  ).toFixed(2));
  this.trustScore = t;

  // Auto-suspension check
  if ((this.slaCompliance < METRICS.MIN_SLA_COMPLIANCE || t < METRICS.MIN_TRUST_SCORE) && this.status !== 'SUSPENDED') {
    this.status = 'SUSPENDED';
    this.suspensionReason = `Automated suspension: SLA Compliance (${this.slaCompliance}%) < ${METRICS.MIN_SLA_COMPLIANCE}% or Trust (${t}) < ${METRICS.MIN_TRUST_SCORE}`;
  }
  return t;
};

// Method to compute match ranking score
// rank = Trust 40% + latency 30% + price 30%
agentSchema.methods.calculateRank = function () {
  const tNorm = this.trustScore / 5;
  const latNorm = Math.max(0, 1 - this.latency / METRICS.MAX_LATENCY);
  const priceNorm = Math.max(0, 1 - this.price / METRICS.MAX_PRICE);
  return Number((0.4 * tNorm + 0.3 * latNorm + 0.3 * priceNorm).toFixed(4));
};

agentSchema.pre('save', function (next) {
  this.calculateTrustScore();
  next();
});

module.exports = mongoose.model('Agent', agentSchema);
