const Agent = require('../models/Agent');
const SLAMetric = require('../models/SLAMetric');
const Execution = require('../models/Execution');

/**
 * Get comprehensive SLA & Trust Center Telemetry
 */
async function getSLAMetrics() {
  const agents = await Agent.find({});
  const live = agents.filter((a) => a.status !== 'SUSPENDED');

  const avgTrust = live.length > 0
    ? Number((live.reduce((sum, a) => sum + (a.trustScore || 0), 0) / live.length).toFixed(2))
    : 0;

  const avgSla = agents.length > 0
    ? Number((agents.reduce((sum, a) => sum + (a.slaCompliance || 0), 0) / agents.length).toFixed(1))
    : 0;

  const totalSuccessful = agents.reduce((sum, a) => sum + (a.successfulExecutions || 0), 0);
  const totalFailed = agents.reduce((sum, a) => sum + (a.failedExecutions || 0), 0);
  const totalExecutions = totalSuccessful + totalFailed;
  const overallSuccessRate = totalExecutions > 0
    ? Number(((totalSuccessful / totalExecutions) * 100).toFixed(1))
    : 100.0;

  const recentViolations = await SLAMetric.find({ eventType: 'VIOLATION' })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    overview: {
      averageTrust: avgTrust,
      averageSlaCompliance: avgSla,
      totalAgents: agents.length,
      liveAgents: live.length,
      suspendedAgents: agents.length - live.length,
      overallSuccessRate,
      totalExecutions
    },
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      cat: a.cat,
      provider: a.provider,
      status: a.status,
      trustScore: a.trustScore,
      r: a.r,
      s: a.s,
      b: a.b,
      latency: a.latency,
      uptime: a.uptime,
      slaCompliance: a.slaCompliance,
      successfulExecutions: a.successfulExecutions,
      failedExecutions: a.failedExecutions,
      suspensionReason: a.suspensionReason
    })),
    recentViolations
  };
}

module.exports = {
  getSLAMetrics
};
