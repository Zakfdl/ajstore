#!/usr/bin/env node
/**
 * AJStore Audit Report — PDF Export Script
 * Requires: npm install puppeteer
 * Usage: node scripts/export-pdf.js
 *
 * Generates a print-ready PDF of the audit report.
 */

const path = require('path');
const fs = require('fs');

async function exportPDF() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.log('❌ Puppeteer not installed.');
    console.log('   Run: npm install puppeteer');
    console.log('   Then: npm run export-pdf');
    process.exit(1);
  }

  const reportPath = path.join(__dirname, '..', 'docs', 'report.html');
  const outputPath = path.join(__dirname, '..', 'docs', 'ajstore-audit-report.pdf');

  if (!fs.existsSync(reportPath)) {
    console.log('❌ Report not found at docs/report.html');
    process.exit(1);
  }

  console.log('🔨 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  console.log('📄 Loading report...');
  await page.goto(`file://${reportPath}`, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');

  console.log('🖨️  Generating PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0',
      bottom: '0',
      left: '0',
      right: '0',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:9px;color:#999;width:100%;text-align:right;padding-right:20px;">
        AJStore.com Digital Audit — Confidential
      </div>`,
    footerTemplate: `
      <div style="font-size:9px;color:#999;width:100%;text-align:center;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        &nbsp;|&nbsp; Ajlan &amp; Brothers Company &nbsp;|&nbsp; March 2026
      </div>`,
  });

  await browser.close();

  const stat = fs.statSync(outputPath);
  console.log(`✅ PDF exported: docs/ajstore-audit-report.pdf (${(stat.size / 1024).toFixed(0)} KB)`);
}

exportPDF().catch(err => {
  console.error('❌ Export failed:', err.message);
  process.exit(1);
});
