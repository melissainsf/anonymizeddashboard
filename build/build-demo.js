#!/usr/bin/env node
'use strict';
// ═══════════════════════════════════════════════════════════════════════════
//  build-demo.js — regenerate the public demo from the internal CS dashboard
// ═══════════════════════════════════════════════════════════════════════════
//
//   node build/build-demo.js --src ../For-Dashboard
//
// Reads the internal dashboard, swaps every real name for a fictional one,
// rips out the live Supabase/HubSpot/Slack/Measure wiring, injects the
// in-browser demo layer, and writes index.html here.
//
// Why regenerate rather than hand-patch: the internal dashboard moves fast
// (five whole tabs were added between the first demo build and the second).
// Porting changes by hand guarantees drift; rebuilding from source guarantees
// the demo shows exactly what the real one shows.
//
// The leak check at the end is the important part. Its blocklist of real
// customer and staff names is derived FROM THE PRIVATE SOURCE at build time
// and never written to disk here — this repo is public, so a checked-in list
// of real names would itself be the leak. If the internal dashboard grows a
// new real name and the rename table below has not caught up, the build FAILS
// rather than publishing it.

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const srcArg = argv.indexOf('--src');
const SRC = path.resolve(srcArg >= 0 ? argv[srcArg + 1] : '../For-Dashboard');
const OUT = path.resolve(__dirname, '..', 'index.html');

const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');

// ── 1. Rename table ────────────────────────────────────────────────────────
// Real -> fictional. Order matters: longer, more specific keys first so a
// substring never eats a longer name.
const PEOPLE = [
  ['Maxwell',  'Sofia Reyes'],
  ['Melissa',  'Maya Chen'],
  ['melissa',  'maya'],
  ['Marghi',   'Jordan Ellis'],
  ['Karishma', 'Robin Tate'],
  ['Emmett',   'Marcus Webb'],
  ['Prentice', 'Casey Vaughn'],
  ['Lakeisha', 'Ingrid Sol'],
  ['Yichen',   'Rowan Vale'],
  ['Millie',   'Tessa Vane'],
  ['Daniel',   'Devin Walsh'],
  ['Jacob',    'Liam Brennan'],
  ['David',    'Priya Nair'],
  ['Emily',    'Naomi Park'],
  ['Eric',     'Sam Okafor'],
];
// Account renames. Where the internal comments turn on a name-matching quirk
// (a dropped word, a space), the fictional pair keeps the same quirk so the
// comment still explains something true about the code.
const ACCOUNTS = [
  ['Knopman Marks',        'Granite Logistics'],
  ['Knopman',              'Granite Logistics'],
  ['Magnific (Freepik)',   'Solstice Apparel'],
  ['Magnific',             'Solstice Apparel'],
  ['Madison West Partners','Tideway Bank Group'],   // CRM name ...
  ['Madison West',         'Tideway Bank'],         // ... vs the product's
  ['VitalBenefits',        'MarigoldBeauty'],       // CRM spelling ...
  ['Vital Benefits',       'Marigold Beauty'],      // ... vs the product's
  ['Trimble',              'Copperline Mfg'],
  ['Othello',              'Meridian Freight'],
  ['Buzzlead',             'Brightloom'],
  ['Runpod',               'Lumen Robotics'],
  ['Bland',                'Northwind Labs'],
  ['Thrad',                'Cedar & Pine Co'],
  ['Axya',                 'Harborview Realty'],
  ['Goody',                'Verdant Foods'],
];
// Customer contacts named in comments.
const CONTACTS = [
  ['Brandon Ray', 'Ari Patel'],
  ['Willow Thom', 'Dana Osei'],
  ['Alex Perez',  'Gray Vance'],
  ['Zhen Lu',     'Kai Nakamura'],
  ['Jared',       'Blake'],
];
// Words that look like customer names but are the infrastructure the demo runs
// on. "Netlify Blobs" is the hosting platform, not the account of that name.
const PLATFORM_ALLOW = new Set(['Netlify']);
const BRAND = [
  ['virio.ai',  'northwind.example'],
  ['Virio',     'Northwind'],
  ['virio',     'northwind'],
];

// ── 2. Load source ─────────────────────────────────────────────────────────
let html = read('index.html');
const bonusJs = read('bonus-calculator.js');
const demoLayer = fs.readFileSync(path.join(__dirname, 'demo-layer.js'), 'utf8');

const must = (cond, msg) => { if (!cond) { console.error('BUILD FAILED: ' + msg); process.exit(1); } };
const replaceOnce = (str, find, repl, label) => {
  const parts = str.split(find);
  must(parts.length === 2, `anchor not found exactly once (${parts.length - 1} hits): ${label}`);
  return parts[0] + repl + parts[1];
};

// ── 3. Swap the AM roster constants for fictional equivalents ──────────────
// These are replaced wholesale rather than by token substitution, because the
// internal VALUES ('CSM 2', 'Max') are CRM storage keys, not display names —
// the demo keeps the same value/label split so the display path is exercised.
const formerBlock = html.match(/const FORMER_AM_VALUES = new Set\(\[[\s\S]*?\]\);/);
must(formerBlock, 'FORMER_AM_VALUES block not found');
html = html.replace(formerBlock[0], `const FORMER_AM_VALUES = new Set([
  'Rowan Vale', 'Ingrid Sol', 'Marcus Webb', 'Liam Brennan',
  'AM 2',             // Priya Nair — left the company; the seat was backfilled
  'Tessa Vane',
  'Casey Vaughn',     // offered the role, never accepted — an account was
                      // assigned in anticipation and then moved back, and the
                      // AM widgets read ownership HISTORY, so they kept showing
                      // up as an AM with a book and no replies.
  'Former Employee',  // the CRM's catch-all for departed staff
]);`);

