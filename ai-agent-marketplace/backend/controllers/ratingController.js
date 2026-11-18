const { addRating } = require('../services/trustService');
const Rating = require('../models/Rating');
const Order = require('../models/Order');

/**
 * @desc    Submit rating and review for an executed task
 * @route   POST /api/ratings
 * @access  Public
 */
async function submitRating(req, res, next) {
  try {
    const { agentId, orderId, score, tags, text } = req.body;

    if (!agentId || !score) {
      return res.status(400).json({
        success: false,
        error: 'agentId and score (1-5) are required'
      });
    }

    const user = req.user?.name || req.body.user || 'You';
    const userId = req.user?.id || null;

    const result = await addRating(agentId, {
      orderId: orderId || 'MANUAL-RATING',
      score: Number(score),
      tags: tags || [],
      text: text || '',
      user,
      userId
    });

    // If orderId is provided, mark rating on order
    if (orderId) {
      const order = await Order.findOne({ id: orderId });
      if (order) {
        order.rating = Number(score);
        await order.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Rating submitted and trust score recomputed',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Get all reviews for an agent
 * @route   GET /api/ratings/agent/:agentId
 * @access  Public
 */
async function getAgentReviews(req, res, next) {
  try {
    const reviews = await Rating.find({ agentId: req.params.agentId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitRating,
  getAgentReviews
};
