const Agent = require('../models/Agent');
const { METRICS, AGENT_STATUSES } = require('../config/constants');
const { AGENTS: FALLBACK_AGENTS } = require('../utils/seedData');

/**
 * Search and rank AI agents according to Beckn discovery intent
 */
async function searchAgents(filters = {}) {
  const query = {};

  // Status filter (exclude SUSPENDED by default unless requested)
  if (filters.includeSuspended) {
    // include all
  } else {
    query.status = { $ne: 'SUSPENDED' };
  }

  // Category filter
  if (filters.category && filters.category !== 'All') {
    query.cat = filters.category;
  }

  // Price ceiling
  if (filters.maxPrice && filters.maxPrice > 0) {
    query.price = { $lte: Number(filters.maxPrice) };
  }

  // Latency ceiling
  if (filters.maxLatency && filters.maxLatency > 0) {
    query.latency = { $lte: Number(filters.maxLatency) };
  }

  // Min trust score
  if (filters.minTrust && filters.minTrust > 0) {
    query.trustScore = { $gte: Number(filters.minTrust) };
  }

  // Provider filter
  if (filters.provider) {
    query.provider = new RegExp(filters.provider, 'i');
  }

  let agents = [];
  try {
    agents = await Agent.find(query).lean();
  } catch (err) {
    console.warn('[agentService] DB query failed, using in-memory dataset:', err.message);
    agents = FALLBACK_AGENTS.filter((a) => {
      if (!filters.includeSuspended && a.status === 'SUSPENDED') return false;
      if (filters.category && filters.category !== 'All' && a.cat !== filters.category) return false;
      if (filters.maxPrice && a.price > filters.maxPrice) return false;
      if (filters.maxLatency && a.latency > filters.maxLatency) return false;
      return true;
    });
  }

  // Capability / text search filter
  const term = (filters.query || '').trim().toLowerCase();
  if (term) {
    agents = agents.filter((a) => {
      const matchText = `${a.name} ${a.desc} ${a.cat} ${(a.tags || []).join(' ')} ${a.provider}`.toLowerCase();
      return matchText.includes(term);
    });
  }

  // Compute ranking score: Rank = Trust 40% + Latency 30% + Price 30%
  const ranked = agents.map((a) => {
    const t = a.trustScore || +(0.4 * (a.r || 4) + 0.35 * (a.s || 4.5) + 0.25 * (a.b || 4)).toFixed(2);
    const score = Number((
      0.4 * (t / 5) +
      0.3 * Math.max(0, 1 - a.latency / METRICS.MAX_LATENCY) +
      0.3 * Math.max(0, 1 - a.price / METRICS.MAX_PRICE)
    ).toFixed(4));
    return { ...a, trustScore: t, matchScore: score };
  });

  // Sort descending by matchScore
  ranked.sort((x, y) => y.matchScore - x.matchScore);
  return ranked;
}

/**
 * Retrieve agent by ID
 */
async function getAgentById(id) {
  let agent = await Agent.findOne({ id });
  if (!agent) {
    const found = FALLBACK_AGENTS.find((a) => a.id === id);
    if (found) {
      agent = new Agent(found);
      agent.calculateTrustScore();
    }
  }
  return agent;
}

/**
 * Register a new agent
 */
async function createAgent(data, providerUserId = null) {
  const existing = await Agent.findOne({ id: data.id });
  if (existing) {
    const err = new Error(`Agent with ID '${data.id}' already exists`);
    err.statusCode = 400;
    throw err;
  }

  const agent = new Agent({
    ...data,
    providerUser: providerUserId,
    versions: [
      {
        v: '1.0.0',
        date: new Date().toISOString().slice(0, 10),
        change: 'Initial listing'
      }
    ]
  });

  agent.calculateTrustScore();
  await agent.save();
  return agent;
}

/**
 * Update an agent and record immutable version history
 */
async function updateAgent(id, updates) {
  const agent = await Agent.findOne({ id });
  if (!agent) {
    const err = new Error(`Agent with ID '${id}' not found`);
    err.statusCode = 404;
    throw err;
  }

  // Increment version (e.g. 1.0.0 -> 1.1.0)
  const currentVersions = agent.versions || [];
  const latestV = currentVersions.length > 0 ? currentVersions[currentVersions.length - 1].v : '1.0.0';
  const parts = latestV.split('.');
  const nextV = `${parts[0] || '1'}.${parseInt(parts[1] || '0', 10) + 1}.0`;

  Object.assign(agent, updates);

  agent.versions.push({
    v: nextV,
    date: new Date().toISOString().slice(0, 10),
    change: updates.versionChangeNote || 'Listing updated by provider'
  });

  agent.calculateTrustScore();
  await agent.save();
  return agent;
}

/**
 * Update agent status
 */
async function setAgentStatus(id, status) {
  if (!AGENT_STATUSES.includes(status)) {
    const err = new Error(`Invalid status: ${status}. Must be one of: ${AGENT_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  const agent = await Agent.findOne({ id });
  if (!agent) {
    const err = new Error(`Agent with ID '${id}' not found`);
    err.statusCode = 404;
    throw err;
  }
  agent.status = status;
  if (status !== 'SUSPENDED') {
    agent.suspensionReason = '';
  }
  await agent.save();
  return agent;
}

/**
 * Deregister/delete an agent
 */
async function deleteAgent(id) {
  const result = await Agent.findOneAndDelete({ id });
  if (!result) {
    const err = new Error(`Agent with ID '${id}' not found`);
    err.statusCode = 404;
    throw err;
  }
  return result;
}

module.exports = {
  searchAgents,
  getAgentById,
  createAgent,
  updateAgent,
  setAgentStatus,
  deleteAgent
};
