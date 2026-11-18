/**
 * Request Logger with Beckn Context Tracking
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl;
  const becknAction = req.body?.context?.action;
  const txnId = req.body?.context?.transaction_id;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    if (becknAction) {
      console.log(`[Beckn] ${method} ${url} [Action: ${becknAction}] [Txn: ${txnId?.slice(0, 8)}] - ${status} (${duration}ms)`);
    } else {
      console.log(`[HTTP] ${method} ${url} - ${status} (${duration}ms)`);
    }
  });

  next;
  next();
}

module.exports = requestLogger;
