const express = require('express');
const router = express.Router();
const { submitRating, getAgentReviews } = require('../controllers/ratingController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, submitRating);
router.get('/agent/:agentId', getAgentReviews);

module.exports = router;
