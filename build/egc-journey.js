// EGC Journey tab — DEMO ONLY. Injected by build-demo.js; never part of the
// internal dashboard. A prototype of an automated (tech-touch) EGC journey:
// every step fires on its own; a human is pulled in only when a step stalls.
// All data is simulated from its own seeded PRNG so it cannot shift the other
// tabs' fixtures.
(function () {
  let s = 0x51ed2701;
  const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const DAY = 864e5, TODAY = new Date(new Date().toDateString());
  const fmtD = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const med = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  const pct = (n, d) => d ? Math.round(100 * n / d) : 0;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const STEPS = [
    { k: 'kickoff', label: 'Kickoff', target: 0, esc: null, trigger: 'Deal closed-won sets the kickoff date in the CRM', auto: 'Welcome email + seat invite to every Face of Content' },
    { k: 'seats', label: 'Seats live', target: 3, esc: 3, trigger: 'Kickoff date set', auto: 'Workspace provisioned; invite reminder on day 2', human: 'No seat by day 3 → Slack alert to EGC lead' },
    { k: 'linkedin', label: 'LinkedIn connected', target: 5, esc: 7, trigger: 'First seat activated', auto: 'In-app checklist + email nudges on days 2 and 4', human: 'Not connected by day 7 → EGC lead reaches out' },
    { k: 'draft', label: 'First draft reviewed', target: 7, esc: 10, trigger: 'LinkedIn connected', auto: '"Your first draft is ready" email, deep-linked', human: 'Two drafts expire unread → EGC lead reaches out' },
    { k: 'post', label: 'First post live', target: 14, esc: 21, trigger: 'Draft opened', auto: '48h publish reminder + example posts from their industry', human: 'No post by day 21 → auto email asking for a 15-min call, with a booking link; a person takes it once booked' },
    { k: 'pulse', label: 'Day-30 pulse', target: 30, esc: 30, trigger: 'Day 30 of pilot', auto: 'One-question NPS, in-app then email', human: 'Score ≤ 6 → booking sequence (see churn-risk plays)' },
    { k: 'habit', label: 'Posting habit', target: 45, esc: 50, trigger: 'First post published', auto: 'Weekly results digest; streak emails at 2 and 4 posts', human: 'Silent 14 days after first post → human' },
    { k: 'convert', label: 'Conversion', target: 90, esc: 75, trigger: 'Day 75 of pilot', auto: 'Results recap (posts, reach) + renewal link', human: 'Not on track at day 75 → AM owns the decision' }
  ];
  const VCOL = { v1: '#9B9890', v2: '#378ADD', v3: '#1D9E75' };
  const VNOTE = {
    v1: 'Time-based drip: emails on days 1, 7, 14, 30 whatever the account had done. No escalation.',
    v2: 'Event-triggered: each step fires when the previous milestone lands, skips steps already done, and escalates a stalled step to a human.',
    v3: 'Measured per publisher, not per account (an active manager was hiding silent publishers), and the day-30 pulse starts a booking sequence for detractors.'
  };
  const PRE = ['Aster', 'Bramble', 'Copper', 'Delta', 'Ember', 'Fjordline', 'Granite', 'Harborview', 'Iris', 'Juniper', 'Kestrel', 'Linden', 'Maplewood', 'Nimbus', 'Orchid', 'Pioneer', 'Quarry', 'Riverstone', 'Solstice', 'Tundra', 'Umber', 'Vantage', 'Willowby', 'Yarrow', 'Zephyr', 'Alderbrook', 'Beaconry', 'Cobalt', 'Driftwood', 'Everly'];
  const SUF = ['Analytics', 'Health', 'Labs', 'Capital', 'Logistics', 'Software', 'Robotics', 'Energy', 'Legal', 'Security', 'Bio', 'Studio', 'Systems', 'Advisory'];
  const OWNERS = ['Naomi Park', 'Devin Walsh', 'Jordan Ellis'];
  const INDUSTRIES = ['Financial Services', 'Hospital & Health Care', 'Computer Software', 'Retail', 'Computer & Network Security', 'Logistics & Supply Chain', 'Marketing & Advertising', 'Human Resources'];
  const REGULATED = ['Financial Services', 'Hospital & Health Care'];
  const STAGE_ORDER = ['Startup', 'Scale Up', 'Mid-Market', 'Enterprise'];
  const FIX = {
    'IT / security approval to connect LinkedIn': 'Pre-kickoff IT checklist emailed to the admin, with the security one-pager attached',
    'Drafts need compliance review': 'A compliance-reviewer seat and an approval step inside the product',
    'Publisher never logged in': 'Manager digest naming seats that have not logged in, plus a one-click magic link',
    'LinkedIn login / 2FA trouble': 'Guided reconnect flow that detects the 2FA failure and walks them through it',
    'No admin named at signing': 'Make the admin a required field on the order form',
    'Drafts off-topic for their audience': 'Topic and audience intake at kickoff, re-asked after two skipped drafts',
    'Unsure what to post first': 'Three ready-to-publish first posts, pre-approved, in the welcome email',
    'Waiting on an internal approver': 'Let the approver approve from the email, without logging in',
    'No time to review drafts': 'Approve-by-default: drafts auto-schedule unless declined within 48h',
    'Low engagement, lost motivation': 'Benchmark digest: their reach vs. peers in the same industry',
    'Not seeing ROI yet': 'Results recap at day 45, not only at day 75'
  };
  const PLAYS = [
    { k: 'idle', type: 'risk', tag: 'No login 10d', did: 'Email: your N posts are waiting to approve', signal: 'No login for 10 days', auto: 'Email: "You have N posts waiting to approve and schedule", linked straight to them', human: 'Still no login at day 17', escDays: 7 },
    { k: 'expire', type: 'risk', tag: 'Drafts expiring', signal: '2+ drafts expire unread in a row', auto: 'In-app prompt + email with the next draft', human: 'A third draft expires', escDays: 7 },
    { k: 'cadence', type: 'risk', tag: 'Under 2x/week', signal: 'Posting less than 2x a week', auto: 'Weekly digest: the reach they are missing + next drafts ready to schedule', human: 'Two weeks in a row under 2x', escDays: 14 },
    { k: 'drop', type: 'risk', tag: 'Posting dropped', signal: 'Posting drops below half their usual rate', auto: 'Digest comparing this month to their best month', human: 'Two weeks in a row', escDays: 14 },
    { k: 'li', type: 'risk', tag: 'LinkedIn broken', did: 'Reconnect email', signal: 'LinkedIn connection broken', auto: 'Immediate email: "Your posts can\'t publish — reconnect here"', human: 'Not fixed in 3 days', escDays: 3 },
    { k: 'pulse', type: 'risk', tag: 'Pulse ≤ 6', signal: 'Day-30 pulse score of 6 or lower', auto: '1) Email with a link to book an AM → 2) not booked in 7 days: second ask → 3) still not booked 7 days later: email from Maya Chen, VP Customer Success, with her booking link', human: 'Any booking hands it to that person', escDays: 14 },
    { k: 'habit60', type: 'exp', tag: 'Habit 60d', signal: 'A publisher holds a posting habit for 60+ days', auto: '"Add a teammate" seat offer', human: 'Teammate invited, no seat bought', win: 'Seat added' },
    { k: 'perf', type: 'exp', tag: 'Strong results', signal: 'Posts beat their industry benchmark, or followers up 15%+ in 30 days', auto: 'Results email: "This is working — every added voice compounds it", with a headcount calculator', human: 'Opens it twice or clicks pricing → AM', win: 'Seats added' },
    { k: 'seats', type: 'exp', tag: 'Seats full', signal: 'Every seat on the plan is active', auto: 'Upgrade offer for more seats', human: 'Account above $3k MRR → AM', win: 'Plan upgraded' },
    { k: 'case', type: 'exp', tag: 'Case study', signal: 'Converted with strong results', auto: 'Case-study / referral ask', human: 'They say yes → AM', win: 'Case study agreed' },
    { k: 'peers', type: 'exp', tag: 'Peers engaging', signal: 'Colleagues engage with posts but have no seat', auto: 'Invite suggestion to the admin', human: '—', win: 'Seat added' }
  ];
  const OUTCHIP = o => /Recovered|Booked|Seat|Plan|Case/.test(o) ? 'badge-teal' : o === 'Waiting' ? 'badge-blue' : o === 'No response' || o === 'No booking yet' ? 'badge-gray' : 'badge-coral';
  const PULSE_STEPS = ['AM booking email sent', 'Second ask sent', 'Email from the VP sent'];
  function playsHtml() {
    const P = D.plays, s30 = new Date(+TODAY - 30 * DAY), s60 = new Date(+TODAY - 60 * DAY);
    const live = x => !(x.a.done && x.a.hit.convert == null);
    const risk30 = P.filter(x => x.p.type === 'risk' && x.d >= s30), exp60 = P.filter(x => x.p.type === 'exp' && x.d >= s60);
    const atRisk = new Set(P.filter(x => x.p.type === 'risk' && x.open && x.d >= s30 && live(x)).map(x => x.a)).size;
    const closedRisk = risk30.filter(x => x.outcome !== 'Waiting');
    const lib = type => `<div class="table-card" style="margin-bottom:12px"><div class="table-wrap"><table>
      <thead><tr><th>${type === 'risk' ? 'Churn-risk signal' : 'Expansion signal'}</th><th>Automated action</th><th>Escalated to human when</th><th>Fired, 30d</th><th>${type === 'risk' ? 'Fixed with no person' : 'Won'}</th></tr></thead>
      <tbody>${PLAYS.filter(p => p.type === type).map(p => { const f = P.filter(x => x.p === p && x.d >= s30), c = P.filter(x => x.p === p && !x.open && x.outcome !== 'No response'); const won = type === 'risk' ? c.filter(x => x.outcome === 'Recovered automatically').length : c.filter(x => x.outcome === p.win).length;
        return `<tr><td>${esc(p.signal)}</td><td style="font-size:11px;color:var(--ink2)">${esc(p.auto)}</td><td style="font-size:11px;color:var(--coral)">${esc(p.human)}</td><td class="rt-val">${f.length}</td><td class="rt-val">${p.k === 'pulse' ? pct(c.filter(x => /Booked/.test(x.outcome)).length, P.filter(x => x.p === p && x.outcome !== 'Waiting').length) + '% booked' : pct(won, P.filter(x => x.p === p && x.outcome !== 'Waiting').length) + '%'}</td></tr>`; }).join('')}</tbody></table></div></div>`;
    const recent = P.filter(x => x.d >= s30).slice(0, 30);
    return `
    <div class="section-header" style="margin-top:20px"><span class="section-title">Risk &amp; expansion plays</span><span class="section-note">Fired by signals on any day, before or after conversion &middot; run alongside the journey</span></div>
    <div class="metric-grid-4" style="margin-bottom:16px">
      ${card('At risk now', atRisk, 'coral', 'accounts with an open risk play')}
      ${card('Risk plays, 30d', risk30.length, 'ink', pct(closedRisk.filter(x => x.outcome === 'Recovered automatically' || /Booked/.test(x.outcome)).length, closedRisk.length) + '% resolved without a person chasing')}
      ${card('Expansion open', exp60.filter(x => x.open).length, 'blue', 'opportunities from the last 60 days')}
      ${card('Expansion won, 60d', exp60.filter(x => x.outcome === x.p.win).length, 'teal', 'seats, upgrades and case studies')}
    </div>
    ${lib('risk')}${lib('exp')}
    <div class="table-card"><div class="table-wrap"><table>
      <thead><tr><th>Fired</th><th>Account</th><th>Play</th><th>What the automation has done</th><th>Outcome</th></tr></thead>
      <tbody>${recent.map(x => `<tr><td class="rt-val">${fmtD(x.d)}</td><td>${esc(x.a.name)}${x.a.done ? ' <span class="rt-chip fs">converted</span>' : ''}</td><td><span class="badge ${x.p.type === 'risk' ? 'badge-coral' : 'badge-teal'}">${esc(x.p.tag)}</span></td><td style="font-size:11px;color:var(--ink2)">${x.p.k === 'pulse' ? PULSE_STEPS.slice(0, x.steps).join(' → ') : esc(x.p.did || x.p.auto.split(':')[0])}</td><td><span class="badge ${OUTCHIP(x.outcome)}">${esc(x.outcome)}</span></td></tr>`).join('')}</tbody>
    </table></div></div>
    <div class="rt-note">Last 30 days, newest first. Illustrative thresholds.</div>`;
  }
  const signals = a => D.plays.filter(x => x.a === a && x.open).map(x => `<span class="badge ${x.p.type === 'risk' ? 'badge-coral' : 'badge-teal'}" style="margin:1px">${esc(x.p.tag)}</span>`).join('') || '<span class="rt-pending">—</span>';

  let D = null, view = 'all';
  const charts = {};

  function build() {
    const used = new Set(), accts = [];
    for (let m = 5; m >= 0; m--) {
      const v = m >= 4 ? 'v1' : m >= 2 ? 'v2' : 'v3';
      const n = rint(19, 26);
      for (let j = 0; j < n; j++) {
        let name; do { name = PRE[rint(0, PRE.length - 1)] + ' ' + SUF[rint(0, SUF.length - 1)]; } while (used.has(name)); used.add(name);
        const mStart = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1);
        const span = m === 0 ? Math.max(1, Math.round((TODAY - mStart) / DAY)) : 28;
        const kickoff = new Date(+mStart + rint(0, span - 1) * DAY);
        const age = Math.round((TODAY - kickoff) / DAY), i = v === 'v1' ? 0 : v === 'v2' ? 1 : 2;
        // Segments, with deliberate patterns to find: enterprise stalls on IT
        // approval, regulated industries on compliance review, startups on time.
        const r0 = rnd(), stage = r0 < 0.3 ? 'Startup' : r0 < 0.6 ? 'Scale Up' : r0 < 0.85 ? 'Mid-Market' : 'Enterprise';
        const industry = INDUSTRIES[rint(0, INDUSTRIES.length - 1)];
        const ent = stage === 'Enterprise', reg = REGULATED.includes(industry), su = stage === 'Startup';
        // Planned day each step lands (null = never). Later versions move faster and drop fewer.
        const plan = { kickoff: 0 };
        plan.seats = rnd() < 0.97 ? (i ? rint(0, 2) : rint(1, 6)) : null;
        plan.linkedin = plan.seats != null && rnd() < [0.84, 0.91, 0.94][i] * (ent ? 0.78 : 1) ? plan.seats + rint(1, i ? 3 : 6) : null;
        plan.draft = plan.linkedin != null && rnd() < 0.95 * (reg ? 0.8 : 1) ? plan.linkedin + rint(1, 3) : null;
        plan.post = plan.draft != null && rnd() < [0.74, 0.85, 0.89][i] * (reg ? 0.9 : 1) ? plan.draft + (i === 0 ? rint(8, 30) : i === 1 ? rint(4, 16) : rint(3, 12)) : null;
        plan.habit = plan.post != null && rnd() < [0.55, 0.68, 0.76][i] * (su ? 0.72 : 1) ? Math.min(58, plan.post + rint(14, 30)) : null;
        plan.pulse = rnd() < 0.62 ? 30 + rint(0, 5) : null;
        const pConv = plan.habit != null ? [0.78, 0.82, 0.86][i] : plan.post != null ? 0.33 : 0.06;
        plan.convert = rnd() < pConv ? 90 : null;
        const score = plan.pulse != null ? (plan.habit != null ? rint(7, 10) : rint(3, 8)) : null;
        const hit = {};
        STEPS.forEach(st => { hit[st.k] = plan[st.k] != null && plan[st.k] <= age ? plan[st.k] : null; });
        accts.push({ name, v, kickoff, age, plan, hit, score, stage, industry, ent, reg, su });
      }
    }
    // Current state, escalations and the touch log.
    const touches = [];
    const addT = (a, day, ch) => { const d = new Date(+a.kickoff + day * DAY); if (d <= TODAY) touches.push({ d, ch, a }); };
    accts.forEach(a => {
      a.done = a.age >= 90;
      const seq = STEPS.filter(st => st.k !== 'pulse');
      a.cur = a.done ? null : seq.find(st => a.hit[st.k] == null) || null;
      a.escalated = [];
      if (a.v === 'v1') { [1, 7, 14, 30, 45, 60, 75].forEach(d => addT(a, d, 'email')); }
      else {
        let prev = 0;
        seq.slice(1).forEach(st => {
          const reached = a.hit[st.k], from = prev;
          if (from == null) return;
          [0, 2, 4].forEach((o, n) => { const d = from + o; if ((reached == null || d < reached) && d <= Math.max(st.target, from + 1)) addT(a, d, n % 2 ? 'inapp' : 'email'); });
          if (reached == null && a.age >= st.esc && !(st.k === 'convert' && a.hit.habit != null)) { a.escalated.push(st); addT(a, st.esc, 'human'); }
          prev = reached;
        });
        if (a.age >= 30) addT(a, 30, 'inapp');
              }
      if (a.done) a.status = a.hit.convert != null ? 'Converted' : 'Exited';
      else if (a.cur && a.age > a.cur.target && a.v !== 'v1' && a.escalated.includes(a.cur)) a.status = 'Escalated to human';
      else if (a.cur && a.age > a.cur.target) a.status = 'Late';
      else a.status = 'On track';
      a.touches = touches.filter(t => t.a === a).length;
    });
    // Signal-driven plays: churn risk and expansion, fired on any day, including
    // after conversion. Health drives how often each one fires.
    const plays = [];
    accts.forEach(a => {
      const end = a.done && a.hit.convert == null ? 90 : a.age;
      const h = a.plan.habit != null ? 2 : a.plan.post != null ? 1 : 0;
      const fire = (p, day) => { if (day != null && day <= end) plays.push({ a, p, day, d: new Date(+a.kickoff + day * DAY), el: end - day }); };
      const P = k => PLAYS.find(p => p.k === k);
      if (rnd() < [0.6, 0.3, 0.08][h]) fire(P('idle'), (a.plan.seats ?? 0) + rint(12, 60));
      if (rnd() < [0.5, 0.25, 0.05][h]) fire(P('expire'), (a.plan.draft ?? 8) + rint(5, 40));
      if (a.plan.post != null && rnd() < [0, 0.55, 0.15][h]) fire(P('cadence'), a.plan.post + rint(14, 50));
      if (a.plan.post != null && rnd() < [0, 0.3, 0.12][h]) fire(P('drop'), a.plan.post + rint(30, 80));
      if (a.plan.linkedin != null && rnd() < 0.12) fire(P('li'), a.plan.linkedin + rint(10, 120));
      if (a.score != null && a.score <= 6) fire(P('pulse'), a.plan.pulse);
      if (a.plan.habit != null && rnd() < 0.55) fire(P('habit60'), a.plan.habit + 60);
      if (h === 2 && rnd() < 0.5) fire(P('perf'), a.plan.post + rint(30, 70));
      if (h >= 1 && rnd() < 0.3) fire(P('seats'), rint(40, 150));
      if (h === 2 && a.plan.convert != null && rnd() < 0.4) fire(P('case'), 90 + rint(10, 40));
      if (h >= 1 && rnd() < 0.35) fire(P('peers'), a.plan.post + rint(20, 80));
      a.health = h;
    });
    plays.forEach(x => {
      const p = x.p, h = x.a.health;
      if (p.k === 'pulse') {
        const r = rnd();
        x.steps = x.el < 7 ? 1 : x.el < 14 ? 2 : 3;
        x.outcome = r < 0.45 ? 'Booked with AM' : r < 0.65 && x.steps >= 2 ? 'Booked with AM' : r < 0.8 && x.steps === 3 ? 'Booked with VP' : x.steps < 3 ? 'Waiting' : 'No booking yet';
        if (x.outcome === 'Booked with AM' && r >= 0.45) x.steps = 2; else if (x.outcome === 'Booked with AM') x.steps = 1;
      } else if (p.type === 'risk') x.outcome = x.el < p.escDays ? 'Waiting' : rnd() < [0.35, 0.55, 0.75][h] ? 'Recovered automatically' : 'Escalated to human';
      else x.outcome = x.el < 14 ? 'Waiting' : rnd() < 0.4 ? p.win : rnd() < 0.5 ? 'Escalated to human' : 'No response';
      x.open = ['Waiting', 'Escalated to human', 'No booking yet'].includes(x.outcome);
    });
    plays.sort((x, y) => y.d - x.d);
    // Plays are automation too: count each automated send, and each hand-off
    // (an escalation, or a booked call a person then takes) as a human touch.
    plays.forEach(x => {
      const at = (day, ch) => { const d = new Date(+x.a.kickoff + day * DAY); if (d <= TODAY) touches.push({ d, ch, a: x.a }); };
      if (x.p.k === 'pulse') { for (let n = 0; n < x.steps; n++) at(x.day + 7 * n, 'play'); if (/Booked/.test(x.outcome)) at(x.day + 7 * (x.steps - 1) + 2, 'human'); }
      else { at(x.day, 'play'); if (x.outcome === 'Escalated to human') at(x.day + (x.p.escDays || 14), 'human'); }
    });
    // Every hand-off to a person, with the root cause the owner logged.
    const escs = [];
    const pickc = a => a[rint(0, a.length - 1)];
    const causeFor = (a, k) => ({
      seats: 'No admin named at signing',
      linkedin: a.ent ? 'IT / security approval to connect LinkedIn' : pickc(['Publisher never logged in', 'LinkedIn login / 2FA trouble']),
      draft: a.reg ? 'Drafts need compliance review' : pickc(['Drafts off-topic for their audience', 'Publisher never logged in']),
      post: a.reg && rnd() < 0.5 ? 'Drafts need compliance review' : pickc(['Unsure what to post first', 'Waiting on an internal approver']),
      habit: a.su ? 'No time to review drafts' : pickc(['No time to review drafts', 'Low engagement, lost motivation']),
      convert: 'Not seeing ROI yet',
      idle: a.su && rnd() < 0.5 ? 'No time to review drafts' : pickc(['Publisher never logged in', 'Waiting on an internal approver']), expire: a.reg ? 'Drafts need compliance review' : a.su ? 'No time to review drafts' : 'Drafts off-topic for their audience', cadence: a.su ? 'No time to review drafts' : pickc(['Low engagement, lost motivation', 'Unsure what to post first']),
      drop: 'Low engagement, lost motivation', li: 'LinkedIn login / 2FA trouble'
    })[k];
    const before = (a, d) => touches.filter(t => t.a === a && t.ch !== 'human' && t.d <= d).length;
    accts.forEach(a => a.escalated.forEach(st => {
      const d = new Date(+a.kickoff + st.esc * DAY), fixed = a.hit[st.k];
      escs.push({ a, where: st.label, kind: 'Journey step', cause: causeFor(a, st.k), d, open: !a.done && a.cur === st, days: fixed != null ? fixed - st.esc : a.done ? 90 - st.esc : a.age - st.esc, next: st.human, prior: before(a, d) });
    }));
    plays.filter(x => x.p.type === 'risk' && x.p.k !== 'pulse' && x.outcome === 'Escalated to human').forEach(x => {
      const d = new Date(+x.d + x.p.escDays * DAY); if (d > TODAY) return;
      const age = Math.round((TODAY - d) / DAY), res = rint(2, 12), live = !(x.a.done && x.a.hit.convert == null);
      escs.push({ a: x.a, where: x.p.signal, kind: 'Risk play', cause: causeFor(x.a, x.p.k), d, open: live && age < res, days: Math.min(age, res), next: x.p.human, prior: before(x.a, d) });
    });
    escs.sort((x, y) => y.d - x.d);
    // Bugs and feature requests, tagged with where in the journey they surfaced.
    const REQ = [['Bulk schedule posts across all seats', 'feature'], ['Salesforce / CRM integration', 'feature'], ['LinkedIn carousel (multi-image) posts', 'feature'], ['Dark mode for the dashboard', 'feature'],
      ['Scheduled posts publishing in the wrong timezone', 'bug'], ['Analytics export missing the last 7 days', 'bug'], ['Avatar upload fails on Safari', 'bug'], ['SSO / SAML login', 'feature']];
    const SEQK = STEPS.filter(st => st.k !== 'pulse');
    const reqs = [];
    accts.forEach(a => {
      const end = a.done && a.hit.convert == null ? 90 : a.age, n = rnd() < (a.ent ? 0.6 : 0.33) ? rint(1, a.ent ? 2 : 1) : 0;
      for (let j = 0; j < n; j++) {
        const day = rint(1, Math.max(1, end));
        const at = SEQK.find(st => a.plan[st.k] == null || a.plan[st.k] > day) || { label: 'After conversion' };
        const w = a.ent ? [0, 5, 7, 7] : a.su ? [0, 2, 5, 6] : a.reg ? [1, 4, 5, 6] : [0, 2, 3, 4, 5, 6];
        let r = REQ[pickc(w)]; if (at.k === 'linkedin' && a.ent) r = REQ[7]; if (at.k === 'post' && rnd() < 0.4) r = REQ[4];
        const d = new Date(+a.kickoff + day * DAY);
        reqs.push({ a, title: r[0], type: r[1], at: at.label, d, onEsc: escs.some(e => e.a === a && Math.abs(e.d - d) < 5 * DAY) });
      }
    });
    return { accts, touches, plays, escs, reqs };
  }

  const CHIP = { 'On track': 'badge-teal', 'Late': 'badge-amber', 'Escalated to human': 'badge-coral', 'Converted': 'badge-teal', 'Exited': 'badge-gray' };
  const card = (label, val, cls, sub, tip) => `<div class="mcard"><div class="mcard-label">${label}${tip ? ` <span class="info-icon" onmouseenter="showInfoTip(event,'${label.replace(/'/g, '')}','${tip.replace(/'/g, '&#39;')}')" onmousemove="posTip(event)" onmouseleave="hideTip()">i</span>` : ''}</div><div class="mcard-value ${cls}">${val}</div><div class="mcard-sub">${sub}</div></div>`;

  function render() {
    const root = document.getElementById('tab-egcjourney');
    const A = D.accts, live = A.filter(a => !a.done);
    const since30 = new Date(+TODAY - 30 * DAY), t30 = D.touches.filter(t => t.d >= since30);
    const auto30 = t30.filter(t => t.ch !== 'human').length, hum30 = t30.filter(t => t.ch === 'human').length;
    const byV = v => A.filter(a => a.v === v);
    const ttv = v => med(byV(v).map(a => a.hit.post).filter(x => x != null));
    const habitRate = v => { const e = byV(v).filter(a => a.age >= 60); return pct(e.filter(a => a.hit.habit != null).length, e.length); };
    const convRate = v => { const e = byV(v).filter(a => a.done); return e.length ? pct(e.filter(a => a.hit.convert != null).length, e.length) : null; };
    const humanLive = live.filter(a => a.status === 'Escalated to human');
    const monthKick = A.filter(a => a.kickoff.getMonth() === TODAY.getMonth() && a.kickoff.getFullYear() === TODAY.getFullYear()).length;

    const stepCounts = STEPS.map(st => live.filter(a => a.cur === st).length);
    const reach = STEPS.map(st => { const e = A.filter(a => a.age >= st.target + 14); return pct(e.filter(a => a.hit[st.k] != null).length, e.length); });

    const rows = live.slice().sort((x, y) => ['Escalated to human', 'Late', 'On track'].indexOf(x.status) - ['Escalated to human', 'Late', 'On track'].indexOf(y.status) || y.age - x.age);
    // Progress through the sequential steps. The pulse is calendar-driven, not
    // a step toward conversion, so it gets its own column.
    const SEQ = STEPS.filter(st => st.k !== 'pulse');
    const SCOL = { 'On track': '#378ADD', 'Late': '#BA7517', 'Escalated to human': '#D85A30' };
    const progress = a => { const i = SEQ.indexOf(a.cur), over = a.age - a.cur.target;
      return `<span class="rt-val" style="font-size:11px">Step ${i + 1} of ${SEQ.length}</span>${over > 0 ? ` <span style="font-size:11px;color:${SCOL[a.status]}">&middot; ${over} days past target</span>` : ''}<span class="egc-meter" style="max-width:140px"><i style="width:${Math.round(100 * i / SEQ.length)}%;background:${SCOL[a.status]}"></i></span>`; };
    const pulseChip = a => a.hit.pulse == null ? '<span class="rt-pending">—</span>' : `<span class="badge ${a.score >= 9 ? 'badge-teal' : a.score >= 7 ? 'badge-gray' : 'badge-coral'}">${a.score}</span>`;
    const dots = a => STEPS.map(st => {
      const h = a.hit[st.k], cur = a.cur === st;
      const col = h != null ? '#1D9E75' : cur ? (a.status === 'On track' ? '#378ADD' : a.status === 'Late' ? '#BA7517' : '#D85A30') : 'var(--surface2)';
      const t = st.label + ': ' + (h != null ? 'day ' + h : cur ? 'current step (target day ' + st.target + ')' : 'not yet');
      return `<span class="ej-dot" title="${esc(t)}" style="background:${col}"></span>`;
    }).join('');
    const nextTouch = a => a.status === 'Escalated to human' ? esc(a.cur.human) : a.cur ? esc(a.cur.auto) : '—';

    root.innerHTML = `
    <div class="ej-banner">Prototype &middot; a tech-touch journey for EGC accounts. Every step below fires automatically from product and CRM events; a person is pulled in only when a step stalls. All accounts and numbers are simulated.</div>
    <div class="prt-toolbar" style="margin-top:4px"><div class="prt-seg" id="ej-filter">
      <button class="prt-seg-btn${view === 'all' ? ' active' : ''}" data-view="all">All in flight</button>
      <button class="prt-seg-btn${view === 'human' ? ' active' : ''}" data-view="human">Escalated to human</button></div>
      <div class="prt-toolbar-spacer"></div><span class="rt-note" style="margin-top:0">${A.length} accounts kicked off in 6 months &middot; ${D.touches.length.toLocaleString()} journey events</span></div>

    ${view === 'human' ? escHtml() : `
    <div class="section-header"><span class="section-title">EGC journey</span><span class="section-note">Pilot kickoff to conversion in 8 milestones &middot; 90-day pilot</span></div>
    <div class="metric-grid-6" style="margin-bottom:20px">
      ${card('In the journey', live.length, 'ink', monthKick + ' kicked off this month')}
      ${card('Days to first post', ttv('v3') ?? '—', 'teal', 'median, v3 cohorts &middot; v1 was ' + ttv('v1'), 'Median days from kickoff to the first published post, for accounts that have posted. Target: 14.')}
      ${card('Posting habit', habitRate('v2') + '%', 'blue', 'v2 cohorts at day 60 &middot; v1 ' + habitRate('v1') + '%', '4+ posts in 30 days per publisher, among accounts at least 60 days in. v3 cohorts are not 60 days in yet.')}
      ${card('Pilot → paid', (convRate('v2') ?? '—') + '%', 'teal', 'v2 cohorts &middot; v1 ' + convRate('v1') + '%', 'Share of completed 90-day pilots that converted. v3 cohorts have not reached day 90 yet.')}
      ${card('Automated touches', auto30.toLocaleString(), 'ink', 'last 30 days &middot; journey + plays')}
      ${card('Human hand-offs', hum30, 'coral', 'last 30 days &middot; ' + humanLive.length + ' accounts waiting now', 'A journey step or a play passed its escalation point, or a customer booked time, so a person took it from there.')}
    </div>

    <div class="section-header"><span class="section-title">The journey</span><span class="section-note">Trigger &rarr; automated touch &rarr; when a human steps in &middot; count = accounts at that step now</span></div>
    <div class="ej-map">${STEPS.map((st, n) => `
      <div class="ej-step"><div class="ej-step-top"><span class="ej-num">${st.k === 'pulse' ? 'P' : STEPS.filter(x => x.k !== 'pulse').indexOf(st) + 1}</span><span class="ej-day">day ${st.target}</span></div>
        <div class="ej-label">${st.label}</div>
        <div class="ej-count"><b>${stepCounts[n]}</b> here now &middot; ${reach[n]}% reach it</div>
        <div class="ej-row"><i>When</i>${esc(st.trigger)}</div>
        <div class="ej-row"><i>Auto</i>${esc(st.auto)}</div>
        <div class="ej-row ej-h"><i>Human</i>${esc(st.human || '—')}</div></div>`).join('')}</div>

    <div class="chart-row" style="margin-top:12px">
      <div class="chart-card"><div class="chart-card-title">Where accounts drop off, by journey version</div><div class="chart-card-sub" id="ejFunnelSub">Share of accounts that reached each milestone &middot; the gap between lines is what each version recovered</div><div class="chart-wrap-lg"><canvas id="ejFunnel"></canvas></div></div>
      <div class="chart-card"><div class="chart-card-title">Median days to first post, by kickoff month</div><div class="chart-card-sub">Colour = journey version live when the cohort started &middot; dashed line is the 14-day target</div><div class="chart-wrap-lg"><canvas id="ejTtv"></canvas></div></div>
    </div>
    <div class="chart-card"><div class="chart-card-title">Automation leverage</div>
      <div class="ej-lev"><div><b>~${hum30 ? Math.round(auto30 / hum30) : '—'}</b> automated touches for every 1 hand-off to a person</div><div><b>${pct(auto30, auto30 + hum30)}%</b> automated</div><div><b>≈ ${Math.round(hum30 * 0.5)}</b> CSM hours for ${live.length} accounts in flight</div></div>
      <div class="chart-card-sub">Last 30 days, journey steps and plays combined &middot; hours assume 30 minutes per hand-off (illustrative) &middot; chart: by month, hand-offs on the right-hand scale</div>
      <div class="chart-wrap-md"><canvas id="ejWeek"></canvas></div></div>

    <div class="section-header" style="margin-top:20px"><span class="section-title">How the journey changed: v1 &rarr; v3</span><span class="section-note">Each version is the kickoff cohorts that ran on it</span></div>

    <div class="ej-versions">${['v1', 'v2', 'v3'].map(v => `<div class="ej-v" style="border-left-color:${VCOL[v]}"><b>${v}</b> <span class="rt-note" style="margin:0">${byV(v).length} accounts</span><div>${VNOTE[v]}</div></div>`).join('')}</div>

    ${playsHtml()}

    <div class="section-header" style="margin-top:20px"><span class="section-title">Accounts in flight</span><span class="section-note">Steps match the numbered cards in the journey map &middot; P is the day-30 pulse, shown separately</span></div>
    <div class="table-card"><div class="table-wrap"><table>
      <thead><tr><th>Account</th><th>Kickoff</th><th>Day</th><th>Progress</th><th>Current step</th><th>Status</th><th>Pulse</th><th>Signals</th><th>Touches</th><th>Next action</th><th>Owner</th></tr></thead>
      <tbody>${rows.map((a, n) => `<tr><td>${esc(a.name)}</td><td class="rt-val">${fmtD(a.kickoff)}</td><td class="rt-val">${a.age}</td><td style="white-space:nowrap">${progress(a)}</td><td>${a.cur ? esc(a.cur.label) : '—'}</td><td><span class="badge ${CHIP[a.status]}">${a.status}</span></td><td>${pulseChip(a)}</td><td>${signals(a)}</td><td class="rt-val">${a.touches}</td><td style="font-size:11px;color:var(--ink2)">${nextTouch(a)}</td><td>${a.status === 'Escalated to human' ? OWNERS[n % OWNERS.length] : '<span class="rt-pending">Automated</span>'}</td></tr>`).join('') || '<tr><td colspan="11" class="rt-empty">Nobody is waiting on a person.</td></tr>'}</tbody>
    </table></div></div>
    <div class="rt-note">v1 accounts have finished their pilots, so every account in flight is on v2 or v3.</div>`}`;

    root.querySelectorAll('#ej-filter .prt-seg-btn').forEach(b => b.onclick = () => { view = b.dataset.view; render(); });
    if (view === 'human') drawEscCharts(); else drawCharts(reach);
  }

  const top = (arr, f) => { const c = {}; arr.forEach(x => { const k = f(x); c[k] = (c[k] || 0) + 1; }); const e = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return e ? e[0] + ' <span class="rt-dim">' + pct(e[1], arr.length) + '%</span>' : '—'; };
  function escHtml() {
    const E = D.escs, open = E.filter(e => e.open).sort((x, y) => y.days - x.days), s90 = new Date(+TODAY - 90 * DAY), e90 = E.filter(e => e.d >= s90);
    const escAccts = new Set(E.map(e => e.a)), shut = E.filter(e => !e.open);
    const causes = Object.entries(E.reduce((m, e) => (m[e.cause] = (m[e.cause] || []).concat(e), m), {})).sort((a, b) => b[1].length - a[1].length);
    const RQ = D.reqs, titles = Object.entries(RQ.reduce((m, r) => (m[r.title] = (m[r.title] || []).concat(r), m), {})).sort((a, b) => b[1].length - a[1].length);
    return `
    <div class="section-header"><span class="section-title">Escalated to human &middot; open now</span><span class="section-note">Every account a person owns right now, and why &middot; longest open first</span></div>
    <div class="table-card"><div class="table-wrap"><table>
      <thead><tr><th>Account</th><th>Stage</th><th>Industry</th><th>Escalated at</th><th>Root cause</th><th>Escalated</th><th>Days open</th><th>Auto touches first</th><th>What the person does</th><th>Owner</th></tr></thead>
      <tbody>${open.map((e, n) => `<tr><td>${esc(e.a.name)}</td><td>${e.a.stage}</td><td style="font-size:11px">${esc(e.a.industry)}</td><td><span class="badge ${e.kind === 'Risk play' ? 'badge-coral' : 'badge-amber'}">${esc(e.where)}</span></td><td>${esc(e.cause)}</td><td class="rt-val">${fmtD(e.d)}</td><td class="rt-val">${e.days}</td><td class="rt-val">${e.prior}</td><td style="font-size:11px;color:var(--ink2)">${esc(e.next)}</td><td>${OWNERS[n % OWNERS.length]}</td></tr>`).join('') || '<tr><td colspan="10" class="rt-empty">Nobody is waiting on a person.</td></tr>'}</tbody>
    </table></div></div>
    <div class="rt-note">Amber: a journey step stalled. Coral: a churn-risk play did not recover on its own. "Auto touches first" is how much the automation tried before handing it over.</div>

    <div class="section-header" style="margin-top:20px"><span class="section-title">Why escalations happen</span><span class="section-note">All ${A_LEN()} accounts from the last 6 months &middot; rates, not counts, so big segments do not win by size</span></div>
    <div class="metric-grid-5">
      ${card('Open now', open.length, 'coral', 'accounts a person owns')}
      ${card('Escalations, 90d', e90.length, 'ink', e90.filter(e => e.kind === 'Journey step').length + ' journey steps &middot; ' + e90.filter(e => e.kind === 'Risk play').length + ' risk plays')}
      ${card('Accounts escalated', pct(escAccts.size, D.accts.length) + '%', 'blue', escAccts.size + ' of ' + D.accts.length + ' at least once')}
      ${card('Days to resolve', med(shut.map(e => e.days)) ?? '—', 'teal', 'median, once a person has it')}
      ${card('Top root cause', causes.length ? pct(causes[0][1].length, E.length) + '%' : '—', 'coral', causes.length ? esc(causes[0][0]) : '')}
    </div>
    <div class="chart-row">
      <div class="chart-card"><div class="chart-card-title">Where escalations happen</div><div class="chart-card-sub">Escalations by journey step or play &middot; all time</div><div class="chart-wrap-lg"><canvas id="ejEscStep"></canvas></div></div>
      <div class="chart-card"><div class="chart-card-title">Root causes, by company stage</div><div class="chart-card-sub">What the owner logged after talking to the customer</div><div class="chart-wrap-lg"><canvas id="ejEscCause"></canvas></div></div>
    </div>
    <div class="chart-row">
      <div class="chart-card"><div class="chart-card-title">Escalation rate by stage</div><div class="chart-card-sub">Share of accounts in each stage escalated at least once</div><div class="chart-wrap-md"><canvas id="ejEscStage"></canvas></div></div>
      <div class="chart-card"><div class="chart-card-title">Escalation rate by industry</div><div class="chart-card-sub">Share of accounts in each industry escalated at least once &middot; coral = regulated industries</div><div class="chart-wrap-md"><canvas id="ejEscInd"></canvas></div></div>
    </div>
    <div class="section-header" style="margin-top:8px"><span class="section-title">What to automate next</span><span class="section-note">Root causes ranked by volume &middot; the commonality column says who to build it for first</span></div>
    <div class="table-card"><div class="table-wrap"><table>
      <thead><tr><th>Root cause</th><th>Escalations</th><th>Share</th><th>Most common stage</th><th>Most common industry</th><th>Most common step</th><th>Automation that would prevent it</th></tr></thead>
      <tbody>${causes.map(([c, l]) => `<tr><td>${esc(c)}</td><td class="rt-val">${l.length}</td><td class="rt-val">${pct(l.length, E.length)}%</td><td>${top(l, e => e.a.stage)}</td><td style="font-size:11px">${top(l, e => e.a.industry)}</td><td style="font-size:11px">${top(l, e => e.where)}</td><td style="font-size:11px;color:var(--teal)">${esc(FIX[c] || '')}</td></tr>`).join('')}</tbody>
    </table></div></div>

    <div class="section-header" style="margin-top:20px"><span class="section-title">Bugs &amp; feature requests in the journey</span><span class="section-note">The same requests as the Product Request Tracker, placed by when in the journey they surfaced and who raised them</span></div>
    <div class="chart-row">
      <div class="chart-card"><div class="chart-card-title">Where in the journey requests surface</div><div class="chart-card-sub">The step the account was on when it raised the request</div><div class="chart-wrap-md"><canvas id="ejReqStep"></canvas></div></div>
      <div class="chart-card"><div class="chart-card-title">Who raises them</div><div class="chart-card-sub">Requests per 10 accounts, by stage</div><div class="chart-wrap-md"><canvas id="ejReqStage"></canvas></div></div>
    </div>
    <div class="table-card"><div class="table-wrap"><table>
      <thead><tr><th>Request</th><th>Type</th><th>Times raised</th><th>Most common step</th><th>Most common stage</th><th>Most common industry</th><th>Raised on an escalation</th></tr></thead>
      <tbody>${titles.map(([t, l]) => `<tr><td>${esc(t)}</td><td><span class="badge ${l[0].type === 'bug' ? 'badge-coral' : 'badge-blue'}">${l[0].type}</span></td><td class="rt-val">${l.length}</td><td style="font-size:11px">${top(l, r => r.at)}</td><td>${top(l, r => r.a.stage)}</td><td style="font-size:11px">${top(l, r => r.a.industry)}</td><td class="rt-val">${pct(l.filter(r => r.onEsc).length, l.length)}%</td></tr>`).join('')}</tbody>
    </table></div></div>
    <div class="rt-note">"Raised on an escalation" = raised within 5 days of a hand-off to a person: the request surfaced because someone asked. Simulated data.</div>`;
  }
  const A_LEN = () => D.accts.length;

  function drawEscCharts() {
    if (typeof Chart === 'undefined') return;
    Object.keys(charts).forEach(k => { charts[k].destroy(); delete charts[k]; });
    const A = D.accts, E = D.escs, R = D.reqs, grid = { color: 'rgba(26,25,22,0.06)' }, tk = { font: { size: 10 } };
    const PAL = ['#378ADD', '#1D9E75', '#BA7517', '#7F77DD'];
    const hbar = (id, labels, data, color, suffix) => { charts[id] = new Chart(document.getElementById(id), { type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: color, borderRadius: 4, maxBarThickness: 16 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw + (suffix || '') } } },
        scales: { x: { beginAtZero: true, ticks: { ...tk, callback: v => v + (suffix || '') }, grid }, y: { ticks: tk, grid: { display: false } } } } }); };
    const byWhere = Object.entries(E.reduce((m, e) => (m[e.where] = (m[e.where] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);
    hbar('ejEscStep', byWhere.map(x => x[0].length > 34 ? x[0].slice(0, 32) + '…' : x[0]), byWhere.map(x => x[1]), byWhere.map(x => E.find(e => e.where === x[0]).kind === 'Risk play' ? '#D85A30' : '#BA7517'));
    const rate = (key, v) => { const g = A.filter(a => a[key] === v); return pct(g.filter(a => E.some(e => e.a === a)).length, g.length); };
    hbar('ejEscStage', STAGE_ORDER, STAGE_ORDER.map(v => rate('stage', v)), '#378ADD', '%');
    const inds = INDUSTRIES.map(v => [v, rate('industry', v)]).sort((a, b) => b[1] - a[1]);
    hbar('ejEscInd', inds.map(x => x[0]), inds.map(x => x[1]), inds.map(x => REGULATED.includes(x[0]) ? '#D85A30' : '#378ADD'), '%');
    const causes = Object.entries(E.reduce((m, e) => (m[e.cause] = (m[e.cause] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    charts.ejEscCause = new Chart(document.getElementById('ejEscCause'), { type: 'bar',
      data: { labels: causes.map(c => c.length > 34 ? c.slice(0, 32) + '…' : c), datasets: STAGE_ORDER.map((st, n) => ({ label: st, backgroundColor: PAL[n], maxBarThickness: 16, data: causes.map(c => E.filter(e => e.cause === c && e.a.stage === st).length) })) },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10 } } },
        scales: { x: { stacked: true, ticks: tk, grid }, y: { stacked: true, ticks: tk, grid: { display: false } } } } });
    const steps = [...STEPS.filter(s => s.k !== 'pulse').map(s => s.label), 'After conversion'].filter(l => R.some(r => r.at === l));
    const stack = (id, labels, key, horiz, norm) => { charts[id] = new Chart(document.getElementById(id), { type: 'bar',
      data: { labels, datasets: [['bug', 'Bug', '#D85A30'], ['feature', 'Feature', '#378ADD']].map(([t, l, c]) => ({ label: l, backgroundColor: c, borderRadius: 3, maxBarThickness: 28,
        data: labels.map(v => { const n = R.filter(r => r.type === t && key(r) === v).length; return norm ? +(10 * n / Math.max(1, A.filter(a => a.stage === v).length)).toFixed(1) : n; }) })) },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10 } } }, scales: { x: { stacked: true, ticks: tk, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: tk, grid } } } }); };
    stack('ejReqStep', steps, r => r.at);
    stack('ejReqStage', STAGE_ORDER, r => r.a.stage, false, true);
  }

  function drawCharts() {
    if (typeof Chart === 'undefined') return;
    Object.keys(charts).forEach(k => { charts[k].destroy(); delete charts[k]; });
    const A = D.accts, grid = { color: 'rgba(26,25,22,0.06)' }, tk = { font: { size: 10 } };
    // The pulse is a survey response rate, not a step toward conversion, so it
    // stays out of the drop-off line. A version stops where its accounts have
    // not yet reached the milestone, rather than drawing a false zero.
    const FUN = STEPS.filter(st => st.k !== 'pulse');
    const v3Last = FUN.filter(st => A.filter(a => a.v === 'v3' && a.age >= st.target + 14).length >= 5).pop();
    const nx = FUN[FUN.indexOf(v3Last) + 1];
    if (nx) document.getElementById('ejFunnelSub').innerHTML += ' &middot; v3 stops at ' + v3Last.label + ': its accounts have not reached day ' + (nx.target + 14) + ' yet';
    charts.f = new Chart(document.getElementById('ejFunnel'), {
      type: 'line',
      data: { labels: FUN.map(s => s.label), datasets: ['v1', 'v2', 'v3'].map(v => ({ label: v, borderColor: VCOL[v], backgroundColor: VCOL[v], borderWidth: 2.5, pointRadius: 3.5, tension: 0.25, spanGaps: false,
        data: FUN.map(st => { const e = A.filter(a => a.v === v && a.age >= st.target + 14); return e.length >= 5 ? pct(e.filter(a => a.hit[st.k] != null).length, e.length) : null; }) })) },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10 } }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + c.raw + '% reached it' } } },
        scales: { y: { beginAtZero: true, max: 100, ticks: { ...tk, callback: v => v + '%' }, grid }, x: { ticks: tk, grid: { display: false } } } }
    });
    const months = [...new Set(A.map(a => a.kickoff.getFullYear() * 12 + a.kickoff.getMonth()))].sort((a, b) => a - b);
    const coh = months.map(m => A.filter(a => a.kickoff.getFullYear() * 12 + a.kickoff.getMonth() === m));
    const target = { id: 'ejTarget', afterDatasetsDraw(c) { const y = c.scales.y.getPixelForValue(14), x = c.chartArea, g = c.ctx; g.save(); g.setLineDash([4, 4]); g.strokeStyle = '#D85A30'; g.beginPath(); g.moveTo(x.left, y); g.lineTo(x.right, y); g.stroke(); g.restore(); } };
    charts.t = new Chart(document.getElementById('ejTtv'), {
      type: 'bar', plugins: [target],
      data: { labels: months.map(m => new Date(Math.floor(m / 12), m % 12, 1).toLocaleDateString('en-US', { month: 'short' })),
        datasets: [{ data: coh.map(c => med(c.map(a => a.hit.post).filter(x => x != null))), backgroundColor: coh.map(c => VCOL[c[0].v]), borderRadius: 4, maxBarThickness: 36 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw + ' days (' + coh[c.dataIndex][0].v + ', ' + coh[c.dataIndex].length + ' kickoffs)' } } },
        scales: { y: { beginAtZero: true, ticks: tk, grid, title: { display: true, text: 'Days', font: { size: 10 }, color: '#9B9890' } }, x: { ticks: tk, grid: { display: false } } } }
    });
    const mk = d => d.getFullYear() * 12 + d.getMonth(), cur = mk(TODAY);
    const ms = [...Array(6)].map((_, n) => cur - 5 + n);
    const per = h => ms.map(m => D.touches.filter(t => mk(t.d) === m && (t.ch === 'human') === h).length);
    charts.w = new Chart(document.getElementById('ejWeek'), {
      type: 'line',
      data: { labels: ms.map(m => new Date(Math.floor(m / 12), m % 12, 1).toLocaleDateString('en-US', { month: 'short' }) + (m === cur ? ' (to date)' : '')),
        datasets: [{ label: 'Automated touches', data: per(false), borderColor: '#1D9E75', backgroundColor: '#1D9E75', borderWidth: 2.5, pointRadius: 3.5, tension: 0.25, yAxisID: 'y' },
                   { label: 'Hand-offs to a person', data: per(true), borderColor: '#D85A30', backgroundColor: '#D85A30', borderWidth: 2.5, pointRadius: 3.5, tension: 0.25, yAxisID: 'y2' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10 } } },
        scales: { x: { ticks: tk, grid: { display: false } }, y: { beginAtZero: true, ticks: tk, grid, title: { display: true, text: 'Automated', font: { size: 10 }, color: '#1D9E75' } },
          y2: { position: 'right', beginAtZero: true, ticks: tk, grid: { display: false }, title: { display: true, text: 'Hand-offs', font: { size: 10 }, color: '#D85A30' } } } }
    });
  }

  const css = document.createElement('style');
  css.textContent = `.ej-banner{background:var(--blue-light);color:var(--blue);border-radius:var(--radius-sm);padding:10px 14px;font-size:12px;margin:4px 0 16px}
.ej-map{display:grid;grid-template-columns:repeat(8,minmax(150px,1fr));gap:8px;overflow-x:auto;padding-bottom:4px}
.ej-step{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 11px;box-shadow:var(--shadow);font-size:11px}
.ej-step-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.ej-num{width:18px;height:18px;border-radius:50%;background:var(--teal-mid);color:#fff;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.ej-day{font-size:10px;color:var(--ink3)}
.ej-label{font-family:'Syne',sans-serif;font-weight:600;font-size:12px;margin-bottom:4px}
.ej-count{color:var(--ink2);margin-bottom:6px}
.ej-row{color:var(--ink2);margin-top:4px;line-height:1.35}
.ej-row i{display:block;font-style:normal;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink3)}
.ej-h{color:var(--coral)}
.ej-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:3px;border:1px solid var(--border)}
.ej-lev{display:flex;gap:28px;flex-wrap:wrap;margin:6px 0 4px;font-size:12px;color:var(--ink2)}
.ej-lev b{font-family:'Syne',sans-serif;font-size:22px;color:var(--ink);margin-right:4px}
.ej-versions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ej-v{background:var(--surface);border:1px solid var(--border);border-left:4px solid;border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--ink2)}
.ej-v b{font-family:'Syne',sans-serif;color:var(--ink)}
@media (max-width:760px){.ej-versions{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  window.egcjEnsure = function () { if (!D) D = build(); render(); };
})();
