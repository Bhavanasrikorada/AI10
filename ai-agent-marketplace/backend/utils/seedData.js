const V = (change) => [
  { v: '1.0.0', date: '2026-06-20', change: 'Initial listing' },
  { v: '1.1.0', date: '2026-08-05', change }
];

const AGENTS = [
  {
    id: 'doc-summarizer',
    name: 'Document Summarizer',
    cat: 'Document',
    provider: 'BAAM Reference Labs',
    status: 'ACTIVE',
    featured: true,
    desc: 'Multi-tier extraction and structured summarisation: executive overview, key entities and section summaries.',
    tags: ['Summarisation', 'NLP', 'PDF'],
    latency: 6,
    price: 4,
    uptime: 99.9,
    slaCompliance: 99.2,
    r: 4.6,
    s: 4.8,
    b: 4.5,
    n: 128,
    input: '{ "document": "text | file", "length": "short|long" }',
    output: '{ "overview": "...", "entities": [...], "sections": [...] }',
    versions: V('Reduced latency bound from 8s to 6s'),
    reviews: [
      { user: 'Anita R.', score: 5, tags: ['Accurate', 'Fast'], text: 'Section summaries were spot on.' },
      { user: 'Dev K.', score: 4, tags: ['Reliable'], text: 'Great for long reports.' }
    ]
  },
  {
    id: 'data-extractor',
    name: 'Data Extraction Agent',
    cat: 'Data',
    provider: 'BAAM Reference Labs',
    status: 'ACTIVE',
    featured: false,
    desc: 'Turns unstructured text into validated JSON key-value objects that match your target schema.',
    tags: ['JSON', 'Schema', 'ETL'],
    latency: 5,
    price: 5,
    uptime: 99.8,
    slaCompliance: 98.7,
    r: 4.4,
    s: 4.7,
    b: 4.6,
    n: 96,
    input: '{ "text": "...", "schema": { ... } }',
    output: '{ "data": { ... }, "valid": true }',
    versions: V('Added nested schema support'),
    reviews: [
      { user: 'Meera S.', score: 5, tags: ['Schema-valid'], text: 'Never broke my schema.' }
    ]
  },
  {
    id: 'code-reviewer',
    name: 'Code Review Agent',
    cat: 'Code',
    provider: 'BAAM Reference Labs',
    status: 'ACTIVE',
    featured: true,
    desc: 'Automated syntactic, vulnerability and style analysis of diffs with remediation suggestions.',
    tags: ['Python', 'FastAPI', 'Security'],
    latency: 9,
    price: 8,
    uptime: 99.5,
    slaCompliance: 99.0,
    r: 4.7,
    s: 4.6,
    b: 4.8,
    n: 212,
    input: '{ "diff": "unified diff text" }',
    output: '{ "findings": [{ "type", "severity", "fix" }] }',
    versions: V('Added OWASP rule pack'),
    reviews: [
      { user: 'Harsha V.', score: 5, tags: ['Security', 'Helpful'], text: 'Caught an SQL injection instantly.' },
      { user: 'Chandhini L.', score: 5, tags: ['Accurate'], text: 'Fixes were ready to paste.' }
    ]
  },
  {
    id: 'resume-analyzer',
    name: 'Resume Analyzer',
    cat: 'HR',
    provider: 'TalentGrid',
    status: 'ACTIVE',
    featured: true,
    desc: 'Analyzes resumes, extracts skills and career milestones, and calculates ATS compatibility scores with improvement suggestions.',
    tags: ['Recruiting', 'ATS', 'Career'],
    latency: 6,
    price: 5,
    uptime: 99.6,
    slaCompliance: 98.5,
    r: 4.5,
    s: 4.7,
    b: 4.4,
    n: 84,
    input: '{ "resume": "text content of resume" }',
    output: '{ "candidate_summary", "ats_compatibility_score", "extracted_skills", "improvement_suggestions" }',
    versions: V('Added ATS keyword scoring engine'),
    reviews: [
      { user: 'Siddharth M.', score: 5, tags: ['Actionable', 'Fast'], text: 'The ATS suggestions directly improved interview call rates.' }
    ]
  },
  {
    id: 'sql-generator',
    name: 'SQL Query Generator',
    cat: 'Data',
    provider: 'LedgerLeaf',
    status: 'ACTIVE',
    featured: true,
    desc: 'Converts natural-language questions and requirements into optimized, syntax-validated SQL queries with indexing advice.',
    tags: ['SQL', 'PostgreSQL', 'Database'],
    latency: 4,
    price: 6,
    uptime: 99.8,
    slaCompliance: 99.4,
    r: 4.8,
    s: 4.9,
    b: 4.7,
    n: 142,
    input: '{ "question": "natural language question", "schema": "optional table schema" }',
    output: '{ "generated_sql", "query_explanation", "optimization_tips" }',
    versions: V('Added JOIN optimization and CTE support'),
    reviews: [
      { user: 'Karthik P.', score: 5, tags: ['Accurate', 'Optimized'], text: 'Generated complex GROUP BY and window functions without issues.' }
    ]
  },
  {
    id: 'email-assistant',
    name: 'Email Assistant',
    cat: 'Support',
    provider: 'HelpLoop',
    status: 'ACTIVE',
    featured: false,
    desc: 'Composes, refines, and translates executive and client emails across formal, persuasive, and concise professional tones.',
    tags: ['Writing', 'Productivity', 'Grammar'],
    latency: 3,
    price: 3,
    uptime: 99.9,
    slaCompliance: 99.7,
    r: 4.6,
    s: 4.8,
    b: 4.5,
    n: 110,
    input: '{ "text": "draft notes or topic", "tone": "formal | friendly | concise", "recipient": "Team" }',
    output: '{ "subject_suggestions", "generated_email", "grammar_check" }',
    versions: V('Enhanced corporate tone templates'),
    reviews: [
      { user: 'Sneha B.', score: 5, tags: ['Polished', 'Quick'], text: 'Turned messy meeting notes into an executive update in 3 seconds.' }
    ]
  },
  {
    id: 'sentiment-analyzer',
    name: 'Sentiment Analysis Agent',
    cat: 'Data',
    provider: 'HelpLoop',
    status: 'ACTIVE',
    featured: false,
    desc: 'Deep aspect-based sentiment, emotional radar distribution, and customer satisfaction scoring across text, reviews, and tickets.',
    tags: ['Sentiment', 'NLP', 'Customer Experience'],
    latency: 3,
    price: 2,
    uptime: 99.4,
    slaCompliance: 98.9,
    r: 4.3,
    s: 4.5,
    b: 4.2,
    n: 78,
    input: '{ "text": "review, feedback or support message" }',
    output: '{ "sentiment": "POSITIVE|NEGATIVE|NEUTRAL", "confidence_score", "emotion_distribution" }',
    versions: V('Added multi-aspect emotion radar breakdown'),
    reviews: [
      { user: 'Pooja T.', score: 4, tags: ['Nuanced'], text: 'Understands mixed reviews and sarcasm well.' }
    ]
  },
  {
    id: 'image-describer',
    name: 'Image Description Agent',
    cat: 'Vision',
    provider: 'BAAM Reference Labs',
    status: 'ACTIVE',
    featured: true,
    desc: 'Generates rich visual descriptions, accessibility alt-text, detected entity tags, and aesthetic color palettes from images.',
    tags: ['Computer Vision', 'Accessibility', 'Alt Text'],
    latency: 8,
    price: 7,
    uptime: 99.3,
    slaCompliance: 98.2,
    r: 4.7,
    s: 4.6,
    b: 4.6,
    n: 65,
    input: '{ "image": "image URL or base64 data" }',
    output: '{ "visual_caption", "accessibility_alt_text", "detected_entities", "visual_attributes" }',
    versions: V('Added WCAG accessibility compliance output'),
    reviews: [
      { user: 'Vikram S.', score: 5, tags: ['Detailed', 'Accessible'], text: 'Alt text was comprehensive and met accessibility guidelines.' }
    ]
  },
  {
    id: 'pdf-qa-agent',
    name: 'PDF Question Answering Agent',
    cat: 'Document',
    provider: 'LexiNode',
    status: 'ACTIVE',
    featured: false,
    desc: 'Performs semantic document question answering with verified textual citations, context snippets, and confidence scoring.',
    tags: ['PDF', 'Question Answering', 'Citations'],
    latency: 7,
    price: 6,
    uptime: 99.5,
    slaCompliance: 99.1,
    r: 4.6,
    s: 4.7,
    b: 4.5,
    n: 92,
    input: '{ "document": "PDF text", "question": "specific query" }',
    output: '{ "question_asked", "synthesized_answer", "evidence_citation", "confidence_score" }',
    versions: V('Added semantic sentence chunking and verification'),
    reviews: [
      { user: 'Ananya G.', score: 5, tags: ['Precise', 'Verified'], text: 'Gives exact page citations with zero hallucination.' }
    ]
  },
  {
    id: 'data-visualizer',
    name: 'Data Visualization Agent',
    cat: 'Analytics',
    provider: 'BAAM Reference Labs',
    status: 'ACTIVE',
    featured: true,
    desc: 'Analyzes tabular datasets and CSV records, derives statistical insights, and recommends production-ready interactive chart specifications.',
    tags: ['Charts', 'Analytics', 'Vega-Lite', 'CSV'],
    latency: 8,
    price: 9,
    uptime: 99.7,
    slaCompliance: 99.3,
    r: 4.8,
    s: 4.8,
    b: 4.7,
    n: 114,
    input: '{ "data": "CSV string or tabular JSON array" }',
    output: '{ "dataset_overview", "recommended_charts", "analytical_insights" }',
    versions: V('Added multi-axis trend charting specs'),
    reviews: [
      { user: 'Rohan D.', score: 5, tags: ['Insightful', 'Visual'], text: 'Turned raw quarterly CSV exports into presentation-ready chart configs.' }
    ]
  },
  {
    id: 'contract-analyzer',
    name: 'Contract Analyzer',
    cat: 'Legal',
    provider: 'LexiNode',
    status: 'ACTIVE',
    featured: false,
    desc: 'Flags risky clauses, obligations and renewal dates in contracts and amendments.',
    tags: ['Clauses', 'Risk'],
    latency: 14,
    price: 15,
    uptime: 99.2,
    slaCompliance: 97.1,
    r: 4.3,
    s: 4.2,
    b: 4.1,
    n: 41,
    input: '{ "contract": "text" }',
    output: '{ "risks": [...], "dates": [...] }',
    versions: V('Improved renewal detection'),
    reviews: []
  },
  {
    id: 'ticket-classifier',
    name: 'Ticket Categorizer',
    cat: 'Support',
    provider: 'HelpLoop',
    status: 'ACTIVE',
    featured: false,
    desc: 'Tags and routes incoming support tickets by content and urgency to cut triage time.',
    tags: ['Triage', 'Routing'],
    latency: 3,
    price: 2,
    uptime: 99.9,
    slaCompliance: 99.6,
    r: 4.5,
    s: 4.9,
    b: 4.4,
    n: 154,
    input: '{ "ticket": "text" }',
    output: '{ "category": "...", "priority": "..." }',
    versions: V('New 12-label taxonomy'),
    reviews: []
  }
];

const SEED_USERS = [
  {
    name: 'Anita Roy',
    email: 'consumer@marketplace.dpi',
    password: 'Password123!',
    role: 'consumer',
    organization: 'FinTech India Labs'
  },
  {
    name: 'BAAM Provider Admin',
    email: 'provider@baam.dpi',
    password: 'Password123!',
    role: 'provider',
    organization: 'BAAM Reference Labs'
  },
  {
    name: 'Marketplace Administrator',
    email: 'admin@beckn.dpi',
    password: 'AdminPassword123!',
    role: 'admin',
    organization: 'Beckn Open Collective'
  }
];

module.exports = {
  AGENTS,
  SEED_USERS
};
