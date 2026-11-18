# DPI-Enabled AI Agent Marketplace on Beckn Protocol - Backend

A decentralized AI agent service marketplace built on Beckn Protocol principles, allowing autonomous AI agents to be discovered, evaluated, contracted, and executed across an open network without vendor lock-in.

---

## 1. Technology Stack

- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js
- **Database & ODM**: MongoDB & Mongoose
- **Authentication**: JWT (JSON Web Tokens) with role-based access control (`consumer`, `provider`, `admin`)
- **Password Security**: bcryptjs hashing
- **Protocol**: Beckn Protocol v1.1.0 (`ai-agents` domain)
- **Cryptography**: SHA-256 chained hash audit ledger (NFR-AUD.1)

---

## 2. Directory Architecture

```
backend/
├── config/
│   ├── db.js                 # Resilient MongoDB connection & auto-daemon discovery
│   └── constants.js          # Beckn domain, statuses, formula weights & SLA limits
├── controllers/
│   ├── authController.js     # User registration, login, logout, profile
│   ├── agentController.js    # Catalog management, multi-factor discovery, CRUD
│   ├── orderController.js    # Order lifecycle, consent verification, execution
│   ├── ratingController.js   # Consumer reviews, star ratings & trust updates
│   ├── slaController.js      # SLA metrics, violation reporting & benchmarks
│   └── becknController.js    # Beckn protocol operations (/search, /select, /init, /confirm, /status, /rating)
├── models/
│   ├── User.js               # User accounts with roles & bcrypt methods
│   ├── Agent.js              # Agent catalog, SLA, contracts, version history & trust methods
│   ├── Order.js              # Orders with chained SHA-256 audit ledger & DPI consent tokens
│   ├── Execution.js          # Execution orchestrator logs, token count, SLA tracking
│   ├── Rating.js             # User ratings, review tags & feedback
│   └── SLAMetric.js          # Telemetry, violations & benchmark snapshots
├── routes/
│   ├── authRoutes.js         # /api/auth/*
│   ├── agentRoutes.js        # /api/agents/*
│   ├── orderRoutes.js        # /api/orders/*
│   ├── ratingRoutes.js       # /api/ratings/*
│   ├── slaRoutes.js          # /api/sla/*
│   └── becknRoutes.js        # /beckn/*
├── middleware/
│   ├── authMiddleware.js     # JWT guard & role authorization
│   ├── errorMiddleware.js    # Standard & Beckn error formatting
│   ├── loggerMiddleware.js   # HTTP & Beckn transaction logging
│   └── validateMiddleware.js # Catalog schema diagnostics (FR-1.3)
├── services/
│   ├── authService.js        # JWT generation & authentication
│   ├── agentService.js       # Multi-attribute search & 40/30/30 ranking engine
│   ├── trustService.js       # Explainable Trust Score: T = 0.40R + 0.35S + 0.25B
│   ├── slaService.js         # Telemetry & SLA monitoring
│   └── auditService.js       # SHA-256 chain verification & ledger
├── orchestrator/
│   ├── index.js              # Task router, timeout watchdog & privacy purge
│   └── adapters/
│       ├── baseAdapter.js           # Abstract modular adapter
│       ├── documentSummarizer.js    # Adapter 1: Multi-tier summary & entity extraction
│       ├── dataExtractor.js         # Adapter 2: Schema-driven JSON extraction
│       └── codeReviewer.js          # Adapter 3: OWASP & syntactic static analysis
├── utils/
│   ├── crypto.js             # SHA-256 hashing, token generation & UUIDs
│   ├── seedData.js           # Reference catalog & demo credentials
│   └── seeder.js             # Automated DB seeder
├── server.js                 # Express application & Beckn BPP gateway
├── package.json
└── .env.example
```

---

## 3. Mathematical Models & Formulas

### A. Explainable Trust Score Formula (FR-6.2)
$$T = 0.40 \cdot R + 0.35 \cdot S + 0.25 \cdot B$$
- **$R$ (Consumer Rating)**: Weighted average rating score ($1.0 - 5.0$) from verified order completions.
- **$S$ (SLA Compliance)**: Normalized SLA adherence ($0.0 - 5.0$) derived from compliance percentage ($S = 5 \times \frac{\text{SLA Compliance}}{100}$).
- **$B$ (Benchmark Score)**: Automated synthetic benchmark score ($1.0 - 5.0$).

### B. Auto-Suspension Threshold (FR-1.5)
An agent is automatically transitioned to `SUSPENDED` if:
- $\text{SLA Compliance} < 95.0\%$ **OR**
- $\text{Trust Score } T < 3.0$

### C. Multi-Attribute Discovery Ranking Formula (FR-2.3)
$$\text{Rank Score} = 0.40 \cdot \left(\frac{T}{5}\right) + 0.30 \cdot \left(1 - \frac{\text{Latency}}{\text{MAX\_LAT}}\right) + 0.30 \cdot \left(1 - \frac{\text{Price}}{\text{MAX\_PRICE}}\right)$$
*(where $\text{MAX\_LAT} = 20\text{s}$ and $\text{MAX\_PRICE} = 20\text{ INR}$)*

---

## 4. Beckn Protocol Transaction Flow

1. **/search** (`BAP -> BPP`): Consumer specifies discovery intent (capability, category, price, latency, trust). BPP returns catalog with items, SLAs, and prices.
2. **/select** (`BAP -> BPP`): Consumer selects an item. BPP returns a binding quote (base price + 18% GST + committed SLA latency bound).
3. **/init** (`BAP -> BPP`): Consumer submits identity and grants DPI consent artifacts (`data`, `exec`, `audit`). BPP validates consent gate and issues a cryptographically-linked `consent_token` with state `INITIALIZED` and genesis SHA-256 hash.
4. **/confirm** (`BAP -> BPP`): Consumer submits task input payload. Orchestrator executes the task, purges the raw input payload upon completion (NFR-SEC.2), generates an execution receipt (duration, tokens, SHA-256 result hash), and returns result in `on_confirm`.
5. **/status** (`BAP -> BPP`): Queries order state and verified immutable audit ledger.
6. **/rating** (`BAP -> BPP`): Consumer submits feedback and 1-5 rating, triggering automatic recomputation of the agent's trust score.

---

## 5. Sample Functional AI Agent Adapters

1. **Document Summarizer (`doc-summarizer`)**:
   - Executive Overview synthesis
   - Named entity extraction (organizations, dates, financial amounts)
   - Section-by-section structured breakdown (Introduction, Observations, Recommendations)
2. **Data Extraction Agent (`data-extractor`)**:
   - Unstructured text and document parsing
   - Automatic extraction of emails, phone numbers, dates, currency amounts, and key-value pairs
   - Target JSON schema compliance validation
3. **Code Review Agent (`code-reviewer`)**:
   - Static analysis of source code and diffs
   - Detects OWASP Top 10 vulnerabilities (SQL Injection, hardcoded secrets, OS command injection, weak cryptography)
   - Code cleanliness & style detection (empty catches, console.log)
   - Generates actionable remediation report with line numbers and severity levels

---

## 6. How to Run

### Install & Configure
```bash
cd backend
npm install
cp .env.example .env
```

### Start MongoDB
Ensure MongoDB daemon is running:
```powershell
mongod --dbpath backend/data/db --port 27017
```

### Seed Initial Catalog & Users
```bash
npm run seed
```

### Start Backend Server
```bash
npm run dev
# Server listens on http://localhost:5000
```

### Run Verification Test Suite
```bash
node test-suite.js
```
