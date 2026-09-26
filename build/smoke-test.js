#!/usr/bin/env node
'use strict';
// Drive the built demo in a real browser: open every tab, collect console
// errors, and prove that nothing leaves the page for a backend.
//
//   node build/smoke-test.js
//
// Exits non-zero if a tab throws, if a tab renders no content, or if the page
// tries to reach a data backend (supabase.co, /api/*, hubapi, slack).

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const TABS = ['main','portfolio','cohorts','team','forecasting','requests','responses','nps','egc','egcjourney','bonus'];

// Requests that would mean the demo is not self-contained.
const FORBIDDEN = /supabase\.co|hubapi\.com|slack\.com|\/api\/|netlify\/functions/;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  const errors = [];
  const escaped = [];

  // This sandbox cannot reach cdnjs, so serve Chart.js from node_modules and
  // let the real chart code run — otherwise every chart silently no-ops and
  // the test would pass without having drawn anything.
  const chartJs = path.resolve(__dirname, '..', 'node_modules', 'chart.js', 'dist', 'chart.umd.js');
  if (fs.existsSync(chartJs)) {
    await page.route('**/chart.umd.js', route =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(chartJs, 'utf8') }));
  } else {
    console.warn('note: chart.js not installed locally — charts will not be exercised');
  }
  // Fonts are decoration; stub them so a blocked CDN is not reported as an error.
  await page.route('**://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));

  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('request', r => { if (FORBIDDEN.test(r.url())) escaped.push(r.url()); });

  await page.goto(FILE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const results = [];
  for (const tab of TABS) {
    const btn = page.locator(`.tab-btn[onclick*="'${tab}'"]`);
    if (!(await btn.count())) { results.push({ tab, ok: false, note: 'tab button not found' }); continue; }
    await btn.first().click();
    await page.waitForTimeout(900);
    const panel = page.locator(`#tab-${tab}`);
    const text = (await panel.count()) ? (await panel.first().innerText()).trim() : '';
    const canvases = await panel.locator('canvas').count().catch(() => 0);
    const rows = await panel.locator('tbody tr').count().catch(() => 0);
    results.push({ tab, ok: text.length > 60, chars: text.length, charts: canvases, rows });
  }

  // A chart that never got data draws nothing; check a few known canvases have pixels.
  // Ask Chart.js itself what it built, rather than trusting canvas dimensions:
  // an empty chart still has a sized canvas.
  const painted = await page.evaluate(() => {
    const out = { total: 0, withData: 0, empty: [] };
    const reg = (window.Chart && Chart.instances) ? Object.values(Chart.instances) : [];
    reg.forEach(ch => {
      out.total++;
      const pts = (ch.data && ch.data.datasets || []).reduce((n, d) => n + ((d.data || []).length), 0);
      if (pts > 0) out.withData++; else out.empty.push(ch.canvas && ch.canvas.id || '(unnamed)');
    });
    return out;
  });

  await browser.close();

  console.log('\nTab                 chars   charts  rows   status');
  console.log('─'.repeat(56));
  for (const r of results) {
    console.log(
      r.tab.padEnd(20) +
      String(r.chars ?? '—').padEnd(8) +
      String(r.charts ?? '—').padEnd(8) +
      String(r.rows ?? '—').padEnd(7) +
      (r.ok ? 'ok' : 'EMPTY' + (r.note ? ' — ' + r.note : ''))
    );
  }
  console.log(`\nCharts with data: ${painted.withData}/${painted.total}` +
    (painted.empty.length ? '  (empty: ' + painted.empty.join(', ') + ')' : ''));

  if (escaped.length) {
    console.error('\nFAIL — the page tried to reach a backend:');
    [...new Set(escaped)].forEach(u => console.error('  ' + u));
  }
  if (errors.length) {
    console.error('\nConsole errors:');
    [...new Set(errors)].slice(0, 25).forEach(e => console.error('  ' + e));
  }
  const empty = results.filter(r => !r.ok);
  if (empty.length) console.error('\nEmpty tabs: ' + empty.map(r => r.tab).join(', '));

  const failed = escaped.length || errors.length || empty.length;
  console.log(failed ? '\nSMOKE TEST FAILED' : '\nSmoke test passed — all tabs render, nothing left the page.');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
