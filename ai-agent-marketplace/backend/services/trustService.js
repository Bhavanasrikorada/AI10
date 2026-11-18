const Agent = require('../models/Agent');
const Rating = require('../models/Rating');
const SLAMetric = require('../models/SLAMetric');
const { TRUST_WEIGHTS, METRICS } = require('../config/constants');

/**
 * Explainable Trust Score Formula:
 * T = 0.40 * R + 0.35 * S + 0.25 * B
 * 
 * - R: Consumer rating component (0 to 5)
 * - S: SLA compliance component (0 to 5, mapped from percentage)
 * - B: Benchmark quality score component (0 to 5)
 */
function computeTrust(r, s, b) {
  const t = TRUST_WEIGHTS.CONSUMER_RATING * (r || 0) +
            TRUST_WEIGHTS.SLA_COMPLIANCE * (s || 0) +
            TRUST_WEIGHTS.BENCHMARK_SCORE * (b || 0);
  return Number(t.toFixed(2));
}

/**
 * Add rating and update agent trust metrics
 */
async function addRating(agentId, { orderId, score, tags, text, user, userId }) {
  const agent = await Agent.findOne({ id: agentId });
  if (!agent) {
    const err = new Error(`Agent ${agentId} not found`);
    err.statusCode = 404;
    throw err;
  }

  // Persist Rating record
  const ratingRecord = await Rating.create({
    orderId,
    agentId,
    userId,
    user: user || 'Anonymous Consumer',
    score: Number(score),
    tags: tags || [],
    text: text || ''
  });

  // Recompute consumer average rating (R)
  const currentTotalScore = (agent.r || 4.0) * (agent.n || 0);
  const newN = (agent.n || 0) + 1;
  const newR = Number(((currentTotalScore + Number(score)) / newN).toFixed(2));

  agent.n = newN;
  agent.r = newR;
  agent.reviews.unshift({
    user: user || 'You',
    userId,
    score: Number(score),
    tags: tags || [],
    text: text || '',
    createdAt: new Date()
  });

  agent.calculateTrustScore();
  await agent.save();

  return {
    rating: ratingRecord,
    agent: {
      id: agent.id,
      r: agent.r,
      s: agent.s,
      b: agent.b,
      trustScore: agent.trustScore,
      n: agent.n,
      status: agent.status
    }
  };
}

/**
 * Record an SLA violation and recalculate compliance
 */
async function recordSLAViolation(agentId, penalty = 0.6) {
  const agent = await Agent.findOne({ id: agentId });
  if (!agent) return null;

  agent.slaCompliance = Math.max(0, Number((agent.slaCompliance - penalty).toFixed(1)));
  // Map compliance % to S score (0-5)
  agent.s = Math.max(0, Number((agent.slaCompliance / 20).toFixed(2)));
  agent.calculateTrustScore();
  await agent.save();

  await SLAMetric.create({
    agentId: agent.id,
    eventType: 'VIOLATION',
    success: false,
    complianceSnapshot: agent.slaCompliance,
    details: { penalty }
  });

  return agent;
}

/**
 * Run synthetic quality and benchmark cycle (FR-6.4)
 */
async function runBenchmarks() {
  const agents = await Agent.find({});
  const updated = [];

  for (const a of agents) {
    // Perturb benchmark score B (1.5 - 5.0)
    const deltaB = (Math.random() - 0.55) * 0.5;
    const nextB = Number(Math.min(5, Math.max(1.5, a.b + deltaB)).toFixed(2));

    // Perturb SLA compliance
    const deltaSla = (Math.random() - 0.6) * 1.2;
    const nextSla = Number(Math.min(100, Math.max(50, a.slaCompliance + deltaSla)).toFixed(1));

    a.b = nextB;
    a.slaCompliance = nextSla;
    a.s = Number((nextSla / 20).toFixed(2));
    a.calculateTrustScore();

    await a.save();

    await SLAMetric.create({
      agentId: a.id,
      eventType: 'BENCHMARK',
      benchmarkScore: nextB,
      complianceSnapshot: nextSla
    });

    updated.push({
      id: a.id,
      name: a.name,
      trustScore: a.trustScore,
      slaCompliance: a.slaCompliance,
      status: a.status,
      suspensionReason: a.suspensionReason
    });
  }

  return updated;
}

module.exports = {
  computeTrust,
  addRating,
  recordSLAViolation,
  runBenchmarks
};
