const express = require('express');
const router = express.Router();
const {
  search,
  select,
  init,
  confirm,
  status,
  rating
} = require('../controllers/becknController');

// Beckn Protocol Lifecycle Endpoints
router.post('/search', search);
router.post('/select', select);
router.post('/init', init);
router.post('/confirm', confirm);
router.post('/status', status);
router.post('/rating', rating);

// Callbacks (for testing or direct asynchronous BAP/BPP loopback)
router.post('/on_search', (req, res) => res.status(200).json({ message: { ack: { status: 'ACK' } } }));
router.post('/on_select', (req, res) => res.status(200).json({ message: { ack: { status: 'ACK' } } }));
router.post('/on_init', (req, res) => res.status(200).json({ message: { ack: { status: 'ACK' } } }));
router.post('/on_confirm', (req, res) => res.status(200).json({ message: { ack: { status: 'ACK' } } }));
router.post('/on_status', (req, res) => res.status(200).json({ message: { ack: { status: 'ACK' } } }));
router.post('/on_rating', (req, res) => res.status(200).json({ message: { ack: { status: 'ACK' } } }));

module.exports = router;
