const BaseAdapter = require('./adapters/baseAdapter');
const DocumentSummarizerAdapter = require('./adapters/documentSummarizer');
const DataExtractorAdapter = require('./adapters/dataExtractor');
const CodeReviewerAdapter = require('./adapters/codeReviewer');
const ResumeAnalyzerAdapter = require('./adapters/resumeAnalyzer');
const SqlGeneratorAdapter = require('./adapters/sqlGenerator');
const EmailAssistantAdapter = require('./adapters/emailAssistant');
const SentimentAnalyzerAdapter = require('./adapters/sentimentAnalyzer');
const ImageDescriberAdapter = require('./adapters/imageDescriber');
const PdfQaAdapter = require('./adapters/pdfQaAgent');
const DataVisualizerAdapter = require('./adapters/dataVisualizer');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Execution = require('../models/Execution');
const SLAMetric = require('../models/SLAMetric');
const { sha256 } = require('../utils/crypto');

class GenericAgentAdapter extends BaseAdapter {
  constructor(id, name, cat) {
    super(id, name, cat);
  }

  async execute(input, options = {}) {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    return {
      status: 'PROCESSED',
      summary: `${this.name} processed the request successfully.`,
      category: this.category,
      source_preview: raw.slice(0, 80),
      processed_at: new Date().toISOString()
    };
  }
}

