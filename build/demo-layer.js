// ═══════════════════════════════════════════════════════════════════════════
//  DEMO LAYER — injected into index.html by build/build-demo.js
// ═══════════════════════════════════════════════════════════════════════════
// Everything below replaces the live HubSpot / Measure / Slack / Supabase
// backends with an in-browser mock fed by FICTIONAL sample data. No network
// call leaves the page for data, no API keys, no real customer information.
// Edits (FOCs, status changes, new product requests, forecast inputs) work but
// persist only in memory for the current session.
//
// The fixture shapes are taken from the real contracts: Supabase table columns
// and RPC return types, and the JSON each /api/* function returns. If a tab
// renders here, it renders against the same shape it gets in production.

const DEMO_EMAIL = 'demo@example.com';

// ── Synthetic data holders (filled by buildDemoData) ──────────────────────
let DEMO_HS_RESULTS      = [];   // HubSpot company-search shape
let DEMO_FOCS            = [];   // portfolio_focs rows
let DEMO_PR_MAP          = {};   // companyId -> { product, closeDate }
let DEMO_PR_REQUESTS     = [];   // pr_requests rows
let DEMO_PR_ASKS         = [];   // pr_asks rows
let DEMO_HEALTH_MAP      = {};   // companyId -> health colour
let DEMO_DEALS_MAP       = {};   // companyId -> manual deal numbers
let DEMO_EXPANSION_MAP   = {};   // companyId -> target expansion close date
let DEMO_BILLING         = {};   // { generated_at, source, currency, accounts }
let DEMO_RT              = {};   // /api/response-times payload
let DEMO_EGC_USAGE       = [];   // egc_usage() rows
let DEMO_EGC_POST_WEEKS  = [];   // egc_post_weeks() rows
let DEMO_EGC_COMPANY_POSTS = []; // egc_company_posts() rows
let DEMO_EGC_FOCS        = {};   // /api/egc-focs -> { focs }
let DEMO_NPS_SENDS       = [];   // nps_sends rows
let DEMO_FC_SETTINGS     = [];   // fc_settings rows
let DEMO_FC_PROJECTIONS  = [];   // fc_projections rows
let DEMO_FC_INPUTS       = [];   // fc_account_inputs rows
let DEMO_BONUS_SNAPSHOTS = {};   // { "2026-Q3": { quarter, captured_at, accounts } }
let _demoBuilt = false;

