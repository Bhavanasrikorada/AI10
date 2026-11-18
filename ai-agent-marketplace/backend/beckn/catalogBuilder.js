const { CATEGORIES } = require('../config/constants');

/**
 * Builds Beckn Catalog format for on_search responses
 */
function buildBecknCatalog(agents) {
  // Group agents by provider
  const providersMap = new Map();

  agents.forEach((agent) => {
    const provName = agent.provider || 'BAAM Reference Labs';
    if (!providersMap.has(provName)) {
      providersMap.set(provName, {
        id: provName.toLowerCase().replace(/\W+/g, '-'),
        descriptor: {
          name: provName,
          short_desc: `DPI-verified AI Agent Provider: ${provName}`
        },
        categories: CATEGORIES.map((c) => ({ id: c, descriptor: { name: c } })),
        items: []
      });
    }

    const providerObj = providersMap.get(provName);

    providerObj.items.push({
      id: agent.id,
      descriptor: {
        name: agent.name,
        short_desc: agent.desc,
        images: [],
        tags: agent.tags || []
      },
      category_id: agent.cat,
      price: {
        currency: 'INR',
        value: String(agent.price)
      },
      status: agent.status,
      matched_score: agent.matchScore || undefined,
      tags: {
        trust_score: agent.trustScore ? agent.trustScore.toFixed(2) : '4.00',
        sla_latency_s: String(agent.latency),
        sla_uptime_pct: String(agent.uptime),
        sla_compliance_pct: String(agent.slaCompliance),
        consumer_rating: agent.r ? agent.r.toFixed(2) : '4.0',
        sla_rating: agent.s ? agent.s.toFixed(2) : '4.5',
        benchmark_rating: agent.b ? agent.b.toFixed(2) : '4.0',
        reviews_count: String(agent.n || 0),
        input_contract: agent.input,
        output_contract: agent.output,
        current_version: agent.versions && agent.versions.length > 0 ? agent.versions[agent.versions.length - 1].v : '1.0.0'
      },
      fulfillment_id: `ful-${agent.id}`
    });
  });

  return {
    'bpp/descriptor': {
      name: 'DPI-Enabled AI Agent Marketplace',
      short_desc: 'Decentralized Beckn BPP for AI Agents and Automated Cognitive Services'
    },
    'bpp/providers': Array.from(providersMap.values())
  };
}

module.exports = {
  buildBecknCatalog
};