class Orchestrator {
  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }

  registerDefaultAdapters() {
    this.registerAdapter('doc-summarizer', new DocumentSummarizerAdapter());
    this.registerAdapter('data-extractor', new DataExtractorAdapter());
    this.registerAdapter('code-reviewer', new CodeReviewerAdapter());
    this.registerAdapter('resume-analyzer', new ResumeAnalyzerAdapter());
    this.registerAdapter('resume-screener', new ResumeAnalyzerAdapter());
    this.registerAdapter('sql-generator', new SqlGeneratorAdapter());
    this.registerAdapter('email-assistant', new EmailAssistantAdapter());
    this.registerAdapter('sentiment-analyzer', new SentimentAnalyzerAdapter());
    this.registerAdapter('image-describer', new ImageDescriberAdapter());
    this.registerAdapter('pdf-qa-agent', new PdfQaAdapter());
    this.registerAdapter('data-visualizer', new DataVisualizerAdapter());
  }

  registerAdapter(agentId, adapterInstance) {
    this.adapters.set(agentId, adapterInstance);
  }

  getAdapter(agentId, agentDoc = null) {
    if (this.adapters.has(agentId)) {
      return this.adapters.get(agentId);
    }
    // Dynamic fallback adapter for other registered agents
    const name = agentDoc ? agentDoc.name : agentId;
    const cat = agentDoc ? agentDoc.cat : 'General';
    const generic = new GenericAgentAdapter(agentId, name, cat);
    this.adapters.set(agentId, generic);
    return generic;
  }

  /**
   * Orchestrate task execution for an initialized/confirmed order
   */
  async executeTask(orderId, payload, options = {}) {
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const agent = await Agent.findOne({ id: order.agentId });
    if (!agent) {
      throw new Error(`Agent ${order.agentId} not found`);
    }

    if (agent.status === 'SUSPENDED' || agent.status === 'MAINTENANCE') {
      throw new Error(`Cannot execute task: Agent ${agent.name} is currently ${agent.status}`);
    }

    // Payment verification enforcement check
    if (order.paymentStatus !== 'PAID' && !options.allowUnpaid && !options.isDemoMode) {
      throw new Error('ERR-PAYMENT-REQUIRED: Payment verification required before task execution can begin.');
    }

    const inputPayload = payload !== undefined ? payload : order.payload;
    const adapter = this.getAdapter(agent.id, agent);

    // 1. Validate Input against adapter contract
    const validation = adapter.validateInput(inputPayload);
    if (!validation.valid) {
      order.transitionState('FAILED', { error: `Validation error: ${validation.error}` });
      await order.save();
      throw new Error(validation.error);
    }

    // 2. Transition to QUEUED
    order.transitionState('QUEUED');
    await order.save();

    // Small dispatch queue pause (simulation of distributed queue)
    await new Promise((r) => setTimeout(r, options.queueDelayMs || 400));

    // 3. Transition to PROCESSING
    order.transitionState('PROCESSING');
    await order.save();

    const startTime = Date.now();
    const slaTimeoutMs = (agent.latency || 10) * 1000;
    const forceTimeout = options.forceTimeout || false;

    // Create execution audit record
    const executionRecord = new Execution({
      orderId: order.id,
      agentId: agent.id,
      status: 'PROCESSING',
      startTime: new Date(startTime),
      inputSha256: sha256(inputPayload || ''),
      slaLimitSec: agent.latency
    });
    await executionRecord.save();

    // 4. Execute with timeout watchdog enforcement (FR-4.5)
    try {
      if (forceTimeout) {
        throw new Error('ERR-EXEC-SLA-TIMEOUT');
      }

      // Execute adapter logic wrapped in timeout promise
      const result = await Promise.race([
        adapter.execute(inputPayload, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('ERR-EXEC-SLA-TIMEOUT')), slaTimeoutMs)
        )
      ]);

      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const tokensUsed = adapter.estimateTokens(inputPayload, result);
      const resultSha256 = sha256(result);

      const receipt = {
        duration_ms: durationMs,
        tokens_used: tokensUsed,
        timestamp: new Date().toISOString(),
        result_sha256: resultSha256
      };

      // Transition to COMPLETED with privacy purge (NFR-SEC.2)
      order.transitionState('COMPLETED', {
        payload: null, // purged for confidentiality
        result,
        receipt,
        error: null
      });
      await order.save();

      // Update execution record
      executionRecord.status = 'COMPLETED';
      executionRecord.endTime = new Date(endTime);
      executionRecord.durationMs = durationMs;
      executionRecord.tokensUsed = tokensUsed;
      executionRecord.outputSha256 = resultSha256;
      await executionRecord.save();

      // Update Agent performance stats
      agent.successfulExecutions = (agent.successfulExecutions || 0) + 1;
      agent.totalExecutionTimeMs = (agent.totalExecutionTimeMs || 0) + durationMs;
      await agent.save();

      // Record successful SLA Metric
      await SLAMetric.create({
        agentId: agent.id,
        eventType: 'EXECUTION',
        executionTimeMs: durationMs,
        slaLimitSec: agent.latency,
        success: true,
        complianceSnapshot: agent.slaCompliance
      });

      return {
        order,
        result,
        receipt
      };
    } catch (err) {
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const isTimeout = err.message.includes('ERR-EXEC-SLA-TIMEOUT');

      const failedState = isTimeout ? 'TIMED_OUT' : 'FAILED';
      const errorMessage = isTimeout
        ? 'ERR-EXEC-SLA-TIMEOUT: Execution latency exceeded the committed SLA bound'
        : err.message;

      order.transitionState(failedState, {
        payload: null,
        error: errorMessage
      });
      await order.save();

      executionRecord.status = failedState;
      executionRecord.endTime = new Date(endTime);
      executionRecord.durationMs = durationMs;
      executionRecord.slaBreached = isTimeout;
      executionRecord.error = errorMessage;
      await executionRecord.save();

      // Deduct SLA compliance for SLA breach
      agent.failedExecutions = (agent.failedExecutions || 0) + 1;
      if (isTimeout) {
        agent.slaCompliance = Math.max(0, +(agent.slaCompliance - 0.6).toFixed(1));
        agent.s = Math.max(1, +(agent.slaCompliance / 20).toFixed(2));
        agent.calculateTrustScore(); // triggers auto-suspension if below threshold
      }
      await agent.save();

      // Record violation
      await SLAMetric.create({
        agentId: agent.id,
        eventType: 'VIOLATION',
        executionTimeMs: durationMs,
        slaLimitSec: agent.latency,
        success: false,
        violationType: isTimeout ? 'TIMEOUT' : 'EXEC_ERROR',
        complianceSnapshot: agent.slaCompliance,
        details: { error: errorMessage }
      });

      throw err;
    }
  }
}

// Export singleton instance
const orchestrator = new Orchestrator();
module.exports = orchestrator;
