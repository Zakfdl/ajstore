#!/usr/bin/env node
/**
 * AJStore Audit Report — Build Script
 * Validates all data files and copies final assets to dist/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DOCS_DIR = path.join(ROOT, 'docs');
const DIST_DIR = path.join(ROOT, 'dist');

const REQUIRED_DATA_FILES = [
  'audit-findings.json',
  'recommendations.json',
  'competitive-benchmark.json',
  'roadmap.json',
];

const REQUIRED_DOCS = [
  'report.html',
];

let errors = 0;
let warnings = 0;

function log(level, message) {
  const icons = { INFO: '📋', OK: '✅', WARN: '⚠️ ', ERROR: '❌', BUILD: '🔨' };
  console.log(`${icons[level] || '  '} [${level}] ${message}`);
}

// ── Step 1: Validate data files ──────────────────────────────────────────────
log('BUILD', 'Validating data files...');

for (const file of REQUIRED_DATA_FILES) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    log('ERROR', `Missing required data file: data/${file}`);
    errors++;
    continue;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    log('OK', `data/${file} — valid JSON (${(raw.length / 1024).toFixed(1)} KB)`);
    // Specific validations
    if (file === 'audit-findings.json') {
      const count = parsed.findings?.length || 0;
      log('INFO', `  → ${count} audit findings loaded`);
      if (count === 0) { log('WARN', '  → No findings found!'); warnings++; }
    }
    if (file === 'recommendations.json') {
      const count = parsed.recommendations?.length || 0;
      log('INFO', `  → ${count} recommendations loaded`);
      const phases = [...new Set(parsed.recommendations?.map(r => r.phase))];
      log('INFO', `  → Phases: ${phases.join(', ')}`);
    }
    if (file === 'roadmap.json') {
      const phases = parsed.phases?.length || 0;
      log('INFO', `  → ${phases} roadmap phases loaded`);
    }
  } catch (e) {
    log('ERROR', `Invalid JSON in data/${file}: ${e.message}`);
    errors++;
  }
}

// ── Step 2: Validate docs ────────────────────────────────────────────────────
log('BUILD', '\nValidating docs...');

for (const file of REQUIRED_DOCS) {
  const filePath = path.join(DOCS_DIR, file);
  if (!fs.existsSync(filePath)) {
    log('ERROR', `Missing required doc: docs/${file}`);
    errors++;
  } else {
    const stat = fs.statSync(filePath);
    log('OK', `docs/${file} — ${(stat.size / 1024).toFixed(1)} KB`);
  }
}

// ── Step 3: Build summary ────────────────────────────────────────────────────
log('BUILD', '\nPreparing dist/ directory...');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Copy report.html to dist/
const srcReport = path.join(DOCS_DIR, 'report.html');
const dstReport = path.join(DIST_DIR, 'index.html');
if (fs.existsSync(srcReport)) {
  fs.copyFileSync(srcReport, dstReport);
  log('OK', 'Copied docs/report.html → dist/index.html');
}

// Copy data files to dist/data/
const distData = path.join(DIST_DIR, 'data');
if (!fs.existsSync(distData)) fs.mkdirSync(distData, { recursive: true });
for (const file of REQUIRED_DATA_FILES) {
  const src = path.join(DATA_DIR, file);
  const dst = path.join(distData, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    log('OK', `Copied data/${file} → dist/data/${file}`);
  }
}

// ── Step 4: Generate build manifest ─────────────────────────────────────────
const manifest = {
  build_time: new Date().toISOString(),
  version: require(path.join(ROOT, 'package.json')).version,
  files: {
    report: 'index.html',
    data: REQUIRED_DATA_FILES,
  },
  stats: {
    errors,
    warnings,
  },
};

fs.writeFileSync(
  path.join(DIST_DIR, 'build-manifest.json'),
  JSON.stringify(manifest, null, 2)
);
log('OK', 'Generated dist/build-manifest.json');

// ── Final summary ────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (errors > 0) {
  log('ERROR', `Build FAILED — ${errors} error(s), ${warnings} warning(s)`);
  process.exit(1);
} else if (warnings > 0) {
  log('WARN', `Build completed with ${warnings} warning(s)`);
} else {
  log('OK', 'Build SUCCESSFUL — all files validated ✓');
  log('INFO', `Output: dist/index.html`);
}
console.log('─'.repeat(50));
