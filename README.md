# Anonymized CS dashboard

A public, fully anonymized copy of the internal customer success dashboard,
deployed at [anonymizeddash.netlify.app](https://anonymizeddash.netlify.app).

Every company, person, and number in it is invented. It runs entirely in the
browser: the Supabase client is replaced by an in-memory mock, and every
`/api/*` call is intercepted and answered with sample data, so no CRM, Slack,
billing system, or database is ever contacted.

## Refreshing it after the internal dashboard changes

The demo is **generated, not hand-edited**. Editing `index.html` directly works
until the next rebuild overwrites it.

```sh
git clone https://github.com/melissainsf/For-Dashboard   # the private source
cd anonymizeddashboard
npm install
npm run build        # writes index.html from ../For-Dashboard
npm test             # opens every tab in a real browser and checks it
```

`npm run build` assumes the internal repo sits next to this one. Point it
somewhere else with `node build/build-demo.js --src /path/to/For-Dashboard`.

Then commit `index.html` and push — Netlify deploys from `main`.

## What the build does

| Step | Why |
| --- | --- |
| Swaps the AM roster constants | Keeps the real value/label split (a CRM option whose stored value differs from its label) so that display path still gets exercised, with invented names |
| Renames people, accounts, contacts, brand | From `demo-renames.json` **in the private repo** — see below |
| Drops the Supabase client, URL and key | The demo must not reach a real backend |
| Injects `build/demo-layer.js` | Fixtures plus a mock database and `fetch` interceptor |
| Inlines `bonus-calculator.js` | Keeps the demo a single self-contained page |
| Bypasses the sign-in gate | There is no account to sign in with |
| **Runs a leak check** | See below |

## Why the rename table is not in this repo

The real-to-fictional name map lives in the private repo, as
`demo-renames.json`, and the build reads it from `--src`. It is not stored here
and must not be copied here.

A list of real customer names would be bad enough. A *mapping* is worse: it
turns every fictional name in the published demo back into the real one. And
because Netlify serves this repo's files, a copy would not merely sit in git —
it would be downloadable at `/build/build-demo.js` on the live site.

If the build cannot find the file it stops and says so, rather than emitting a
half-renamed page.

## The leak check

The build **fails** rather than publishing a real name.

Its blocklist is derived from the private repo at build time — the real account
roster, the billing snapshot, and the rename table — and is never written to
disk here. A checked-in list of real customer names would itself be the leak,
in a public repo.

So when the internal dashboard grows a new real name that the rename table does
not know about, the build stops and names it:

```
BUILD FAILED: real names survived into the demo output:
  Northwind Labs
```

The fix is to add the name to `PEOPLE`, `ACCOUNTS` or `CONTACTS` in
`build/build-demo.js` and rebuild. Do not work around the check.

## The smoke test

`npm test` drives the built page in Chromium: it opens all ten tabs, asserts
each renders content, asks Chart.js how many charts actually received data, and
fails if the page tries to reach `supabase.co`, `hubapi.com`, `slack.com`, or
any `/api/*` route. That last check is what proves the demo is self-contained.

It serves Chart.js from `node_modules` because a sandbox may not reach the CDN;
without that the charts silently no-op and the test would pass having drawn
nothing.

## Fixtures

`build/demo-layer.js` holds the sample data. The shapes are taken from the real
contracts — Supabase column types, RPC return signatures, and the JSON each
Netlify function returns — so a tab that renders here renders against the same
shape it gets in production.

The data is seeded from a fixed PRNG, so the demo looks the same on every
reload, and it is deliberately arranged to exercise the paths the dashboard was
built to surface, rather than being uniformly healthy: one account is on the
EGC product but was never provisioned, two seats have a mature seat and have
never published, one labelled contact has no email address, three accounts
match no Slack channel, one account changed hands mid-window, and one customer
churned inside the trailing-90-day window.

## Note

`anonymized dashboard.html` is the previous (June) build, kept only as history.
Nothing deploys it — Netlify serves `index.html`. Its `<title>` still carries
the real company name.
