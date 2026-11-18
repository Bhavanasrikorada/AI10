const BaseAdapter = require('./baseAdapter');

class CodeReviewerAdapter extends BaseAdapter {
  constructor() {
    super('code-reviewer', 'Code Review Agent', 'Code');
  }

  validateInput(input) {
    if (!input || (typeof input === 'string' && input.trim().length < 5)) {
      return { valid: false, error: 'Source code or diff must contain at least 5 characters' };
    }
    return { valid: true };
  }

  /**
   * Run pattern-based static code & OWASP security rules
   */
  inspectCode(code) {
    const findings = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. SQL Injection vulnerability check
      if (/SELECT.*FROM.*(\+|\$\{).*WHERE/i.test(line) || /execute\s*\(\s*["'].*\+.*["']\)/i.test(line)) {
        findings.push({
          type: 'security',
          severity: 'high',
          line: lineNum,
          cwe: 'CWE-89 (SQL Injection)',
          message: 'Possible SQL injection via raw string concatenation in database query.',
          fix: 'Use parameterized queries, prepared statements, or ORM parameter binding.'
        });
      }

      // 2. Hardcoded secrets / passwords / tokens
      if (/(password|secret|api_key|token|private_key)\s*[:=]\s*["'][a-zA-Z0-9_\-]{8,}["']/i.test(line) && !line.includes('process.env')) {
        findings.push({
          type: 'security',
          severity: 'critical',
          line: lineNum,
          cwe: 'CWE-798 (Use of Hard-coded Credentials)',
          message: 'Hardcoded secret or credential detected in source code.',
          fix: 'Store secrets in environment variables or an external key vault (e.g. process.env.API_KEY).'
        });
      }

      // 3. Command Injection
      if (/(exec|spawn|popen|system)\s*\(\s*["'].*(\+|\$\{)/i.test(line)) {
        findings.push({
          type: 'security',
          severity: 'critical',
          line: lineNum,
          cwe: 'CWE-78 (OS Command Injection)',
          message: 'Unsanitized input concatenated into system shell command execution.',
          fix: 'Pass arguments as an array instead of invoking a shell string, or sanitize rigorously.'
        });
      }

      // 4. Insecure Hashing
      if (/crypto\.createHash\s*\(\s*["'](md5|sha1)["']\)/i.test(line)) {
        findings.push({
          type: 'security',
          severity: 'medium',
          line: lineNum,
          cwe: 'CWE-328 (Use of Weak Cryptographic Hash)',
          message: 'Weak hashing algorithm (MD5/SHA-1) detected.',
          fix: 'Use SHA-256, SHA-512, or bcrypt/Argon2 for passwords.'
        });
      }

      // 5. Unhandled promise or empty catch
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
        findings.push({
          type: 'bug',
          severity: 'medium',
          line: lineNum,
          cwe: 'CWE-391 (Unchecked Error Condition)',
          message: 'Empty catch block silently swallowing exceptions.',
          fix: 'Log the error or rethrow/handle gracefully with structured logging.'
        });
      }

      // 6. Debugging statements in production code
      if (/console\.log\s*\(/.test(line) && !line.includes('// allow-console')) {
        findings.push({
          type: 'style',
          severity: 'low',
          line: lineNum,
          cwe: 'Quality / Cleanliness',
          message: 'console.log left in production code.',
          fix: 'Replace with a structured logging library or remove debug logs.'
        });
      }
    });

    // Check code length / complexity
    if (lines.length > 60) {
      findings.push({
        type: 'maintainability',
        severity: 'low',
        line: 1,
        message: `File or block length (${lines.length} lines) exceeds standard modular recommendation.`,
        fix: 'Refactor into smaller modular helper functions or separate modules.'
      });
    }

    if (findings.length === 0) {
      findings.push({
        type: 'verification',
        severity: 'info',
        line: 1,
        message: 'No critical OWASP or syntactic defects detected.',
        fix: 'Ready for integration testing and unit test suite verification.'
      });
    }

    return findings;
  }

  async execute(input, options = {}) {
    const rawCode = typeof input === 'string' ? input : (input.diff || input.source || JSON.stringify(input));
    const findings = this.inspectCode(rawCode);

    const counts = {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      info: findings.filter(f => f.severity === 'info').length
    };

    let reviewScore = 100 - (counts.critical * 35 + counts.high * 20 + counts.medium * 10 + counts.low * 5);
    reviewScore = Math.max(10, Math.min(100, reviewScore));

    return {
      review_score: reviewScore,
      summary: `Automated code analysis identified ${findings.length} findings across ${rawCode.split(/\r?\n/).length} lines.`,
      severity_counts: counts,
      findings,
      source_preview: rawCode.slice(0, 80)
    };
  }
}

module.exports = CodeReviewerAdapter;
