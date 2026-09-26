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
    { k: 'post', label: 'First post live', target: 14, esc: 21, trigger: 'Draft opened', auto: '48h publish reminder + example posts from their industry', human: 'No post by day 21 → 15-min call auto-booked' },
    { k: 'habit', label: 'Posting habit', target: 45, esc: 50, trigger: 'First post published', auto: 'Weekly results digest; streak emails at 2 and 4 posts', human: 'Silent 14 days after first post → human' },
    { k: 'pulse', label: 'Day-60 pulse', target: 60, esc: 67, trigger: 'Day 60 of pilot', auto: 'One-question NPS, in-app then email', human: 'Score ≤ 6 → AM call within 2 business days' },
    { k: 'convert', label: 'Conversion', target: 90, esc: 75, trigger: 'Day 75 of pilot', auto: 'Results recap (posts, reach) + renewal link', human: 'Not on track at day 75 → AM owns the decision' }
  ];
  const VCOL = { v1: '#9B9890', v2: '#378ADD', v3: '#1D9E75' };
  const VNOTE = {
    v1: 'Time-based drip: emails on days 1, 7, 14, 30 whatever the account had done. No escalation.',
    v2: 'Event-triggered: each step fires when the previous milestone lands, skips steps already done, and escalates a stalled step to a human.',
    v3: 'Measured per publisher, not per account (an active manager was hiding silent publishers), and the day-60 pulse routes detractors to an AM.'
  };
  const PRE = ['Aster', 'Bramble', 'Copper', 'Delta', 'Ember', 'Fjordline', 'Granite', 'Harborview', 'Iris', 'Juniper', 'Kestrel', 'Linden', 'Maplewood', 'Nimbus', 'Orchid', 'Pioneer', 'Quarry', 'Riverstone', 'Solstice', 'Tundra', 'Umber', 'Vantage', 'Willowby', 'Yarrow', 'Zephyr', 'Alderbrook', 'Beaconry', 'Cobalt', 'Driftwood', 'Everly'];
  const SUF = ['Analytics', 'Health', 'Labs', 'Capital', 'Logistics', 'Software', 'Robotics', 'Energy', 'Legal', 'Security', 'Bio', 'Studio', 'Systems', 'Advisory'];
  const OWNERS = ['Naomi Park', 'Devin Walsh', 'Jordan Ellis'];

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
        // Planned day each step lands (null = never). Later versions move faster and drop fewer.
        const plan = { kickoff: 0 };
        plan.seats = rnd() < 0.97 ? (i ? rint(0, 2) : rint(1, 6)) : null;
        plan.linkedin = plan.seats != null && rnd() < [0.84, 0.91, 0.94][i] ? plan.seats + rint(1, i ? 3 : 6) : null;
        plan.draft = plan.linkedin != null && rnd() < 0.95 ? plan.linkedin + rint(1, 3) : null;
        plan.post = plan.draft != null && rnd() < [0.74, 0.85, 0.89][i] ? plan.draft + (i === 0 ? rint(8, 30) : i === 1 ? rint(4, 16) : rint(3, 12)) : null;
        plan.habit = plan.post != null && rnd() < [0.55, 0.68, 0.76][i] ? Math.min(58, plan.post + rint(14, 30)) : null;
        plan.pulse = rnd() < 0.62 ? 60 + rint(0, 5) : null;
        const pConv = plan.habit != null ? [0.78, 0.82, 0.86][i] : plan.post != null ? 0.33 : 0.06;
        plan.convert = rnd() < pConv ? 90 : null;
        const score = plan.pulse != null ? (plan.habit != null ? rint(7, 10) : rint(3, 8)) : null;
        const hit = {};
        STEPS.forEach(st => { hit[st.k] = plan[st.k] != null && plan[st.k] <= age ? plan[st.k] : null; });
        accts.push({ name, v, kickoff, age, plan, hit, score });
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
        if (a.age >= 60) addT(a, 60, 'inapp');
        if (a.score != null && a.score <= 6 && a.v === 'v3') { a.escalated.push(STEPS[6]); addT(a, 62, 'human'); }
      }
      if (a.done) a.status = a.hit.convert != null ? 'Converted' : 'Exited';
      else if (a.cur && a.age > a.cur.target && a.v !== 'v1' && a.escalated.includes(a.cur)) a.status = 'With a human';
      else if (a.cur && a.age > a.cur.target) a.status = 'Late';
      else a.status = 'On track';
      a.touches = touches.filter(t => t.a === a).length;
    });
    return { accts, touches };
  }

  const CHIP = { 'On track': 'badge-teal', 'Late': 'badge-amber', 'With a human': 'badge-coral', 'Converted': 'badge-teal', 'Exited': 'badge-gray' };
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
    const humanLive = live.filter(a => a.status === 'With a human');
    const monthKick = A.filter(a => a.kickoff.getMonth() === TODAY.getMonth() && a.kickoff.getFullYear() === TODAY.getFullYear()).length;

    const stepCounts = STEPS.map(st => live.filter(a => a.cur === st).length);
    const reach = STEPS.map(st => { const e = A.filter(a => a.age >= st.target + 14); return pct(e.filter(a => a.hit[st.k] != null).length, e.length); });

    const rows = (view === 'human' ? humanLive : live).slice().sort((x, y) => ['With a human', 'Late', 'On track'].indexOf(x.status) - ['With a human', 'Late', 'On track'].indexOf(y.status) || y.age - x.age);
    const dots = a => STEPS.map(st => {
      const h = a.hit[st.k], cur = a.cur === st;
      const col = h != null ? '#1D9E75' : cur ? (a.status === 'On track' ? '#378ADD' : a.status === 'Late' ? '#BA7517' : '#D85A30') : 'var(--surface2)';
      const t = st.label + ': ' + (h != null ? 'day ' + h : cur ? 'current step (target day ' + st.target + ')' : 'not yet');
      return `<span class="ej-dot" title="${esc(t)}" style="background:${col}"></span>`;
    }).join('');
    const nextTouch = a => a.status === 'With a human' ? esc(a.cur.human) : a.cur ? esc(a.cur.auto) : '—';

    root.innerHTML = `
    <div class="ej-banner">Prototype &middot; a tech-touch journey for EGC accounts. Every step below fires automatically from product and CRM events; a person is pulled in only when a step stalls. All accounts and numbers are simulated.</div>
    <div class="prt-toolbar" style="margin-top:4px"><div class="prt-seg" id="ej-filter">
      <button class="prt-seg-btn${view === 'all' ? ' active' : ''}" data-view="all">All in flight</button>
      <button class="prt-seg-btn${view === 'human' ? ' active' : ''}" data-view="human">With a human</button></div>
      <div class="prt-toolbar-spacer"></div><span class="rt-note" style="margin-top:0">${A.length} accounts kicked off in 6 months &middot; ${D.touches.length.toLocaleString()} journey events</span></div>

    <div class="section-header"><span class="section-title">EGC journey</span><span class="section-note">Pilot kickoff to conversion in 8 milestones &middot; 90-day pilot</span></div>
    <div class="metric-grid-6" style="margin-bottom:20px">
      ${card('In the journey', live.length, 'ink', monthKick + ' kicked off this month')}
      ${card('Days to first post', ttv('v3') ?? '—', 'teal', 'median, v3 cohorts &middot; v1 was ' + ttv('v1'), 'Median days from kickoff to the first published post, for accounts that have posted. Target: 14.')}
      ${card('Posting habit', habitRate('v2') + '%', 'blue', 'v2 cohorts at day 60 &middot; v1 ' + habitRate('v1') + '%', '4+ posts in 30 days per publisher, among accounts at least 60 days in. v3 cohorts are not 60 days in yet.')}
      ${card('Pilot → paid', (convRate('v2') ?? '—') + '%', 'teal', 'v2 cohorts &middot; v1 ' + convRate('v1') + '%', 'Share of completed 90-day pilots that converted. v3 cohorts have not reached day 90 yet.')}
      ${card('Automated touches', auto30.toLocaleString(), 'ink', 'last 30 days &middot; email + in-app')}
      ${card('Human hand-offs', hum30, 'coral', 'last 30 days &middot; ' + humanLive.length + ' accounts waiting now', 'A step passed its escalation day without its milestone, so the system handed the account to a person.')}
    </div>

    <div class="section-header"><span class="section-title">The journey</span><span class="section-note">Trigger &rarr; automated touch &rarr; when a human steps in &middot; count = accounts at that step now</span></div>
    <div class="ej-map">${STEPS.map((st, n) => `
      <div class="ej-step"><div class="ej-step-top"><span class="ej-num">${n + 1}</span><span class="ej-day">day ${st.target}</span></div>
        <div class="ej-label">${st.label}</div>
        <div class="ej-count"><b>${stepCounts[n]}</b> here now &middot; ${reach[n]}% reach it</div>
        <div class="ej-row"><i>When</i>${esc(st.trigger)}</div>
        <div class="ej-row"><i>Auto</i>${esc(st.auto)}</div>
        <div class="ej-row ej-h"><i>Human</i>${esc(st.human || '—')}</div></div>`).join('')}</div>

    <div class="chart-row" style="margin-top:12px">
      <div class="chart-card"><div class="chart-card-title">Share of accounts reaching each milestone, by journey version</div><div class="chart-card-sub">Accounts at least 14 days past the milestone's target day</div><div class="chart-wrap-lg"><canvas id="ejFunnel"></canvas></div></div>
      <div class="chart-card"><div class="chart-card-title">Median days to first post, by kickoff month</div><div class="chart-card-sub">Colour = journey version live when the cohort started &middot; dashed line is the 14-day target</div><div class="chart-wrap-lg"><canvas id="ejTtv"></canvas></div></div>
    </div>
    <div class="chart-card"><div class="chart-card-title">Journey events per week</div><div class="chart-card-sub">Automated emails and in-app prompts vs. hand-offs to a person &middot; last 12 weeks</div><div class="chart-wrap-md"><canvas id="ejWeek"></canvas></div></div>

    <div class="ej-versions">${['v1', 'v2', 'v3'].map(v => `<div class="ej-v" style="border-left-color:${VCOL[v]}"><b>${v}</b> <span class="rt-note" style="margin:0">${byV(v).length} accounts</span><div>${VNOTE[v]}</div></div>`).join('')}</div>

    <div class="section-header" style="margin-top:20px"><span class="section-title">${view === 'human' ? 'Accounts with a human' : 'Accounts in flight'}</span><span class="section-note">Dots are the 8 milestones &middot; green done, blue current, amber late, coral handed to a person</span></div>
    <div class="table-card"><div class="table-wrap"><table>
      <thead><tr><th>Account</th><th>Kickoff</th><th>Day</th><th>Milestones</th><th>Current step</th><th>Status</th><th>Touches</th><th>Next action</th><th>Owner</th></tr></thead>
      <tbody>${rows.map((a, n) => `<tr><td>${esc(a.name)}</td><td class="rt-val">${fmtD(a.kickoff)}</td><td class="rt-val">${a.age}</td><td style="white-space:nowrap">${dots(a)}</td><td>${a.cur ? esc(a.cur.label) : '—'}</td><td><span class="badge ${CHIP[a.status]}">${a.status}</span></td><td class="rt-val">${a.touches}</td><td style="font-size:11px;color:var(--ink2)">${nextTouch(a)}</td><td>${a.status === 'With a human' ? OWNERS[n % OWNERS.length] : '<span class="rt-pending">Automated</span>'}</td></tr>`).join('') || '<tr><td colspan="9" class="rt-empty">Nobody is waiting on a person.</td></tr>'}</tbody>
    </table></div></div>
    <div class="rt-note">v1 accounts have finished their pilots, so every account in flight is on v2 or v3.</div>`;

    root.querySelectorAll('#ej-filter .prt-seg-btn').forEach(b => b.onclick = () => { view = b.dataset.view; render(); });
    drawCharts(reach);
  }

  function drawCharts() {
    if (typeof Chart === 'undefined') return;
    Object.keys(charts).forEach(k => { charts[k].destroy(); delete charts[k]; });
    const A = D.accts, grid = { color: 'rgba(26,25,22,0.06)' }, tk = { font: { size: 10 } };
    charts.f = new Chart(document.getElementById('ejFunnel'), {
      type: 'bar',
      data: { labels: STEPS.map(s => s.label), datasets: ['v1', 'v2', 'v3'].map(v => ({ label: v, backgroundColor: VCOL[v], borderRadius: 3, maxBarThickness: 14,
        data: STEPS.map(st => { const e = A.filter(a => a.v === v && a.age >= st.target + 14); return e.length >= 5 ? pct(e.filter(a => a.hit[st.k] != null).length, e.length) : null; }) })) },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10 } }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + c.raw + '%' } } },
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
    const wk = [...Array(12)].map((_, n) => new Date(+TODAY - (11 - n) * 7 * DAY));
    const bucket = ch => wk.map(w => D.touches.filter(t => t.ch === ch && t.d > new Date(+w - 7 * DAY) && t.d <= w).length);
    charts.w = new Chart(document.getElementById('ejWeek'), {
      type: 'bar',
      data: { labels: wk.map(fmtD), datasets: [['email', 'Email', '#378ADD'], ['inapp', 'In-app', '#1D9E75'], ['human', 'Hand-off to a person', '#D85A30']].map(([k, l, c]) => ({ label: l, data: bucket(k), backgroundColor: c, borderRadius: 3, maxBarThickness: 28 })) },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10 } } }, scales: { x: { stacked: true, ticks: tk, grid: { display: false } }, y: { stacked: true, ticks: tk, grid } } }
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
.ej-versions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ej-v{background:var(--surface);border:1px solid var(--border);border-left:4px solid;border-radius:var(--radius-sm);padding:10px 12px;font-size:11px;color:var(--ink2)}
.ej-v b{font-family:'Syne',sans-serif;color:var(--ink)}
@media (max-width:760px){.ej-versions{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  window.egcjEnsure = function () { if (!D) D = build(); render(); };
})();
