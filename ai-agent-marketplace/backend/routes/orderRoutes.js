const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  transitionOrder,
  executeOrder,
  getConsumerOrders,
  getProviderOrders
} = require('../controllers/orderController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', getOrders);
router.get('/consumer', optionalAuth, getConsumerOrders);
router.get('/provider', optionalAuth, getProviderOrders);
router.get('/:id', getOrder);
router.post('/', optionalAuth, createOrder);
router.patch('/:id/transition', transitionOrder);
router.post('/:id/execute', executeOrder);

module.exports = router;
