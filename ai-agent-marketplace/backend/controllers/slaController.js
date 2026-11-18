const { getSLAMetrics } = require('../services/slaService');
const { runBenchmarks, recordSLAViolation } = require('../services/trustService');

/**
 * @desc    Get SLA & Trust Center Telemetry
 * @route   GET /api/sla/metrics
 * @access  Public
 */
async function getMetrics(req, res, next) {
  try {
    const data = await getSLAMetrics();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Run synthetic benchmark cycle across all agents
 * @route   POST /api/sla/benchmark
 * @access  Public / Admin
 */
async function runBenchmarkCycle(req, res, next) {
  try {
    const results = await runBenchmarks();
    res.status(200).json({
      success: true,
      message: 'Synthetic benchmark cycle completed and trust scores recomputed',
      data: results
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Record an SLA violation against an agent
 * @route   POST /api/sla/violation
 * @access  Public
 */
async function reportViolation(req, res, next) {
  try {
    const { agentId, penalty } = req.body;
    if (!agentId) {
      return res.status(400).json({ success: false, error: 'agentId is required' });
    }
    const agent = await recordSLAViolation(agentId, penalty ? Number(penalty) : 0.6);
    res.status(200).json({
      success: true,
      message: `Violation recorded against ${agentId}`,
      data: agent
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMetrics,
  runBenchmarkCycle,
  reportViolation
};
