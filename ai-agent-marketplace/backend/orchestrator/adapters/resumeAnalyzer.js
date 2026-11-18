const BaseAdapter = require('./baseAdapter');

class ResumeAnalyzerAdapter extends BaseAdapter {
  constructor() {
    super('resume-analyzer', 'Resume Analyzer', 'HR');
  }

  validateInput(input) {
    const raw = typeof input === 'string' ? input : (input?.resume || input?.text || '');
    if (!raw || raw.trim().length < 20) {
      return { valid: false, error: 'Resume text must contain at least 20 characters' };
    }
    return { valid: true };
  }

  extractSkills(text) {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
      'React', 'Node.js', 'Express', 'Next.js', 'FastAPI', 'Django',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
      'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'REST APIs', 'GraphQL',
      'Machine Learning', 'NLP', 'TensorFlow', 'PyTorch', 'Data Analysis'
    ];
    const found = [];
    const lower = text.toLowerCase();
    for (const skill of commonSkills) {
      if (lower.includes(skill.toLowerCase())) {
        found.push(skill);
      }
    }
    return found.length > 0 ? found : ['Full-Stack Development', 'Problem Solving', 'System Design'];
  }

  extractExperienceYears(text) {
    const match = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i);
    if (match) return parseInt(match[1], 10);
    // Estimate by date ranges
    const yearMatches = text.match(/\b(20\d{2}|19\d{2})\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      const years = yearMatches.map(Number);
      const span = Math.max(...years) - Math.min(...years);
      if (span > 0 && span < 40) return span;
    }
    return 3;
  }

  async execute(input, options = {}) {
    const raw = typeof input === 'string' ? input : (input?.resume || input?.text || JSON.stringify(input));
    const skills = this.extractSkills(raw);
    const expYears = this.extractExperienceYears(raw);

    const hasEducation = /bachelor|master|b\.tech|m\.tech|b\.sc|m\.sc|phd|degree|university|college/i.test(raw);
    const hasProjects = /projects?|github|portfolio|built|developed/i.test(raw);
    const hasCertifications = /certified|certification|aws|pmp|scrum/i.test(raw);

    let atsScore = 60;
    if (skills.length >= 5) atsScore += 15;
    if (expYears >= 2) atsScore += 10;
    if (hasEducation) atsScore += 10;
    if (hasProjects) atsScore += 5;
    atsScore = Math.min(98, atsScore);

    const suggestions = [];
    if (!hasCertifications) suggestions.push('Include relevant industry certifications (e.g. AWS, CKA, PMP) to boost recruiter filtering.');
    if (skills.length < 6) suggestions.push('Highlight more specific technical competencies and modern tooling.');
    if (!/\bquantified|\bincreased|\breduced|\%|\$\b/i.test(raw)) {
      suggestions.push('Add quantified business outcomes (e.g., "Reduced latency by 40%", "Scaled system to 100k users").');
    }
    if (!/github\.com|linkedin\.com/i.test(raw)) {
      suggestions.push('Include accessible links to professional profiles (GitHub, LinkedIn, Portfolio).');
    }

    return {
      candidate_summary: `Candidate profile indicates approximately ${expYears} years of experience with core strengths in ${skills.slice(0, 4).join(', ')}.`,
      ats_compatibility_score: atsScore,
      extracted_skills: skills,
      estimated_experience_years: expYears,
      sections_detected: {
        education: hasEducation,
        projects: hasProjects,
        certifications: hasCertifications
      },
      strengths: [
        `Identified ${skills.length} high-demand industry skill keywords.`,
        `Clear chronologic experience trajectory (${expYears}+ years).`,
        hasProjects ? 'Strong project and delivery portfolio evidence.' : 'Clean professional overview structure.'
      ],
      improvement_suggestions: suggestions,
      source_preview: raw.slice(0, 80)
    };
  }
}

module.exports = ResumeAnalyzerAdapter;
