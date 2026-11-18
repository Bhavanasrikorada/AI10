const BaseAdapter = require('./baseAdapter');

class SentimentAnalyzerAdapter extends BaseAdapter {
  constructor() {
    super('sentiment-analyzer', 'Sentiment Analyzer', 'Data');
  }

  validateInput(input) {
    const raw = typeof input === 'string' ? input : (input?.text || input?.review || '');
    if (!raw || raw.trim().length < 3) {
      return { valid: false, error: 'Input text must contain at least 3 characters' };
    }
    return { valid: true };
  }

  analyze(text) {
    const posWords = ['excellent', 'great', 'love', 'amazing', 'fast', 'reliable', 'helpful', 'accurate', 'superb', 'best', 'good', 'satisfied', 'positive', 'impressed', 'clean', 'spot on'];
    const negWords = ['terrible', 'slow', 'hate', 'bad', 'broken', 'error', 'bug', 'fail', 'failed', 'horrible', 'poor', 'worst', 'issue', 'crash', 'difficult', 'dissatisfied'];

    const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
    let posCount = 0;
    let negCount = 0;

    for (const t of tokens) {
      if (posWords.includes(t)) posCount++;
      if (negWords.includes(t)) negCount++;
    }

    let polarity = 0;
    let label = 'NEUTRAL';
    const total = posCount + negCount;

    if (posCount > negCount) {
      polarity = +(posCount / (total || 1)).toFixed(2);
      label = 'POSITIVE';
    } else if (negCount > posCount) {
      polarity = +(-negCount / (total || 1)).toFixed(2);
      label = 'NEGATIVE';
    }

    return {
      label,
      score: Math.abs(polarity) || 0.5,
      polarity,
      positiveMatches: posCount,
      negativeMatches: negCount
    };
  }

  async execute(input, options = {}) {
    const raw = typeof input === 'string' ? input : (input?.text || JSON.stringify(input));
    const analysis = this.analyze(raw);

    return {
      sentiment: analysis.label,
      confidence_score: analysis.score,
      polarity_index: analysis.polarity,
      emotion_distribution: {
        satisfaction: analysis.label === 'POSITIVE' ? 0.85 : 0.15,
        trust: analysis.label === 'POSITIVE' ? 0.80 : 0.25,
        frustration: analysis.label === 'NEGATIVE' ? 0.75 : 0.05,
        neutrality: analysis.label === 'NEUTRAL' ? 0.80 : 0.10
      },
      keyword_highlights: {
        positive: analysis.positiveMatches,
        negative: analysis.negativeMatches
      },
      summary: `The text is primarily ${analysis.label.toLowerCase()} with a polarity rating of ${analysis.polarity}.`,
      source_preview: raw.slice(0, 80)
    };
  }
}

module.exports = SentimentAnalyzerAdapter;
