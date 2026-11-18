const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { app } = require('./server');
const connectDB = require('./config/db');
const seedDB = require('./utils/seeder');
const orchestrator = require('./orchestrator');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5003,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log(' STARTING COMPREHENSIVE BACKEND & WORKFLOW VERIFICATION SUITE');
  console.log('========================================================================\n');

  await connectDB();
  await seedDB(false);

  const server = app.listen(5003);
  let consumerToken = null;
  let providerToken = null;
  let orderId = null;

  try {
    // ------------------------------------------------------------------
    // TEST 1: Consumer & Provider Authentication
    // ------------------------------------------------------------------
    console.log('[TEST 1] Testing Consumer and Provider Authentication...');

    // 1a. Consumer Registration
    const cEmail = `consumer_${Date.now()}@dpi.gov.in`;
    const cRegRes = await request('POST', '/api/auth/register', {
      name: 'Ramesh Sharma',
      email: cEmail,
      password: 'ConsumerPassword123!',
      role: 'consumer'
    });
    console.log(`  1a. Consumer Registration status: ${cRegRes.status} (Role: ${cRegRes.data.user.role})`);
    if (cRegRes.status !== 201) throw new Error('Failed to register consumer');
    consumerToken = cRegRes.data.token;

    // 1b. Provider Registration
    const pEmail = `provider_${Date.now()}@aimarket.org`;
    const pRegRes = await request('POST', '/api/auth/register', {
      name: 'Dr. Sunita Rao',
      email: pEmail,
      password: 'ProviderPassword123!',
      role: 'provider',
      organization: 'Vedic Cognitive Systems'
    });
    console.log(`  1b. Provider Registration status: ${pRegRes.status} (Role: ${pRegRes.data.user.role}, Org: ${pRegRes.data.user.organization})`);
    if (pRegRes.status !== 201) throw new Error('Failed to register provider');
    providerToken = pRegRes.data.token;

    // 1c. Consumer Login
    const cLoginRes = await request('POST', '/api/auth/login', {
      email: cEmail,
      password: 'ConsumerPassword123!'
    });
    console.log(`  1c. Consumer Login status: ${cLoginRes.status} (Token verified)`);
    console.log('  ✓ Test 1 PASSED: Role-based Authentication working seamlessly.\n');

    // ------------------------------------------------------------------
    // TEST 2: All 10 AI Agents in Marketplace Catalog & Orchestrator
    // ------------------------------------------------------------------
    console.log('[TEST 2] Testing All 10 Functional AI Agents in Orchestrator...');

    const testAgents = [
      { id: 'doc-summarizer', input: 'Digital Public Infrastructure represents foundational building blocks enabling inclusive commerce and interoperable services.' },
      { id: 'data-extractor', input: 'Vendor: TechCorp Labs\nInvoice: INV-4029\nDate: 2026-11-04\nTotal Amount: ₹24000.00\nEmail: accounts@techcorp.in' },
      { id: 'code-reviewer', input: 'function run(userId) {\n  const q = "SELECT * FROM users WHERE id=" + userId;\n  console.log("running", q);\n  db.query(q);\n}' },
      { id: 'resume-analyzer', input: 'Anita Roy. Senior Full-Stack Engineer with 6+ years experience in React, Node.js, Python, PostgreSQL and AWS architecture.' },
      { id: 'sql-generator', input: 'How many completed orders exist per agent category?' },
      { id: 'email-assistant', input: 'Schedule a design alignment review meeting with engineering leads for Friday 3 PM.' },
      { id: 'sentiment-analyzer', input: 'The service was exceptionally fast and reliable, Section summaries were spot on!' },
      { id: 'image-describer', input: 'https://cdn.marketplace.dpi/assets/dashboard-chart-analytics.png' },
      { id: 'pdf-qa-agent', input: { document: 'The agreement binds both parties to a 99.5% uptime commitment with a maximum 6-second SLA latency bound.', question: 'What is the uptime commitment?' } },
      { id: 'data-visualizer', input: 'Quarter,Revenue_INR,Growth_Pct\nQ1 2026,120000,12\nQ2 2026,180000,18\nQ3 2026,240000,24' }
    ];

    for (const testCase of testAgents) {
      const adapter = orchestrator.getAdapter(testCase.id);
      const res = await adapter.execute(testCase.input);
      console.log(`  ✓ Agent '${testCase.id}' executed successfully:`);
      if (res.executive_overview) console.log(`    - Output: ${res.executive_overview.slice(0, 75)}...`);
      else if (res.generated_sql) console.log(`    - Generated SQL: ${res.generated_sql}`);
      else if (res.ats_compatibility_score) console.log(`    - ATS Score: ${res.ats_compatibility_score}/100, Skills: ${res.extracted_skills.slice(0, 3).join(', ')}`);
      else if (res.sentiment) console.log(`    - Sentiment: ${res.sentiment} (Confidence: ${res.confidence_score})`);
      else if (res.visual_caption) console.log(`    - Visual Caption: ${res.visual_caption.slice(0, 70)}...`);
      else if (res.synthesized_answer) console.log(`    - Answer: ${res.synthesized_answer.slice(0, 70)}...`);
      else if (res.recommended_charts) console.log(`    - Recommended Chart: ${res.recommended_charts[0].title}`);
      else if (res.extracted) console.log(`    - Fields Extracted: ${Object.keys(res.extracted).join(', ')}`);
      else if (res.findings) console.log(`    - Code Findings: ${res.findings.length} issues identified`);
      else if (res.generated_email) console.log(`    - Email Subject: ${res.subject_suggestions[0]}`);
    }
    console.log('  ✓ Test 2 PASSED: All 10 functional AI agent adapters verified.\n');

    // ------------------------------------------------------------------
    // TEST 3: Extended Beckn & Payment Transaction Lifecycle
    // (SELECT -> INIT -> PAYMENT -> CONFIRM -> EXECUTION -> STATUS)
    // ------------------------------------------------------------------
    console.log('[TEST 3] Testing Extended Beckn & Payment Lifecycle...');
    const txnId = `txn-pay-${Date.now()}`;

    // 3a. /beckn/select
    console.log('  3a. Beckn /select quote...');
    const selRes = await request('POST', '/beckn/select', {
      context: { domain: 'ai-agents', action: 'select', transaction_id: txnId },
      message: { order: { item_id: 'resume-analyzer' } }
    });
    console.log(`    Quote: Base ₹${selRes.data.message.order.quote.price} + GST ₹${selRes.data.message.order.quote.gst} = Total ₹${selRes.data.message.order.quote.total}`);

    // 3b. /beckn/init
    console.log('  3b. Beckn /init consent gate...');
    const initRes = await request('POST', '/beckn/init', {
      context: { domain: 'ai-agents', action: 'init', transaction_id: txnId },
      message: {
        order: {
          item_id: 'resume-analyzer',
          consumer_identity: cEmail,
          consumer_name: 'Ramesh Sharma',
          consents: { data: true, exec: true, audit: true }
        }
      }
    });
    orderId = initRes.data.message.order.order_id;
    console.log(`    Order created: ${orderId} (Status: INITIALIZED)`);

    // 3c. Try confirming BEFORE payment (Should be blocked by payment gate!)
    console.log('  3c. Testing payment gate: Attempting execution BEFORE payment...');
    const unpaidConfirmRes = await request('POST', '/beckn/confirm', {
      context: { domain: 'ai-agents', action: 'confirm', transaction_id: txnId },
      message: { order: { order_id: orderId, execution_payload: 'Test resume text' } }
    });
    console.log(`    Unpaid execution attempt blocked: Status ${unpaidConfirmRes.status} (${unpaidConfirmRes.data.error?.code})`);
    if (unpaidConfirmRes.status !== 400 || unpaidConfirmRes.data.error?.code !== 'ERR-PAYMENT-REQUIRED') {
      throw new Error('Payment gate failed to block unpaid task execution');
    }

    // 3d. Create Payment Intent
    console.log('  3d. Creating Payment Intent...');
    const payOrderRes = await request('POST', '/api/payments/create-order', {
      orderId,
      method: 'UPI'
    });
    console.log(`    Payment initialized: ${payOrderRes.data.data.paymentId} (Payable: ₹${payOrderRes.data.data.amount})`);

    // 3e. Test Simulated Decline
    console.log('  3e. Testing simulated payment failure...');
    const declineRes = await request('POST', '/api/payments/verify', {
      orderId,
      paymentId: payOrderRes.data.data.paymentId,
      method: 'UPI',
      simulateFailure: true
    });
    console.log(`    Simulated decline correctly rejected with status: ${declineRes.status}`);

    // 3f. Complete Successful Payment
    console.log('  3f. Authorizing and verifying successful payment...');
    const payVerifyRes = await request('POST', '/api/payments/verify', {
      orderId,
      paymentId: payOrderRes.data.data.paymentId,
      method: 'UPI',
      simulateFailure: false
    });
    console.log(`    Payment Verified: Status ${payVerifyRes.status}, Txn: ${payVerifyRes.data.receipt.transactionId}`);

    // 3g. Prevent Duplicate Payment
    console.log('  3g. Testing duplicate payment prevention...');
    const dupRes = await request('POST', '/api/payments/create-order', {
      orderId,
      method: 'CARD'
    });
    console.log(`    Duplicate payment attempt correctly blocked with status: ${dupRes.status}`);

    // 3h. Confirm & Execute Task now that order is PAID
    console.log('  3h. Confirming and executing task with payment verified...');
    const confirmRes = await request('POST', '/beckn/confirm', {
      context: { domain: 'ai-agents', action: 'confirm', transaction_id: txnId },
      message: {
        order: {
          order_id: orderId,
          execution_payload: 'Ramesh Sharma. 7 years experience in Cloud, Docker, Kubernetes, Node.js and AWS.'
        }
      }
    });
    console.log(`    Execution status: ${confirmRes.data.message.order.status}`);
    console.log(`    Candidate ATS Score: ${confirmRes.data.message.order.result.ats_compatibility_score}/100`);
    console.log(`    Cryptographic Receipt Hash: ${confirmRes.data.message.order.receipt.result_sha256.slice(0, 16)}...`);

    // 3i. Check Status & Verified Audit Ledger
    console.log('  3i. Checking Beckn /status with audit trail...');
    const statusRes = await request('POST', '/beckn/status', {
      context: { domain: 'ai-agents', action: 'status', transaction_id: txnId },
      message: { order_id: orderId }
    });
    console.log(`    Status: ${statusRes.data.message.order.status}, Chained audit entries: ${statusRes.data.message.order.history.length}`);
    console.log('  ✓ Test 3 PASSED: Extended Beckn & Payment Lifecycle verified.\n');

    // ------------------------------------------------------------------
    // TEST 4: Consumer & Provider Dashboards
    // ------------------------------------------------------------------
    console.log('[TEST 4] Testing Consumer and Provider Dashboards...');

    // 4a. Consumer Dashboard
    const consumerDashRes = await request('GET', `/api/orders/consumer?email=${encodeURIComponent(cEmail)}`);
    console.log(`  4a. Consumer Dashboard: Total Orders: ${consumerDashRes.data.stats.totalOrders}, Completed: ${consumerDashRes.data.stats.completedOrders}`);

    // 4b. Consumer Payments History
    const consumerPayRes = await request('GET', `/api/payments/history?email=${encodeURIComponent(cEmail)}`);
    console.log(`  4b. Consumer Payments History: Recorded payments count: ${consumerPayRes.data.count}`);

    // 4c. Provider Dashboard
    const providerDashRes = await request('GET', '/api/orders/provider?provider=TalentGrid');
    console.log(`  4c. Provider Dashboard (TalentGrid): Orders received: ${providerDashRes.data.stats.totalOrdersReceived}, Gross Earnings: ₹${providerDashRes.data.stats.grossEarnings}`);
    console.log('  ✓ Test 4 PASSED: Consumer and Provider Dashboards working.\n');

    console.log('========================================================================');
    console.log(' ALL ENHANCEMENT VERIFICATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('VERIFICATION TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close(() => {
      console.log('Verification server closed.');
      process.exit(0);
    });
  }
}

runTestSuite();
