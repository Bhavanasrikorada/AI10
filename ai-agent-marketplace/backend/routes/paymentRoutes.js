const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getHistory,
  getByOrder,
  getEarnings
} = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/create-order', optionalAuth, createOrder);
router.post('/verify', optionalAuth, verifyPayment);
router.get('/history', optionalAuth, getHistory);
router.get('/order/:orderId', getByOrder);
router.get('/provider-earnings', optionalAuth, getEarnings);

module.exports = router;
