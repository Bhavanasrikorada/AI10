/**
 * Schema Validation Middleware for Agent Catalog entries (FR-1.3)
 */
function validateAgentInput(req, res, next) {
  const form = req.body || {};
  const errors = [];

  if (!form.name || form.name.trim().length < 3) {
    errors.push({ field: 'name', msg: 'must be at least 3 characters' });
  }

  if (!form.desc || form.desc.trim().length < 20) {
    errors.push({ field: 'description', msg: 'must be at least 20 characters' });
  }

  if (!(Number(form.price) > 0)) {
    errors.push({ field: 'price', msg: 'must be a number greater than 0' });
  }

  if (!(Number(form.latency) > 0 && Number(form.latency) <= 60)) {
    errors.push({ field: 'sla.latency', msg: 'must be between 1 and 60 seconds' });
  }

  if (form.uptime !== undefined && !(Number(form.uptime) >= 90 && Number(form.uptime) <= 100)) {
    errors.push({ field: 'sla.uptime', msg: 'must be between 90 and 100' });
  }

  if (!form.input || !String(form.input).trim()) {
    errors.push({ field: 'input_contract', msg: 'is required' });
  }

  if (!form.output || !String(form.output).trim()) {
    errors.push({ field: 'output_contract', msg: 'is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Schema validation failed',
      errors
    });
  }

  next();
}

module.exports = {
  validateAgentInput
};
