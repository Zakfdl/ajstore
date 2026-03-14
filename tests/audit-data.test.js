#!/usr/bin/env node
/**
 * AJStore Audit Report — Test Suite
 * Lightweight tests for data integrity and report completeness.
 * No external test runner required — runs with plain Node.js.
 *
 * Usage: npm test  OR  node tests/audit-data.test.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const DOCS = path.join(ROOT, 'docs');

// ── Minimal test runner ───────────────────────────────────────────────────────
let tests = 0;
let passed = 0;
let failed = 0;
const failures = [];

function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name, fn) {
  tests++;
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     → ${e.message}`);
    failed++;
    failures.push({ test: name, error: e.message });
  }
}

function expect(value) {
  return {
    toBe: (expected) => {
      if (value !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
    },
    toEqual: (expected) => {
      if (JSON.stringify(value) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
    },
    toBeTruthy: () => {
      if (!value) throw new Error(`Expected truthy, got ${JSON.stringify(value)}`);
    },
    toBeFalsy: () => {
      if (value) throw new Error(`Expected falsy, got ${JSON.stringify(value)}`);
    },
    toBeGreaterThan: (n) => {
      if (!(value > n)) throw new Error(`Expected ${value} > ${n}`);
    },
    toBeGreaterThanOrEqual: (n) => {
      if (!(value >= n)) throw new Error(`Expected ${value} >= ${n}`);
    },
    toBeLessThan: (n) => {
      if (!(value < n)) throw new Error(`Expected ${value} < ${n}`);
    },
    toContain: (item) => {
      if (!value.includes(item)) throw new Error(`Expected array/string to contain ${JSON.stringify(item)}`);
    },
    toHaveLength: (n) => {
      if (value.length !== n) throw new Error(`Expected length ${n}, got ${value.length}`);
    },
    toHaveProperty: (key) => {
      if (!(key in value)) throw new Error(`Expected object to have property: ${key}`);
    },
  };
}

// ── Load all data ────────────────────────────────────────────────────────────
const auditData     = JSON.parse(fs.readFileSync(path.join(DATA, 'audit-findings.json'), 'utf-8'));
const recsData      = JSON.parse(fs.readFileSync(path.join(DATA, 'recommendations.json'), 'utf-8'));
const benchData     = JSON.parse(fs.readFileSync(path.join(DATA, 'competitive-benchmark.json'), 'utf-8'));
const roadmapData   = JSON.parse(fs.readFileSync(path.join(DATA, 'roadmap.json'), 'utf-8'));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('File Integrity', () => {
  it('audit-findings.json exists and is valid JSON', () => {
    expect(auditData).toBeTruthy();
    expect(typeof auditData).toBe('object');
  });
  it('recommendations.json exists and is valid JSON', () => {
    expect(recsData).toBeTruthy();
  });
  it('competitive-benchmark.json exists and is valid JSON', () => {
    expect(benchData).toBeTruthy();
  });
  it('roadmap.json exists and is valid JSON', () => {
    expect(roadmapData).toBeTruthy();
  });
  it('docs/report.html exists', () => {
    const exists = fs.existsSync(path.join(DOCS, 'report.html'));
    expect(exists).toBe(true);
  });
});

describe('Audit Findings', () => {
  it('has at least 10 findings', () => {
    expect(auditData.findings.length).toBeGreaterThanOrEqual(10);
  });
  it('has at least 4 strengths', () => {
    expect(auditData.strengths.length).toBeGreaterThanOrEqual(4);
  });
  it('has scores for all key dimensions', () => {
    expect(auditData.scores).toHaveProperty('ux');
    expect(auditData.scores).toHaveProperty('mobile');
    expect(auditData.scores).toHaveProperty('seo');
    expect(auditData.scores).toHaveProperty('cro');
    expect(auditData.scores).toHaveProperty('brand');
  });
  it('all scores are between 0 and 100', () => {
    for (const [key, val] of Object.entries(auditData.scores)) {
      if (typeof val.score === 'number') {
        if (val.score < 0 || val.score > 100)
          throw new Error(`Score out of range for ${key}: ${val.score}`);
      }
    }
  });
  it('all findings have required fields', () => {
    const required = ['id', 'title', 'category', 'severity', 'fix_phase'];
    for (const f of auditData.findings) {
      for (const field of required) {
        if (!f[field]) throw new Error(`Finding ${f.id} missing: ${field}`);
      }
    }
  });
  it('all finding IDs are unique', () => {
    const ids = auditData.findings.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('all severities are valid values', () => {
    const valid = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
    for (const f of auditData.findings) {
      if (!valid.has(f.severity))
        throw new Error(`Invalid severity '${f.severity}' in finding ${f.id}`);
    }
  });
  it('has at least 1 CRITICAL finding', () => {
    const criticals = auditData.findings.filter(f => f.severity === 'CRITICAL');
    expect(criticals.length).toBeGreaterThan(0);
  });
  it('has Core Web Vitals data', () => {
    expect(auditData.core_web_vitals).toHaveProperty('lcp');
    expect(auditData.core_web_vitals).toHaveProperty('cls');
    expect(auditData.core_web_vitals).toHaveProperty('inp');
  });
  it('fix_phase is 1, 2, or 3 for all findings', () => {
    const valid = new Set([1, 2, 3]);
    for (const f of auditData.findings) {
      if (!valid.has(f.fix_phase))
        throw new Error(`Invalid fix_phase '${f.fix_phase}' in finding ${f.id}`);
    }
  });
});

describe('Recommendations', () => {
  it('has at least 20 recommendations', () => {
    expect(recsData.recommendations.length).toBeGreaterThanOrEqual(20);
  });
  it('covers all 3 phases', () => {
    const phases = new Set(recsData.recommendations.map(r => r.phase));
    expect(phases.has(1)).toBe(true);
    expect(phases.has(2)).toBe(true);
    expect(phases.has(3)).toBe(true);
  });
  it('Phase 1 has at least 6 quick wins', () => {
    const p1 = recsData.recommendations.filter(r => r.phase === 1);
    expect(p1.length).toBeGreaterThanOrEqual(6);
  });
  it('all recommendation IDs are unique', () => {
    const ids = recsData.recommendations.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('all recommendations have effort and impact fields', () => {
    for (const r of recsData.recommendations) {
      if (!r.effort) throw new Error(`Recommendation ${r.id} missing effort`);
      if (!r.impact) throw new Error(`Recommendation ${r.id} missing impact`);
    }
  });
  it('all recommendations have success_metrics', () => {
    const missing = recsData.recommendations.filter(r => !r.success_metrics || r.success_metrics.length === 0);
    if (missing.length > 0)
      throw new Error(`${missing.length} recommendations missing success_metrics: ${missing.map(r => r.id).join(', ')}`);
  });
  it('all recommendations have an owner field', () => {
    for (const r of recsData.recommendations) {
      if (!r.owner) throw new Error(`Recommendation ${r.id} missing owner`);
    }
  });
});

describe('Competitive Benchmark', () => {
  it('includes at least 3 competitors', () => {
    expect(benchData.competitors.length).toBeGreaterThanOrEqual(3);
  });
  it('AJStore is included as a competitor', () => {
    const ids = benchData.competitors.map(c => c.id);
    expect(ids).toContain('ajstore');
  });
  it('has at least 8 features compared', () => {
    expect(benchData.feature_comparison.length).toBeGreaterThanOrEqual(8);
  });
  it('all feature comparisons include AJStore data', () => {
    for (const f of benchData.feature_comparison) {
      if (!f.ajstore)
        throw new Error(`Feature '${f.feature}' missing AJStore comparison data`);
    }
  });
  it('all feature comparison entries have a category', () => {
    for (const f of benchData.feature_comparison) {
      if (!f.category)
        throw new Error(`Feature '${f.feature}' missing category`);
    }
  });
});

describe('Roadmap', () => {
  it('has exactly 3 phases', () => {
    expect(roadmapData.phases).toHaveLength(3);
  });
  it('Phase 1 covers 0-30 days', () => {
    const p1 = roadmapData.phases.find(p => p.phase === 1);
    expect(p1.timeline).toContain('30');
  });
  it('all phases have tasks', () => {
    for (const phase of roadmapData.phases) {
      if (!phase.tasks || phase.tasks.length === 0)
        throw new Error(`Phase ${phase.phase} has no tasks`);
    }
  });
  it('all phases have success metrics', () => {
    for (const phase of roadmapData.phases) {
      if (!phase.success_metrics)
        throw new Error(`Phase ${phase.phase} missing success_metrics`);
    }
  });
  it('all roadmap task rec_ids reference valid recommendations', () => {
    const recIds = new Set(recsData.recommendations.map(r => r.id));
    for (const phase of roadmapData.phases) {
      for (const task of phase.tasks) {
        if (!recIds.has(task.rec_id))
          throw new Error(`Phase ${phase.phase} task references unknown rec_id: ${task.rec_id}`);
      }
    }
  });
  it('total roadmap task count matches total recommendations count approximately', () => {
    const totalTasks = roadmapData.phases.reduce((s, p) => s + p.tasks.length, 0);
    expect(totalTasks).toBeGreaterThan(15);
  });
});

describe('Report HTML', () => {
  const reportHtml = fs.readFileSync(path.join(DOCS, 'report.html'), 'utf-8');

  it('report.html is not empty', () => {
    expect(reportHtml.length).toBeGreaterThan(10000);
  });
  it('report contains Executive Summary section', () => {
    if (!reportHtml.includes('Executive Summary'))
      throw new Error('Missing "Executive Summary" in report');
  });
  it('report contains Roadmap section', () => {
    if (!reportHtml.includes('Roadmap') && !reportHtml.includes('roadmap'))
      throw new Error('Missing roadmap section in report');
  });
  it('report contains all 3 phase labels', () => {
    if (!reportHtml.includes('Phase 1') || !reportHtml.includes('Phase 2') || !reportHtml.includes('Phase 3'))
      throw new Error('Missing one or more phase labels');
  });
  it('report is valid UTF-8 with no null bytes', () => {
    if (reportHtml.includes('\x00'))
      throw new Error('Report contains null bytes');
  });
  it('report references ajstore.com', () => {
    if (!reportHtml.includes('ajstore'))
      throw new Error('Report does not mention ajstore');
  });
  it('report has title tag', () => {
    if (!reportHtml.includes('<title>'))
      throw new Error('Report missing <title> tag');
  });
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`\n🧪 Tests: ${tests} total  |  ✅ ${passed} passed  |  ❌ ${failed} failed\n`);
if (failures.length > 0) {
  console.log('Failed tests:');
  failures.forEach(f => console.log(`  ❌ ${f.test}\n     ${f.error}`));
}
console.log('═'.repeat(50));

if (failed > 0) process.exit(1);