const labelsLine = html.match(/const AM_LABELS = \{[^}]*\};/);
must(labelsLine, 'AM_LABELS not found');
html = html.replace(labelsLine[0], `const AM_LABELS = { 'AM 2':'Priya Nair', 'Sof':'Sofia Reyes' };`);

const currentLine = html.match(/const CURRENT_AM_VALUES = \[[^\]]*\];/);
must(currentLine, 'CURRENT_AM_VALUES not found');
html = html.replace(currentLine[0], `const CURRENT_AM_VALUES = ['Maya Chen','Jordan Ellis','Sof','Naomi Park','Devin Walsh','AM 2','EGC'];`);

// ── 4. Rip out live wiring, inject the demo layer ──────────────────────────
html = replaceOnce(html,
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n',
  '', 'supabase-js CDN tag');

// bonus-calculator.js is a separate file in the internal repo; inline it so the
// demo stays a single self-contained page.
html = replaceOnce(html,
  '<script src="bonus-calculator.js"></script>',
  '<script>\n' + bonusJs + '\n</script>', 'bonus-calculator.js tag');

const sbBlock = html.match(/const SUPABASE_URL[\s\S]*?createClient\(SUPABASE_URL, SUPABASE_ANON, \{[\s\S]*?\}\);/);
must(sbBlock, 'Supabase createClient block not found');
html = html.replace(sbBlock[0], demoLayer.trim());

// ── 5. Bypass the sign-in gate ─────────────────────────────────────────────
const initBlock = html.match(/window\.addEventListener\('DOMContentLoaded', async \(\) => \{[\s\S]*?\n\}\);/);
must(initBlock, 'DOMContentLoaded init block not found');
html = html.replace(initBlock[0], `window.addEventListener('DOMContentLoaded', async () => {
  // DEMO BUILD: no auth gate — the sign-in screen is bypassed and the
  // dashboard loads directly against the in-memory sample data.
  buildDemoData();
  prtInit();
  showAuthScreen(false);
  const signoutBtn = document.getElementById('signout-btn');
  if (signoutBtn) signoutBtn.style.display = 'none';
  loadData();
});`);

// ── 6. Token renames ───────────────────────────────────────────────────────
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const [from, to] of [...ACCOUNTS, ...CONTACTS, ...PEOPLE, ...BRAND]) {
  // \b does not fire next to a dot, so "virio.ai" is handled by ordering:
  // the dotted form is listed before the bare one.
  html = html.replace(new RegExp('\\b' + esc(from) + '\\b', 'g'), to);
}

// Title and footer identity.
html = html.replace(/<title>[^<]*<\/title>/, '<title>Anonymous — Customer Success Metrics</title>');
html = html.replace(/Northwind CS Dashboard/g, 'Anonymous CS Dashboard');
html = html.replace(/Access restricted to @northwind\.example accounts/g, 'Demo build — sample data only');

// Banner so nobody mistakes this for the real thing.
html = replaceOnce(html, '<title>', `<!-- DEMO BUILD: generated by build/build-demo.js from the internal CS
     dashboard. Every company, person, and number below is FICTIONAL. The
     Supabase client is replaced by an in-memory mock and no external service
     (CRM, Slack, billing, database) is contacted. Do not hand-edit: rerun the
     build instead, or the next rebuild will overwrite the change. -->
<title>`, 'title tag');

// ── 7. Leak check ──────────────────────────────────────────────────────────
// Blocklist built from the private source, never written to this repo.
const blocked = new Set();
const addName = n => { const v = String(n || '').trim(); if (v.length > 3) blocked.add(v); };

try {
  const billing = read('netlify/functions/_cs-billing.js');
  const accountsBlock = billing.slice(billing.indexOf('accounts:'));
  for (const m of accountsBlock.matchAll(/^\s*'([^']+)'\s*:/gm)) addName(m[1]);
} catch (e) { console.warn('note: could not read _cs-billing.js for the blocklist —', e.message); }
try {
  const roster = read('netlify/functions/_cs-accounts.js');
  for (const m of roster.matchAll(/company:\s*'([^']+)'/g)) addName(m[1]);
  for (const m of roster.matchAll(/am:\s*'([^']+)'/g)) addName(m[1]);
} catch (e) { console.warn('note: could not read _cs-accounts.js for the blocklist —', e.message); }

// Real staff and brand names from the rename table, plus the live backend.
for (const [from] of [...PEOPLE, ...ACCOUNTS, ...CONTACTS, ...BRAND]) addName(from);
addName('supabase.co');
for (const m of read('index.html').matchAll(/const SUPABASE_ANON\s*=\s*'([^']+)'/g)) addName(m[1]);

// 'EGC' and other short/shared tokens are legitimate in the demo; the addName
// length guard drops them. Check what remains, whole-word.
const hits = [];
// Platform names are allowed through; they name the host, not a customer.
for (const name of blocked) {
  if (PLATFORM_ALLOW.has(name)) continue;
  const re = new RegExp('\\b' + esc(name) + '\\b');
  if (re.test(html)) hits.push(name);
}
// Names that are fictional in BOTH files (the demo reuses some generic words)
// would be false positives; none are expected, so any hit fails the build.
must(hits.length === 0, 'real names survived into the demo output:\n  ' + hits.join('\n  '));

// Belt and braces: nothing may point at a live backend.
must(!/supabase\.co/.test(html), 'a supabase.co URL survived into the output');
must(!/eyJhbGciOi/.test(html), 'a JWT survived into the output');

fs.writeFileSync(OUT, html);
console.log(`Wrote ${OUT} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`Leak check passed against ${blocked.size} real names from the private source.`);
