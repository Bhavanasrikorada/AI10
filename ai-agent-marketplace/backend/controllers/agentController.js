const {
  searchAgents,
  getAgentById,
  createAgent: createAgentService,
  updateAgent: updateAgentService,
  setAgentStatus: setAgentStatusService,
  deleteAgent: deleteAgentService
} = require('../services/agentService');

/**
 * @desc    Get all agents with discovery filtering and ranking
 * @route   GET /api/agents
 * @access  Public
 */
async function getAgents(req, res, next) {
  try {
    const filters = {
      query: req.query.q || req.query.query || '',
      category: req.query.cat || req.query.category || 'All',
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : null,
      maxLatency: req.query.maxLat || req.query.maxLatency ? Number(req.query.maxLat || req.query.maxLatency) : null,
      minTrust: req.query.minTrust ? Number(req.query.minTrust) : null,
      provider: req.query.provider || '',
      includeSuspended: req.query.includeSuspended === 'true'
    };

    const agents = await searchAgents(filters);
    res.status(200).json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get single agent by ID
 * @route   GET /api/agents/:id
 * @access  Public
 */
async function getAgent(req, res, next) {
  try {
    const agent = await getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    res.status(200).json({
      success: true,
      data: agent
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Register a new AI Agent listing
 * @route   POST /api/agents
 * @access  Public / Provider
 */
async function createAgent(req, res, next) {
  try {
    const providerUserId = req.user?.id || null;
    const body = req.body;

    const id = body.id || (
      body.name.toLowerCase().replace(/\W+/g, '-') + '-' + Date.now().toString(36)
    );

    const agentData = {
      id,
      name: body.name.trim(),
      cat: body.cat,
      desc: body.desc.trim(),
      price: Number(body.price),
      latency: Number(body.latency),
      uptime: body.uptime !== undefined ? Number(body.uptime) : 99.5,
      slaCompliance: 100.0,
      r: 3.5,
      s: 3.5,
      b: 3.5,
      n: 0,
      status: 'ACTIVE',
      featured: false,
      provider: body.provider || req.user?.organization || 'Your Organisation',
      input: body.input,
      output: body.output,
      tags: Array.isArray(body.tags)
        ? body.tags
        : (body.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
    };

    const newAgent = await createAgentService(agentData, providerUserId);
    res.status(201).json({
      success: true,
      message: 'Agent registered and published to the catalog',
      data: newAgent
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Update an AI Agent listing
 * @route   PUT /api/agents/:id
 * @access  Public / Provider
 */
async function updateAgent(req, res, next) {
  try {
    const updates = { ...req.body };
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    const updated = await updateAgentService(req.params.id, updates);
    res.status(200).json({
      success: true,
      message: 'Listing updated – a new immutable version was recorded',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Set agent status (ACTIVE, DEGRADED, MAINTENANCE, SUSPENDED)
 * @route   PATCH /api/agents/:id/status
 * @access  Public / Provider / Admin
 */
async function setAgentStatus(req, res, next) {
  try {
    const { status } = req.body;
    const updated = await setAgentStatusService(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Agent status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Deregister an agent
 * @route   DELETE /api/agents/:id
 * @access  Public / Provider / Admin
 */
async function deleteAgent(req, res, next) {
  try {
    await deleteAgentService(req.params.id);
    res.status(200).json({
      success: true,
      message: `Agent ${req.params.id} deregistered successfully`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  setAgentStatus,
  deleteAgent
};
