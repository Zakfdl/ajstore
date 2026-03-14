#!/usr/bin/env node
/**
 * AJStore Audit Report — Data Validation Script
 * Checks all JSON data files for completeness and integrity.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function loadJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    failed++;
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.log(`❌ Invalid JSON in ${filename}: ${e.message}`);
    failed++;
    return null;
  }
}

// ── Validate audit-findings.json ─────────────────────────────────────────────
console.log('\n📋 Validating audit-findings.json');
const findings = loadJSON('audit-findings.json');
if (findings) {
  assert(findings.meta, 'Has meta object');
  assert(findings.meta?.client, 'meta.client is set');
  assert(findings.scores && typeof findings.scores === 'object', 'Has scores object');
  assert(Array.isArray(findings.findings), 'findings is an array');
  assert(findings.findings.length >= 10, `Has at least 10 findings (found: ${findings.findings.length})`);
  assert(Array.isArray(findings.strengths), 'strengths is an array');
  assert(findings.strengths.length >= 3, `Has at least 3 strengths (found: ${findings.strengths?.length})`);

  // Check each finding has required fields
  const requiredFindingFields = ['id', 'title', 'category', 'severity', 'revenue_impact', 'fix_phase'];
  let allFindingsValid = true;
  for (const f of findings.findings) {
    for (const field of requiredFindingFields) {
      if (!f[field]) {
        console.log(`  ❌ Finding ${f.id || '?'} missing field: ${field}`);
        allFindingsValid = false;
        failed++;
      }
    }
  }
  if (allFindingsValid) {
    console.log(`  ✅ All ${findings.findings.length} findings have required fields`);
    passed++;
  }

  // Validate severity values
  const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const invalidSeverities = findings.findings.filter(f => !validSeverities.includes(f.severity));
  assert(invalidSeverities.length === 0, `All findings have valid severity values`);

  // Check Core Web Vitals
  assert(findings.core_web_vitals?.lcp, 'Has LCP metric');
  assert(findings.core_web_vitals?.cls, 'Has CLS metric');
}

// ── Validate recommendations.json ───────────────────────────────────────────
console.log('\n🎯 Validating recommendations.json');
const recs = loadJSON('recommendations.json');
if (recs) {
  assert(Array.isArray(recs.recommendations), 'recommendations is an array');
  assert(recs.recommendations.length >= 20, `Has at least 20 recommendations (found: ${recs.recommendations.length})`);

  const phases = [...new Set(recs.recommendations.map(r => r.phase))].sort();
  assert(phases.includes(1) && phases.includes(2) && phases.includes(3), `Has recommendations for all 3 phases (found: ${phases})`);

  // Check each recommendation has required fields
  const requiredRecFields = ['id', 'phase', 'title', 'category', 'priority', 'effort', 'impact'];
  let allRecsValid = true;
  for (const r of recs.recommendations) {
    for (const field of requiredRecFields) {
      if (!r[field]) {
        console.log(`  ❌ Recommendation ${r.id || '?'} missing field: ${field}`);
        allRecsValid = false;
        failed++;
      }
    }
  }
  if (allRecsValid) {
    console.log(`  ✅ All ${recs.recommendations.length} recommendations have required fields`);
    passed++;
  }

  // Check IDs are unique
  const ids = recs.recommendations.map(r => r.id);
  const uniqueIds = new Set(ids);
  assert(ids.length === uniqueIds.size, 'All recommendation IDs are unique');

  // Phase distribution
  for (const phase of [1, 2, 3]) {
    const count = recs.recommendations.filter(r => r.phase === phase).length;
    assert(count >= 4, `Phase ${phase} has at least 4 recommendations (found: ${count})`);
  }
}

// ── Validate competitive-benchmark.json ─────────────────────────────────────
console.log('\n🏆 Validating competitive-benchmark.json');
const bench = loadJSON('competitive-benchmark.json');
if (bench) {
  assert(Array.isArray(bench.competitors), 'competitors is an array');
  assert(bench.competitors.length >= 3, `Has at least 3 competitors (found: ${bench.competitors.length})`);
  assert(Array.isArray(bench.feature_comparison), 'feature_comparison is an array');
  assert(bench.feature_comparison.length >= 8, `Has at least 8 features compared (found: ${bench.feature_comparison.length})`);

  // AJStore must be included in comparisons
  const hasAjstore = bench.competitors.some(c => c.id === 'ajstore');
  assert(hasAjstore, 'AJStore is included as a competitor entry');

  // Check all comparison entries have AJStore data
  const missingAjstore = bench.feature_comparison.filter(f => !f.ajstore);
  assert(missingAjstore.length === 0, 'All feature comparisons include AJStore data');
}

// ── Validate roadmap.json ────────────────────────────────────────────────────
console.log('\n🗺️  Validating roadmap.json');
const roadmap = loadJSON('roadmap.json');
if (roadmap) {
  assert(Array.isArray(roadmap.phases), 'phases is an array');
  assert(roadmap.phases.length === 3, `Has exactly 3 phases (found: ${roadmap.phases.length})`);

  for (const phase of roadmap.phases) {
    assert(phase.name, `Phase ${phase.phase} has a name`);
    assert(phase.timeline, `Phase ${phase.phase} has a timeline`);
    assert(Array.isArray(phase.tasks) && phase.tasks.length > 0, `Phase ${phase.phase} has tasks`);
    assert(phase.success_metrics, `Phase ${phase.phase} has success metrics`);
  }

  // Cross-reference: all roadmap task rec_ids should exist in recommendations
  if (recs) {
    const recIds = new Set(recs.recommendations.map(r => r.id));
    let allRefValid = true;
    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (!recIds.has(task.rec_id)) {
          console.log(`  ❌ Roadmap references unknown rec_id: ${task.rec_id} (Phase ${phase.phase})`);
          allRefValid = false;
          failed++;
        }
      }
    }
    if (allRefValid) {
      const totalTasks = roadmap.phases.reduce((sum, p) => sum + p.tasks.length, 0);
      console.log(`  ✅ All ${totalTasks} roadmap tasks reference valid recommendation IDs`);
      passed++;
    }
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`📊 Validation Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('❌ Validation FAILED — fix errors above before committing.');
  process.exit(1);
} else {
  console.log('✅ All validations passed — data is clean and consistent.');
}
console.log('═'.repeat(50));
