const express = require('express');
const router = express.Router();
const { getMetrics, runBenchmarkCycle, reportViolation } = require('../controllers/slaController');

router.get('/metrics', getMetrics);
router.post('/benchmark', runBenchmarkCycle);
router.post('/violation', reportViolation);

module.exports = router;
