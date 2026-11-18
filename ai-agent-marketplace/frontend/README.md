# AI Agent Marketplace – React Frontend (BAAM)

Frontend for **Project 10: DPI-Enabled AI Agent Marketplace on Beckn** (Team AI-10).
Palette: parrot green (#4CC43A) + charcoal/grey.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Pages → SRS mapping
| Route | Page | SRS |
|---|---|---|
| `/` | Home (hero, spotlight, templates, flow, FAQ) | overview, UC-01 entry |
| `/marketplace` | Discovery with filters + ranking | FR-2.1–2.4, FR-1.5 |
| `/agents/:id` | Agent detail, contract, versions, reviews | FR-1.1, FR-1.4, FR-6.5 |
| `/compare` | Side-by-side (max 4) | FR-2.5 |
| `/checkout/:id` | /select → /init (consent gate) → /confirm | FR-3.1–3.4, UC-02 |
| `/orders/:id` | Execution status, result, receipt, rating | FR-4.x, FR-3.5, FR-6.1 |
| `/orders` | Audit ledger with SHA-256 chain | FR-3.6, NFR-AUD.1 |
| `/provider` | Register / update / deregister, status | FR-1.2–1.5 |
| `/trust` | Trust formula, SLA, benchmarks, auto-suspend | FR-6.2–6.4 |

## Connecting a backend later
All data is mocked in `src/data.js` and `src/store.jsx`. Replace the store functions
(`createOrder`, `transition`, `saveAgent`, `addRating`…) and the catalog with calls to your
BPP endpoints (`/search`, `/select`, `/init`, `/confirm`).
