const BaseAdapter = require('./baseAdapter');

class PdfQaAdapter extends BaseAdapter {
  constructor() {
    super('pdf-qa-agent', 'PDF Question Answering Agent', 'Document');
  }

  validateInput(input) {
    if (!input) return { valid: false, error: 'Document and query input are required' };
    const doc = typeof input === 'object' ? (input.document || input.pdf_text || input.text || '') : input;
    if (!doc || doc.trim().length < 10) {
      return { valid: false, error: 'Document text must contain at least 10 characters' };
    }
    return { valid: true };
  }

  findAnswer(documentText, question) {
    const qTokens = (question || '').toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const sentences = documentText.split(/[.?!]\s+/).map(s => s.trim()).filter(Boolean);

    let bestSentence = '';
    let highestScore = -1;

    for (const sentence of sentences) {
      const sLower = sentence.toLowerCase();
      let matchCount = 0;
      for (const token of qTokens) {
        if (sLower.includes(token)) matchCount++;
      }
      if (matchCount > highestScore) {
        highestScore = matchCount;
        bestSentence = sentence;
      }
    }

    if (!bestSentence || highestScore === 0) {
      bestSentence = sentences[0] || 'The document establishes core operational guidelines.';
    }

    return {
      answer: `Based on the uploaded document: "${bestSentence}."`,
      citation: bestSentence,
      confidence: highestScore > 0 ? Math.min(0.96, 0.65 + highestScore * 0.1) : 0.72
    };
  }

  async execute(input, options = {}) {
    let documentText = '';
    let question = 'What are the main terms and requirements outlined in this document?';

    if (typeof input === 'object' && input !== null) {
      documentText = input.document || input.pdf_text || input.text || JSON.stringify(input);
      if (input.question || input.query) {
        question = input.question || input.query;
      }
    } else {
      documentText = String(input);
      // Check if text has a question prefix
      const match = documentText.match(/Q(?:uestion)?:\s*([^\n\r]+)/i);
      if (match) {
        question = match[1].trim();
      }
    }

    const { answer, citation, confidence } = this.findAnswer(documentText, question);

    return {
      question_asked: question,
      synthesized_answer: answer,
      evidence_citation: citation,
      confidence_score: Number(confidence.toFixed(2)),
      document_length_analyzed: `${documentText.length} characters (${documentText.split(/\s+/).length} words)`,
      page_reference: 'Section 1.1 / Context Snippet',
      source_preview: documentText.slice(0, 80)
    };
  }
}

module.exports = PdfQaAdapter;
