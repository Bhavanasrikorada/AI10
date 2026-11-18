/**
 * Abstract Base Adapter for AI Agent Orchestration
 */
class BaseAdapter {
  constructor(id, name, category) {
    this.id = id;
    this.name = name;
    this.category = category;
  }

  /**
   * Validate input according to agent contract
   * @param {*} input
   * @returns {{ valid: boolean, error?: string }}
   */
  validateInput(input) {
    if (!input || (typeof input === 'string' && !input.trim())) {
      return { valid: false, error: 'Empty input payload provided' };
    }
    return { valid: true };
  }

  /**
   * Approximate token consumption for billing/telemetry
   */
  estimateTokens(inputText, outputObject) {
    const inTokens = Math.ceil((inputText ? String(inputText).length : 0) / 4);
    const outTokens = Math.ceil(JSON.stringify(outputObject || {}).length / 4);
    return inTokens + outTokens + 120; // baseline prompt token overhead
  }

  /**
   * Execute task logic
   * @param {*} input 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async execute(input, options = {}) {
    throw new Error(`execute() must be implemented by adapter ${this.constructor.name}`);
  }
}

module.exports = BaseAdapter;
