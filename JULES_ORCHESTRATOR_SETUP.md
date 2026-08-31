# Jules Queue Orchestrator — Setup

Automatically starts the next task from `ROADMAP.md`'s "## Now" list once you've merged the
previous one's PR. Runs as a GitHub Actions "heartbeat" every 15 minutes — no server needed.
This is the same pattern already running on `artificer`.

## Files
- `.github/workflows/jules-orchestrator.yml` — the scheduled workflow
- `.github/workflows/ci.yml` — build/lint/test gate on every push and PR (new for this repo)
- `scripts/jules-orchestrator.mjs` — the orchestrator logic (generic — reads ROADMAP.md,
  doesn't hardcode the repo name)
- `.github/jules-queue-state.json` — tracks which session is currently active (committed by
  the bot itself; starts as `{ "activeSession": null }`)
- `AGENT.MD` / `AGENT_RULES.md` — what Jules reads before starting any task
- `ROADMAP.md` — the dispatch queue itself (`### Ready` is what gets picked up next)

## One-time manual setup (I can't do these steps for you)

1. **Install the Jules GitHub app** on the `three_dragon_ante` repo, if it isn't already
   installed for your account — via jules.google.com, Settings → connect your GitHub
   account/repo.

2. **Create a Jules API key** — jules.google.com/settings#api → "Create new key" (you can
   reuse the same key you're already using for `artificer`, or make a fresh one — up to 3 at
   a time).

3. **Add it as a repo secret on `three_dragon_ante`** — repo → Settings → Secrets and
   variables → Actions → "New repository secret" → name it `JULES_API_KEY`, paste the key.
   Never paste this key into a chat — only into GitHub's secret field.

4. **Confirm the Jules source name.** Run this once (replace the key):
   ```sh
   curl 'https://jules.googleapis.com/v1alpha/sources' -H 'X-Goog-Api-Key: YOUR_KEY'
   ```
   Look for `sources/github/japiohopman/three_dragon_ante` — that's already what's set in
   `jules-orchestrator.yml`'s `JULES_SOURCE` env var. If yours differs, update that one line.

5. **Commit these files** at the repo root / paths shown above:
   - `ROADMAP.md`, `AGENT.MD`, `AGENT_RULES.md`
   - `.github/workflows/ci.yml`
   - `.github/workflows/jules-orchestrator.yml`
   - `.github/jules-queue-state.json`
   - `scripts/jules-orchestrator.mjs`
   - the `.gitignore` additions (`verification/`, `test-results/`) — see note below

6. **First run**: trigger it manually once — Actions tab → "Jules Queue Orchestrator" →
   "Run workflow". Check the log: it should dispatch the first `### Ready` task
   ("Repo hygiene — stop committing build/verification artifacts") or tell you the queue is
   empty.

## Note on `.gitignore`
`ROADMAP.md`'s first Ready task is to gitignore `verification/` and `test-results/` and untrack
what's already committed (8.2MB of screenshots) — that's deliberately the *first* task Jules
will pick up, not something this setup does for you, so it goes through the same PR/review
flow as everything else.

## How the review gate works
The orchestrator only advances once a session's PR is **merged** — that's your checkpoint. It
never touches ROADMAP.md's checkboxes; checking a task off (or confirming it's done) is still
something you do deliberately, once you've verified it actually works — matching
AGENT_RULES.md §1. The loop naturally **stops itself** once `### Ready` is empty — that's your
milestone boundary: when a batch of tasks is done, add the next batch to `### Ready` yourself
before triggering (or re-enabling) the next run.

## Adjusting the cadence
`cron: '*/15 * * * *'` = every 15 minutes. GitHub Actions cron has a practical minimum around
5 minutes and can lag under load — 15 is a reasonable default that won't spam the API.
