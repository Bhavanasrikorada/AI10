const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  setAgentStatus,
  deleteAgent
} = require('../controllers/agentController');
const { validateAgentInput } = require('../middleware/validateMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', getAgents);
router.get('/:id', getAgent);
router.post('/', optionalAuth, validateAgentInput, createAgent);
router.put('/:id', optionalAuth, validateAgentInput, updateAgent);
router.patch('/:id/status', optionalAuth, setAgentStatus);
router.delete('/:id', optionalAuth, deleteAgent);

module.exports = router;