function buildDemoData() {
  if (_demoBuilt) return;
  _demoBuilt = true;

  // Deterministic PRNG so the sample set is stable across reloads.
  let _seed = 0x9e3779b9;
  const rnd = () => { _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0; let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

  const NAMES = ['Northwind Labs','Brightloom','Cedar & Pine Co','Halcyon Health','Meridian Freight','Lumen Robotics','Tideway Bank','Verdant Foods','Polaris Security','Kestrel Analytics','Driftwood Travel','Ironclad Insurance','Saffron Retail','Bluepeak Energy','Auberge Hospitality','Quill & Quire Media','Granite Logistics','Wavelength Telecom','Fernwood Education','Copperline Mfg','Solstice Apparel','Harborview Realty','Nimbus Cloud','Sablefish Seafood','Aria Fintech','Boxwood HR','Cobalt Devtools','Marigold Beauty','Tessellate Design','Umbra Gaming','Vantage Legal','Wildflower Wellness'];
  // AM internal values, mirroring the real CRM's quirk that two options store a
  // value different from the label they display (see AM_LABELS in the page).
  const AM_VALUES  = ['Maya Chen','Jordan Ellis','Sof','Naomi Park','Devin Walsh','AM 2'];
  const CMS        = ['Alex Rivera','Sam Okafor','Devon Brooks','Robin Tate'];
  const VERTICALS  = ['Fintech','Healthcare','Developer Tools','E-commerce','Cybersecurity','Logistics','HR Tech','Real Estate','MarTech','EdTech','Hospitality','Manufacturing'];
  const INDUSTRIES = ['Financial Services','Hospital & Health Care','Computer Software','Retail','Computer & Network Security','Logistics & Supply Chain','Human Resources','Real Estate','Marketing & Advertising','Education Management','Hospitality','Machinery'];
  const REASONS    = ['Budget constraints','Lack of ROI','Champion departed','Product fit','Switched to competitor','Limited bandwidth'];
  const STAGES     = ['Enterprise','Scale Up','Mid-Market','Startup'];
  const SEG_MULT   = { 'Enterprise': 2.4, 'Scale Up': 1.5, 'Mid-Market': 1.0, 'Startup': 0.6 };
  const HEALTH     = ['green','green','green','blue','yellow','yellow','red'];
  const CHURNED_LS = '1271359806';   // lifecyclestage id the page treats as churned

  const STATUS_PLAN = [
    ...Array(11).fill('In progress'),
    ...Array(12).fill('Converted'),
    ...Array(5).fill('Exited During Pilot'),
    ...Array(4).fill('Churned Post Conversion')
  ];

  const addDays = (iso, n) => { const d = new Date(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const TODAY   = new Date().toISOString().slice(0, 10);
  const relDate = n => addDays(TODAY, n);
  const relISO  = n => new Date(Date.now() + n * 86400000).toISOString();
  const uuid    = i => '00000000-0000-4000-8000-' + String(100000000000 + i).slice(-12);

  // The EGC book is a shared book in the CRM: its accounts carry the 'EGC'
  // Account Manager value rather than any one person's name.
  const EGC_COUNT = 7;

  // Pass 1 — the money, so accounts can be ranked before dates are assigned.
  const base = STATUS_PLAN.map((status, i) => {
    const stage   = pick(STAGES);
    const isEgc   = i < EGC_COUNT;
    const product = isEgc ? 'EGC' : 'Full Service';
    const rawMrr  = product === 'Full Service' ? rint(4, 12) * 1000 : rint(15, 40) * 100;
    const baseMrr = Math.round(rawMrr * (SEG_MULT[stage] || 1) / 100) * 100;
    const churned = status === 'Exited During Pilot' || status === 'Churned Post Conversion';
    return {
      i, status, stage, isEgc, product, churned,
      mrr: churned && status === 'Exited During Pilot' ? 0 : baseMrr,
      expansion_mrr: status === 'Converted' && rnd() > 0.35 ? rint(8, 40) * 100 : 0
    };
  });

  // Pass 2 — kickoff dates. The Product Request Tracker ranks by how close an
  // account is to its next decision, and it derives that date from the KICKOFF
  // (pilot end = kickoff + 90d; renewal = pilot end + 365d once converted), not
  // from the deal close date. So the urgency story has to be told in kickoffs:
  // set each account's kickoff so its decision lands a chosen number of days
  // out, and the tracker's tiers, ordering and group breaks all follow.
  const PILOT_DAYS = 90, RENEWAL_DAYS = 365;
  const kickoffFor = (b, daysOut) =>
    relDate(daysOut - PILOT_DAYS - (b.status === 'Converted' ? RENEWAL_DAYS : 0));

  const activeBase = base.filter(b => b.status === 'In progress' || b.status === 'Converted')
                         .sort((x, y) => ((y.mrr + y.expansion_mrr) - (x.mrr + x.expansion_mrr)));
  const DAYS_SPREAD = [25, 50, 75, 120, 160, 210, 270, 330];
  const daysOutBy = {};
  activeBase.forEach((b, n) => {
    const d = DAYS_SPREAD[n % DAYS_SPREAD.length];
    // A pilot ends 90 days after kickoff, so anything further out than that
    // would place its kickoff in the future. Converted accounts count down to a
    // renewal 455 days out and can sit anywhere in the spread.
    daysOutBy[b.i] = b.status === 'In progress' ? 10 + (d % 79) : d;
  });
  // Hand-tuned so the ranking has a legible story: the two biggest books are
  // renewing within weeks, an urgent bug sits on another large account, and a
  // pile of small asks sits far from any decision.
  // Churn dates drive the trailing-90d churn goal, so place them rather than
  // roll them: one recent loss keeps the metric honest and non-zero, the rest
  // sit far enough back that a demo does not look like a collapsing book.
  const churnDayBy = {};
  base.filter(b => b.churned).forEach((b, n) => {
    churnDayBy[b.i] = n === 0 ? 55 : 150 + n * 45;
  });

  const T = activeBase;
  const tune = (b, d) => { if (b) daysOutBy[b.i] = d; };
  tune(T[0], 9); tune(T[1], 18); tune(T[2], 60); tune(T[3], 14);
  tune(T[8], 70); tune(T[9], 78);
  T.slice(-6).forEach((b, n) => tune(b, b.status === 'In progress' ? 55 + n * 5 : 230 + n * 20));

  DEMO_HS_RESULTS = base.map(b => {
    const i = b.i, status = b.status, churned = b.churned;
    const name    = NAMES[i % NAMES.length];
    const isLiveish = status === 'Converted' || status === 'Churned Post Conversion';
    const kickoff = daysOutBy[i] != null ? kickoffFor(b, daysOutBy[i]) : relDate(-rint(40, 420));
    const hasFirstPost = status !== 'In progress' || rnd() > 0.3;
    const firstPost = hasFirstPost ? addDays(kickoff, rint(12, 45)) : null;
    const journey = status === 'In progress'
      ? pick(JOURNEY_ORDER.slice(0, 5))
      : isLiveish ? (rnd() > 0.5 ? 'Renewal' : 'Live') : 'Live';
    const vi = i % VERTICALS.length;
    const stage = b.stage, product = b.product, isEgc = b.isEgc, baseMrr = b.mrr;

    return { id: 'demo-' + (i + 1), properties: {
      name,
      pilot_status: status,
      // The page filters on lifecyclestage: anything that is not a customer or
      // the churned stage never enters the working set.
      lifecyclestage: churned ? CHURNED_LS : 'customer',
      stage,
      mrr: baseMrr,
      expansion_mrr: b.expansion_mrr,
      churned_mrr_value: churned ? (baseMrr || rint(2, 9) * 1000) : 0,
      churn_reason: churned ? pick(REASONS) : null,
      // Spread churn across more than a year: bunching every loss into the last
      // few months would read as a business losing a quarter of its book at once.
      churn_date: churned ? relDate(-(churnDayBy[i] || 200)) : null,
      domain: name.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.example.com',
      csm: isEgc ? 'EGC' : pick(AM_VALUES),
      content_manager: pick(CMS),
      posts_per_month: String(rint(4, 16)) + ' / month',
      kickoff_call_date: kickoff,
      first_post_date: firstPost,
      vertical: VERTICALS[vi],
      industry: INDUSTRIES[vi],
      customer_journey: journey,
      product,
      upsold_products: !isEgc && rnd() > 0.75 ? 'Rev Share' : null,
      success_criteria: rnd() > 0.6 ? 'Two inbound conversations a month from LinkedIn' : null
    } };
  });

  const byId   = Object.fromEntries(DEMO_HS_RESULTS.map(r => [r.id, r]));
  const nameOf = id => (byId[id] ? byId[id].properties.name : id);
  const active = DEMO_HS_RESULTS.filter(r => r.properties.pilot_status === 'In progress' || r.properties.pilot_status === 'Converted');
  const egcCos = DEMO_HS_RESULTS.filter(r => r.properties.product === 'EGC');

  // ── Account health (was Lineage, now the dashboard's own blob store) ─────
  DEMO_HEALTH_MAP = {};
  DEMO_HS_RESULTS.forEach(r => { DEMO_HEALTH_MAP[r.id] = pick(HEALTH); });

  // A handful of accounts already have a Founder/Owner Champion noted.
  DEMO_FOCS = DEMO_HS_RESULTS.slice(0, 6).map((r, i) => ({
    hs_company_id: r.id,
    focs: ['Jamie Patel','Taylor Brooks','Chris Donovan','Robin Yu','Sasha Mor','Lee Carter'][i],
    updated_by: DEMO_EMAIL, updated_at: relISO(-20)
  }));

  // ── Product Request Tracker ──────────────────────────────────────────────
  const arrOf = r => (r.properties.mrr + r.properties.expansion_mrr) * 12;
  const activeCo = [...active].sort((a, b) => arrOf(b) - arrOf(a));

  DEMO_PR_MAP = {};
  const setRenewal = (r, daysOut) => {
    const lead = 90 + (r.properties.pilot_status === 'Converted' ? 365 : 0);
    DEMO_PR_MAP[r.id] = { product: r.properties.product, closeDate: relDate(daysOut - lead) };
  };
  const SPREAD = [25, 50, 75, 120, 160, 210, 270, 330];
  activeCo.forEach((r, i) => setRenewal(r, SPREAD[i % SPREAD.length]));
  DEMO_HS_RESULTS.filter(r => !DEMO_PR_MAP[r.id]).forEach(r => { DEMO_PR_MAP[r.id] = { product: r.properties.product, closeDate: r.properties.kickoff_call_date }; });

  const whale = activeCo[0], big2 = activeCo[1], big3 = activeCo[2], big4 = activeCo[3];
  const mids = activeCo.slice(8, 12);
  const smalls = activeCo.slice(-6);
  setRenewal(whale, 9);
  setRenewal(big2, 18);
  setRenewal(big3, 60);
  setRenewal(big4, 14);
  setRenewal(mids[0], 70);
  setRenewal(mids[1], 78);
  smalls.forEach((r, i) => setRenewal(r, 230 + i * 20));

  const reqs = [
    { id: 'req-1', title: 'Bulk schedule posts across all seats',             type: 'feature', severity: null,     status: 'open' },
    { id: 'req-2', title: 'Salesforce / CRM integration',                     type: 'feature', severity: null,     status: 'open' },
    { id: 'req-3', title: 'LinkedIn carousel (multi-image) posts',            type: 'feature', severity: null,     status: 'open' },
    { id: 'req-4', title: 'Dark mode for the dashboard',                      type: 'feature', severity: null,     status: 'open' },
    { id: 'req-5', title: 'Scheduled posts publishing in the wrong timezone', type: 'bug',     severity: 'Urgent', status: 'open' },
    { id: 'req-6', title: 'Analytics export missing the last 7 days',         type: 'bug',     severity: 'Medium', status: 'open' },
    { id: 'req-7', title: 'Avatar upload fails on Safari',                    type: 'bug',     severity: 'Low',    status: 'open' },
    { id: 'req-8', title: 'SSO / SAML login',                                 type: 'feature', severity: null,     status: 'shipped' }
  ];
  DEMO_PR_REQUESTS = reqs.map((r, i) => ({
    ...r, description: null,
    shipped_date: r.status === 'shipped' ? relDate(-25) : null,
    created_by: DEMO_EMAIL, created_at: relDate(-60 + i), updated_at: relDate(-10)
  }));

  let _ask = 0;
  const mkAsk = (reqId, co, detail) => ({
    id: 'ask-' + (++_ask), request_id: reqId, hs_company_id: co.id,
    company_name: co.properties.name, product: co.properties.product,
    detail, source: 'manual', created_by: DEMO_EMAIL, images: [],
    created_at: relDate(-12), updated_at: relDate(-12)
  });
  DEMO_PR_ASKS = [
    mkAsk('req-1', whale, 'Wants to queue a full month of posts across all seats in one action. Raised on the renewal call.'),
    mkAsk('req-1', big2,  'Renewal blocker — exec team needs to schedule a whole month in one sitting.'),
    mkAsk('req-2', big3,  'Needs request activity to sync into Salesforce for their RevOps team.'),
    mkAsk('req-2', mids[0], 'Would expand seats if engagement data pushed to their CRM.'),
    mkAsk('req-3', smalls[0], 'Carousels are their best-performing format on LinkedIn.'),
    mkAsk('req-3', smalls[1], 'Wants multi-image posts for product launches.'),
    mkAsk('req-3', smalls[2], 'Asked for swipeable carousels.'),
    mkAsk('req-3', smalls[3], 'Carousel support would help their design team.'),
    mkAsk('req-4', smalls[4], 'Nice-to-have: a dark theme for late-night reviewing.'),
    mkAsk('req-5', big4, 'Posts set for 9am ET went out at 9am UTC — right before their renewal.'),
    mkAsk('req-6', mids[1], 'CSV export is dropping the most recent week of analytics.'),
    mkAsk('req-7', smalls[5], 'Profile photo upload fails in Safari; works in Chrome.')
  ];

  // ── Billing (renewal board) ──────────────────────────────────────────────
  // Keyed by company NAME, exactly as the Measure snapshot is.
  const billAccounts = {};
  active.forEach((r, i) => {
    const amount = Math.max(500, Math.round(r.properties.mrr / 10) * 10);
    const overdue = i % 9 === 4;
    billAccounts[r.properties.name] = {
      next_invoice_date: relISO(rint(3, 75)),
      amount,
      overdue_since: overdue ? relISO(-rint(20, 60)) : null,
      overdue_amount: overdue ? amount * rint(1, 3) : 0
    };
  });
  DEMO_BILLING = {
    generated_at: relISO(-2), source: 'measure-snapshot', currency: 'USD',
    accounts: billAccounts
  };

  // ── Forecasting: manual deal numbers + AM-entered expansion dates ────────
  DEMO_DEALS_MAP = {};
  activeCo.slice(0, 8).forEach((r, i) => {
    DEMO_DEALS_MAP[r.id] = {
      deals: rint(1, 6), pipeline: rint(10, 60) * 1000,
      note: i === 0 ? 'Rev-share client — deals tracked manually.' : null,
      updated_by: DEMO_EMAIL, updated_at: relISO(-rint(3, 40))
    };
  });
  DEMO_EXPANSION_MAP = {};
  activeCo.slice(0, 10).forEach((r, i) => {
    DEMO_EXPANSION_MAP[r.id] = { close_date: relDate(rint(20, 150)), updated_by: DEMO_EMAIL, updated_at: relISO(-rint(2, 30)) };
  });

  // ── Forecasting: Supabase-backed settings, projections, per-account inputs
  DEMO_FC_SETTINGS = [
    { key: 'targets', value: { arr_goal: 4200000, nrr_goal: 300 }, updated_by: DEMO_EMAIL, updated_at: relISO(-14) }
  ];
  const MONTH0 = (() => { const d = new Date(); d.setUTCDate(1); d.setUTCHours(0,0,0,0); return d; })();
  const monthISO = n => { const d = new Date(MONTH0); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
  DEMO_FC_PROJECTIONS = [];
  activeCo.slice(0, 12).forEach((r, i) => {
    for (let m = 0; m < 4; m++) {
      DEMO_FC_PROJECTIONS.push({
        id: uuid(600 + i * 10 + m), hs_company_id: r.id, period: monthISO(m),
        metric: 'expansion_mrr', kind: m === 0 ? 'committed' : 'best_case',
        amount: rint(3, 30) * 100, note: null,
        created_by: DEMO_EMAIL, created_at: relISO(-rint(1, 25))
      });
    }
  });
  DEMO_FC_INPUTS = activeCo.slice(0, 14).map(r => ({
    hs_company_id: r.id,
    acv: (r.properties.mrr || 0) * 12,
    close_rate: rint(15, 45) / 100,
    hours_per_week: rint(2, 12),
    notes: null, updated_by: DEMO_EMAIL, updated_at: relISO(-rint(2, 30))
  }));

  // ── Bonus calculator: quarterly baselines ────────────────────────────────
  const qLabel = d => d.getUTCFullYear() + '-Q' + (Math.floor(d.getUTCMonth() / 3) + 1);
  const prevQ  = l => { const [y, q] = l.split('-Q').map(Number); return q === 1 ? (y - 1) + '-Q4' : y + '-Q' + (q - 1); };
  const cq = qLabel(new Date()), pq = prevQ(cq);
  const snapAccounts = (scale) => {
    const out = {};
    DEMO_HS_RESULTS.forEach(r => {
      const p = r.properties;
      if (p.lifecyclestage !== 'customer' && p.lifecyclestage !== CHURNED_LS) return;
      out[r.id] = {
        name: p.name, csm: p.csm, domain: p.domain, lifecyclestage: p.lifecyclestage,
        kickoff_date: p.kickoff_call_date,
        mrr: Math.round((p.mrr || 0) * scale),
        expansion_mrr: Math.round((p.expansion_mrr || 0) * scale),
        churned_mrr: p.churned_mrr_value || 0
      };
    });
    return out;
  };
  DEMO_BONUS_SNAPSHOTS = {
    [pq]: { quarter: pq, captured_at: relISO(-150), accounts: snapAccounts(0.78) },
    [cq]: { quarter: cq, captured_at: relISO(-40),  accounts: snapAccounts(0.91) }
  };

  // ── Response times ───────────────────────────────────────────────────────
  // Medians in seconds. Business-hours figures are the ones the tab shows; the
  // raw 24/7 number is larger and appears on hover.
  const measured = DEMO_HS_RESULTS.filter(r => r.properties.pilot_status === 'In progress' || r.properties.pilot_status === 'Converted');
  const rtAccounts = [];
  const unmatched = [];
  measured.forEach((r, i) => {
    const p = r.properties;
    // Three accounts talk to us by email only, so no Slack channel matches.
    if (i % 11 === 7) { unmatched.push(p.name); return; }
    const bizMed = rint(12, 70) * 600;             // 2h – 11.6h of working time
    const rawMed = Math.round(bizMed * (1 + rnd() * 1.6));
    const handedOver = i === 3 || i === 12;
    const sample = rint(6, 40);
    rtAccounts.push({
      company: p.name,
      am: displayAM(p.csm),
      product: p.product,
      median_seconds: rawMed, mean_seconds: Math.round(rawMed * 1.15), sample,
      median_business_seconds: bizMed, mean_business_seconds: Math.round(bizMed * 1.12),
      owned_since: handedOver ? relDate(-rint(20, 26)) : null,
      current_owner_median_seconds: handedOver ? Math.round(rawMed * 0.7) : null,
      current_owner_median_business_seconds: handedOver ? Math.round(bizMed * 0.7) : null,
      current_owner_sample: handedOver ? Math.max(2, Math.round(sample / 3)) : null
    });
  });
  const amAgg = {};
  rtAccounts.forEach(a => {
    const k = a.am || 'Unassigned';
    (amAgg[k] = amAgg[k] || { rows: [] }).rows.push(a);
  });
  // A time slice owned by people who have since left still has to go somewhere.
  amAgg['Unassigned'] = { rows: rtAccounts.slice(0, 2), departed: true };
  const medOf = arr => { if (!arr.length) return null; const s = [...arr].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
  DEMO_RT = {
    generated_at: relISO(-0.04), window_days: 30, source: 'slack',
    roster_source: 'hubspot', owner_source: 'history',
    business_hours: { start: 7, end: 22, tz: 'America/Los_Angeles', weekends_counted: true },
    unattributed_replies: 4, reaction_acks: 11, thread_fetches: 128, channel_issues: [],
    // Name the previous owner and the current one, taking the current owner from
    // the row itself so the note and the table cannot disagree.
    handovers: rtAccounts.filter(a => a.owned_since).map(a => ({
      company: a.company, owners: ['Priya Nair', a.am]
    })),
    unmatched,
    accounts: rtAccounts,
    ams: Object.keys(amAgg).map(am => {
      const rows = amAgg[am].rows;
      const mix = rows.reduce((m, a) => { const k = a.product === 'EGC' ? 'EGC' : 'FS'; m[k] = (m[k] || 0) + 1; return m; }, {});
      const byProduct = {};
      for (const p of ['EGC', 'Full Service']) {
        const sub = rows.filter(a => a.product === p);
        byProduct[p] = {
          accounts: sub.length,
          median_seconds: medOf(sub.map(a => a.median_seconds)),
          mean_seconds: medOf(sub.map(a => a.mean_seconds)),
          median_business_seconds: medOf(sub.map(a => a.median_business_seconds)),
          mean_business_seconds: medOf(sub.map(a => a.mean_business_seconds)),
          sample: sub.reduce((n, a) => n + a.sample, 0)
        };
      }
      return {
        am, accounts: rows.length, companies: rows.map(a => a.company).sort(), product_mix: mix,
        median_seconds: medOf(rows.map(a => a.median_seconds)),
        mean_seconds: medOf(rows.map(a => a.mean_seconds)),
        median_business_seconds: medOf(rows.map(a => a.median_business_seconds)),
        mean_business_seconds: medOf(rows.map(a => a.mean_business_seconds)),
        sample: rows.reduce((n, a) => n + a.sample, 0),
        by_product: byProduct
      };
    })
  };

  // ── NPS ──────────────────────────────────────────────────────────────────
  // One row per person we intended to survey each month, with the segment
  // columns frozen at send time.
  DEMO_NPS_SENDS = [];
  const FIRSTS = ['Jamie','Taylor','Chris','Robin','Sasha','Lee','Morgan','Riley','Casey','Avery','Quinn','Reese','Rowan','Emerson','Finley'];
  const LASTS  = ['Patel','Brooks','Donovan','Yu','Mor','Carter','Hale','Ibarra','Nakamura','Osei','Vance','Whitfield'];
  const COMMENTS = [
    'The team is responsive and the posts sound like me.',
    'Good content, but approvals take longer than I would like.',
    'We have seen real inbound from LinkedIn since starting.',
    'Quality dipped this month — a few posts missed the mark.',
    'Easy to work with. Would like more say on the topics.',
    null, null, null
  ];
  let npsId = 0;
  for (let m = 5; m >= 0; m--) {
    const period = monthISO(-m);
    const audience = DEMO_HS_RESULTS.filter(r => {
      const s = r.properties.pilot_status;
      return s === 'In progress' || s === 'Converted' || (m > 2 && s === 'Churned Post Conversion');
    });
    audience.forEach((r, i) => {
      const p = r.properties;
      const first = FIRSTS[(i + m) % FIRSTS.length], last = LASTS[(i * 3 + m) % LASTS.length];
      const answered = rnd() > 0.42;
      // A realistic spread: mostly promoters, a passive band, a few detractors.
      // Roughly 50% promoters / 35% passives / 15% detractors — a healthy but
      // not implausible book, landing NPS in the +30s.
      const roll = rnd();
      const score = answered ? (roll > 0.50 ? rint(9, 10) : roll > 0.15 ? rint(7, 8) : rint(3, 6)) : null;
      const reminded = !answered && rnd() > 0.5;
      DEMO_NPS_SENDS.push({
        id: uuid(1000 + (++npsId)),
        period,
        hs_company_id: r.id,
        company_name: p.name,
        hs_contact_id: 'contact-' + r.id + '-' + m,
        contact_email: (first + '.' + last).toLowerCase() + '@' + p.domain,
        contact_name: first + ' ' + last,
        product: p.product,
        vertical: p.vertical,
        stage: p.stage,
        pilot_status: p.pilot_status,
        am: p.csm,
        mrr: p.mrr,
        status: 'sent',
        send_error: null,
        token: 'tok-' + uuid(2000 + npsId).slice(-12),
        sent_at: period + 'T15:00:00Z',
        score,
        comment: answered ? pick(COMMENTS) : null,
        responded_at: answered ? relISO(-(m * 30) + rint(1, 9)) : null,
        created_at: period + 'T14:59:00Z',
        contact_key: 'contact-' + r.id + '-' + m,
        reminded_at: reminded ? relISO(-(m * 30) + 7) : null,
        reminder_attempts: reminded ? 1 : 0,
        reminder_error: null
      });
    });
  }

  // ── EGC usage ────────────────────────────────────────────────────────────
  // Seats belong to the EGC-product accounts above. One account is deliberately
  // left unprovisioned so the "not in the product" path has something to show.
  DEMO_EGC_USAGE = [];
  DEMO_EGC_COMPANY_POSTS = [];
  const PERSON_FIRST = ['Ari','Blake','Cameron','Dana','Ellis','Frankie','Gray','Harper','Indigo','Jules','Kai','Logan'];
  egcCos.forEach((co, ci) => {
    const p = co.properties;
    const provisioned = ci !== egcCos.length - 1;   // last EGC account has no seats
    if (!provisioned) return;
    const seats = rint(2, 5);
    let firstPost = null, lastPost = null, allTime = 0;
    for (let s = 0; s < seats; s++) {
      const isManager = s === 0;
      const publishes = !isManager || rnd() > 0.5;
      const seatAdded = addDays(p.kickoff_call_date, rint(0, 20));
      // (seat_days below drives the onboarding-vs-stalled split, 7 days in.)
      const seatDays  = Math.max(1, Math.round((Date.parse(TODAY) - Date.parse(seatAdded)) / 86400000));
      // A couple of seats have never published despite a mature seat — that is
      // the "stalled" case the tab is built to surface.
      // Two seats are deliberately stalled — a mature seat that has never
      // published is exactly what the "never posted" metric exists to surface,
      // and a fixture where it never fires leaves that path unexercised.
      const stalled   = publishes && ((ci === 0 && s === 1) || (ci === 3 && s === 1));
      const posts30   = !publishes || stalled ? 0 : rint(0, 9);
      const posts90   = !publishes || stalled ? 0 : posts30 * 3 + rint(0, 8);
      const edits90   = posts90 ? Math.round(posts90 * (0.4 + rnd() * 1.8)) : 0;
      const fp = (!publishes || stalled) ? null : addDays(seatAdded, rint(5, 30));
      const lp = fp ? relDate(-rint(0, 40)) : null;
      const silentHrs = rnd() > 0.78 ? rint(80, 700) : rint(1, 60);
      const first = PERSON_FIRST[(ci * 4 + s) % PERSON_FIRST.length];
      const last  = LASTS[(ci * 2 + s) % LASTS.length];
      if (fp && (!firstPost || fp < firstPost)) firstPost = fp;
      if (lp && (!lastPost || lp > lastPost)) lastPost = lp;
      allTime += posts90;
      DEMO_EGC_USAGE.push({
        company_id: uuid(3000 + ci),
        company_name: p.name,
        seats,
        user_id: uuid(4000 + ci * 10 + s),
        person: first + ' ' + last,
        email: (first + '.' + last).toLowerCase() + '@' + p.domain,
        is_manager: isManager,
        posts_content: publishes,
        last_active: silentHrs > 400 ? null : relISO(-(silentHrs / 24)),
        hours_silent: silentHrs > 400 ? null : silentHrs,
        seat_added: seatAdded,
        seat_days: seatDays,
        first_post: fp,
        last_post: lp,
        posts_30d: posts30,
        published_30d: posts30,
        ignored_30d: posts30 ? rint(0, 3) : 0,
        surfaced_30d: posts30 ? posts30 + rint(1, 6) : (stalled ? rint(3, 9) : rint(0, 4)),
        edited_30d: posts30 ? rint(0, posts30) : 0,
        edits_30d: posts30 ? rint(0, posts30 * 2) : 0,
        posts_90d: posts90,
        edited_90d: posts90 ? rint(0, posts90) : 0,
        edits_90d: edits90,
        edit_min_90d: posts90 ? Number((rnd() * 12 + 1).toFixed(1)) : 0,
        li_connected: rnd() > 0.12,
        li_broken: rnd() > 0.9
      });
    }
    DEMO_EGC_COMPANY_POSTS.push({
      company_name: p.name, seats, first_post: firstPost, last_post: lastPost, posts_all_time: allTime
    });
  });
  // A churned EGC account still has post history — the only source that can
  // date its first post.
  DEMO_EGC_COMPANY_POSTS.push({
    company_name: 'Marigold Beauty', seats: 3, first_post: relDate(-300), last_post: relDate(-120), posts_all_time: 46
  });

  DEMO_EGC_POST_WEEKS = [];
  for (let w = 25; w >= 0; w--) {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - w * 7);
    const day = d.getUTCDay(); d.setUTCDate(d.getUTCDate() - day);   // week starts Sunday
    DEMO_EGC_POST_WEEKS.push({ week: d.toISOString().slice(0, 10), posts: rint(4, 34) });
  }

  // The Face of Content label cross-check. Keyed by lower-cased company name,
  // each value a LIST of labelled contacts — the same shape /api/egc-focs
  // returns. The label is matched against the seats above, so the fixture
  // deliberately covers all three outcomes the tab distinguishes:
  //   • most seats labelled with an email      -> no flag
  //   • one labelled contact with no email     -> 'no-email' (fix the CRM record)
  //   • one publishing seat with no label      -> 'missing'  (fix the label)
  const focsOut = {};
  egcCos.forEach((co, i) => {
    const seats = DEMO_EGC_USAGE.filter(u => u.company_name === co.properties.name);
    const publishers = seats.filter(u => !u.is_manager && u.posts_content !== false);
    if (!publishers.length) return;
    // Leave the last account's publishers unlabelled so 'missing' has a case.
    const labelled = i === egcCos.length - 2 ? publishers.slice(0, -1) : publishers;
    if (!labelled.length) return;
    focsOut[co.properties.name.trim().toLowerCase()] = labelled.map((u, j) => ({
      name: u.person,
      // One labelled contact carries no email address at all.
      email: (i === 1 && j === 0) ? null : u.email
    }));
  });
  DEMO_EGC_FOCS = { focs: focsOut };
}

// ── Mock Supabase client (in-memory; chainable query-builder subset) ───────
const _demoBlobs = new Map();   // storage path -> object URL (for pasted screenshots)
function _demoTable(name) {
  if (name === 'portfolio_focs')    return DEMO_FOCS;
  if (name === 'pr_requests')       return DEMO_PR_REQUESTS;
  if (name === 'pr_asks')           return DEMO_PR_ASKS;
  if (name === 'nps_sends')         return DEMO_NPS_SENDS;
  if (name === 'fc_settings')       return DEMO_FC_SETTINGS;
  if (name === 'fc_projections')    return DEMO_FC_PROJECTIONS;
  if (name === 'fc_account_inputs') return DEMO_FC_INPUTS;
  return [];
}
function _demoRpc(name) {
  if (name === 'egc_usage')         return DEMO_EGC_USAGE;
  if (name === 'egc_post_weeks')    return DEMO_EGC_POST_WEEKS;
  if (name === 'egc_company_posts') return DEMO_EGC_COMPANY_POSTS;
  return [];
}
function _demoQuery(table, op, payload) {
  const ctx = { table, op, payload, filters: [], order: null, single: false };
  const run = () => {
    buildDemoData();
    const rows = _demoTable(table);
    if (op === 'select') {
      let out = rows.slice();
      if (ctx.filters.length) out = out.filter(r => ctx.filters.every(([c, v]) => r[c] === v));
      if (ctx.order) {
        const { col, asc } = ctx.order;
        out.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
      }
      return { data: ctx.single ? (out[0] || null) : out, error: null };
    }
    if (op === 'upsert') {
      const list = Array.isArray(payload) ? payload : [payload];
      list.forEach(p => {
        const key = ('hs_company_id' in p) ? 'hs_company_id' : ('key' in p) ? 'key' : 'id';
        const existing = rows.find(r => r[key] === p[key]);
        if (existing) Object.assign(existing, p); else rows.push({ ...p });
      });
      return { data: null, error: null };
    }
    if (op === 'insert') {
      const list = Array.isArray(payload) ? payload : [payload];
      const made = list.map(p => ({ id: (table === 'pr_requests' ? 'req-' : table === 'pr_asks' ? 'ask-' : 'row-') + 'u' + Math.random().toString(36).slice(2, 8), ...p }));
      made.forEach(r => rows.push(r));
      return { data: ctx.single ? made[0] : made, error: null };
    }
    if (op === 'update') {
      const match = r => ctx.filters.every(([c, v]) => r[c] === v);
      rows.filter(match).forEach(r => Object.assign(r, payload));
      return { data: null, error: null };
    }
    if (op === 'delete') {
      const match = r => ctx.filters.every(([c, v]) => r[c] === v);
      for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i])) rows.splice(i, 1);
      return { data: null, error: null };
    }
    return { data: null, error: null };
  };
  const builder = {
    select() { return builder; },
    single() { ctx.single = true; return builder; },
    maybeSingle() { ctx.single = true; return builder; },
    eq(col, val) { ctx.filters.push([col, val]); return builder; },
    in(col, vals) { ctx.filters.push([col, vals && vals[0]]); return builder; },
    order(col, opts) { ctx.order = { col, asc: !(opts && opts.ascending === false) }; return builder; },
    limit() { return builder; },
    then(resolve, reject) { try { return Promise.resolve(run()).then(resolve, reject); } catch (e) { return Promise.reject(e).catch(reject); } }
  };
  return builder;
}
const sb = {
  from(table) {
    return {
      select: () => _demoQuery(table, 'select'),
      insert: payload => _demoQuery(table, 'insert', payload),
      update: payload => _demoQuery(table, 'update', payload),
      delete: () => _demoQuery(table, 'delete'),
      upsert: payload => _demoQuery(table, 'upsert', payload)
    };
  },
  async rpc(name) { buildDemoData(); return { data: _demoRpc(name), error: null }; },
  storage: {
    from() {
      return {
        async upload(path, file) { try { _demoBlobs.set(path, URL.createObjectURL(file)); } catch (_) {} return { error: null }; },
        async remove(paths) { (paths || []).forEach(p => _demoBlobs.delete(p)); return { error: null }; },
        async createSignedUrls(paths) { return { data: (paths || []).map(p => ({ path: p, signedUrl: _demoBlobs.get(p) || '' })), error: null }; }
      };
    }
  },
  auth: {
    async getUser() { return { data: { user: { email: DEMO_EMAIL } } }; },
    async getSession() { return { data: { session: null } }; },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
    async signInWithOAuth() { return { error: null }; },
    async signOut() { return { error: null }; }
  }
};

// ── Intercept the serverless API routes with synthetic responses ──────────
(function () {
  const _origFetch = window.fetch ? window.fetch.bind(window) : null;
  const json = body => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  window.fetch = function (url, opts) {
    const u = String(url || '');
    buildDemoData();
    // Writes: accept and acknowledge, so the UI's optimistic paths complete.
    if (u.includes('/api/hubspot-update'))      return Promise.resolve(json({ ok: true }));
    if (u.includes('/api/health-write'))        return Promise.resolve(json({ ok: true }));
    if (u.includes('/api/forecast-deals-write'))return Promise.resolve(json({ ok: true }));
    if (u.includes('/api/forecast-expansion-write')) return Promise.resolve(json({ ok: true }));
    if (u.includes('/api/bonus-snapshot-write'))return Promise.resolve(json({ ok: true, skipped: true, quarter: Object.keys(DEMO_BONUS_SNAPSHOTS).pop() }));
    // Reads.
    if (u.includes('/api/hubspot'))             return Promise.resolve(json({ results: DEMO_HS_RESULTS }));
    if (u.includes('/api/account-health'))      return Promise.resolve(json({ map: DEMO_HEALTH_MAP }));
    if (u.includes('/api/forecast-deals'))      return Promise.resolve(json({ map: DEMO_DEALS_MAP }));
    if (u.includes('/api/forecast-expansion'))  return Promise.resolve(json({ map: DEMO_EXPANSION_MAP }));
    if (u.includes('/api/billing'))             return Promise.resolve(json(DEMO_BILLING));
    if (u.includes('/api/pr-products'))         return Promise.resolve(json({ map: DEMO_PR_MAP }));
    if (u.includes('/api/response-times'))      return Promise.resolve(json(DEMO_RT));
    if (u.includes('/api/egc-focs'))            return Promise.resolve(json(DEMO_EGC_FOCS));
    if (u.includes('/api/bonus-snapshots'))     return Promise.resolve(json({ snapshots: DEMO_BONUS_SNAPSHOTS }));
    if (u.includes('/api/lineage'))             return Promise.resolve(json({ results: [] }));
    // Anything else (fonts, Chart.js) goes out as normal.
    return _origFetch ? _origFetch(url, opts) : Promise.reject(new Error('offline demo'));
  };
})();
