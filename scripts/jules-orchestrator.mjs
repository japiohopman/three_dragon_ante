#!/usr/bin/env node
/**
 * Jules Queue Orchestrator (v3)
 *
 * v2 tried to physically move task lines between "### Active" and "### Ready" in
 * ROADMAP.md. That broke as soon as a task had multi-line content (Problem/Goal/
 * Acceptance sub-bullets) under its checkbox — the script only moved the checkbox
 * line itself, orphaning the description underneath it.
 *
 * v3 fixes this by never editing ROADMAP.md itself. Jules does that, as the last
 * step of its own task, once it has actually verified the work (AGENT_RULES.md §1) —
 * it flips its own task's "- [ ]" to "- [x]" IN PLACE, no moving required. This
 * script only ever *reads* ROADMAP.md, to decide what to dispatch and whether a task
 * is confirmed done.
 *
 * Ties Jules sessions to ROADMAP.md's "### Ready" list under "## Now":
 *
 *   ## Now
 *   ### Ready
 *   - [ ] <task available to dispatch>
 *   - [x] <task confirmed done by Jules, left in place>
 *   ### Blocked
 *   - [ ] <task waiting on a human decision — never dispatched>
 *   ### Human Review
 *   - [ ] <task that needs discussion before it's safe to hand to Jules — never dispatched>
 *
 * Flow each run:
 * 1. Load state (.github/jules-queue-state.json) — this is the ONLY place "what's
 *    currently active" is tracked; ROADMAP.md never needs an "### Active" section.
 * 2. Reconcile state against the canonical ROADMAP queue. If the stored active task
 *    is no longer the first unchecked task under "### Ready", treat that state as
 *    stale and clear it. This prevents a bad/stale state file from permanently
 *    blocking the queue or causing tasks to be dispatched out of order.
 * 3. If a session is already active:
 *      - No PR yet -> stop, nothing to do.
 *      - PR open but not merged -> stop. Human gate: PR review/merge.
 *      - PR merged BUT the task's checkbox in ROADMAP.md is still "- [ ]"
 *        -> stop and log a warning — Jules said it opened a PR but didn't check its
 *        own box, which shouldn't happen per AGENT_RULES.md §1. Needs a look.
 *      - PR merged AND the checkbox is now "- [x]" -> confirmed done. Clear the
 *        active session, fall through to dispatch next.
 * 4. If there's no active session:
 *      - Take the first "- [ ] ..." line under "### Ready" (top-level checkbox only,
 *        sub-bullets like "  - **Problem:** ..." don't match and are left alone).
 *      - None -> log "queue empty" and stop.
 *      - Otherwise: start a new Jules session for it, record it in state. Do NOT
 *        touch ROADMAP.md — Jules will check its own box when done.
 * 5. Commit only the state file, if it changed.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const JULES_API_KEY = process.env.JULES_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const JULES_SOURCE = process.env.JULES_SOURCE;

const STATE_PATH = '.github/jules-queue-state.json';
const ROADMAP_PATH = 'ROADMAP.md';

for (const [name, val] of Object.entries({ JULES_API_KEY, GITHUB_TOKEN, REPO, JULES_SOURCE })) {
  if (!val) throw new Error(`${name} is not set`);
}

function loadState() {
  if (!existsSync(STATE_PATH)) return { activeSession: null };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}
function saveState(state) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

async function julesFetch(path, options = {}) {
  const res = await fetch(`https://jules.googleapis.com/v1alpha/${path}`, {
    ...options,
    headers: {
      'X-Goog-Api-Key': JULES_API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Jules API ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
async function githubFetch(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
function extractPrNumber(prUrl) {
  const match = prUrl.match(/\/pull\/(\d+)/);
  return match ? Number(match[1]) : null;
}

/** Finds top-level "- [ ]" / "- [x]" checkbox lines under a given "###" heading inside "## Now". */
function findTasksUnderHeading(text, headingName) {
  const lines = text.split('\n');
  let inNow = false;
  let inHeading = false;
  const tasks = [];
  for (const line of lines) {
    if (/^##\s+Now\b/i.test(line)) { inNow = true; continue; }
    if (inNow && /^##\s+[^#]/.test(line)) break; // left "## Now" entirely
    if (!inNow) continue;
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) { inHeading = h3[1].toLowerCase() === headingName.toLowerCase(); continue; }
    if (!inHeading) continue;
    // Only unindented checkbox lines count as tasks — indented "  - **Problem:**" etc. don't match.
    const task = line.match(/^- \[( |x)\]\s*(.+)$/i);
    if (task) tasks.push({ checked: task[1].toLowerCase() === 'x', text: task[2].trim() });
  }
  return tasks;
}

/** True if this exact task text appears checked off anywhere under "### Ready". */
function isTaskConfirmedDone(roadmapText, taskText) {
  const tasks = findTasksUnderHeading(roadmapText, 'Ready');
  const match = tasks.find(t => t.text === taskText);
  return match ? match.checked : false;
}

async function main() {
  const state = loadState();
  const roadmapText = readFileSync(ROADMAP_PATH, 'utf8');
  const readyTasks = findTasksUnderHeading(roadmapText, 'Ready');
  let next = readyTasks.find(t => !t.checked);
  let stateChanged = false;

  // ROADMAP.md is the canonical queue. A stale state entry must never be allowed
  // to skip an earlier Ready task or block the queue indefinitely. This specifically
  // repairs the failure mode where state pointed at UX while Follow-up was still first.
  if (state.activeSession) {
    const activeTask = readyTasks.find(t => t.text === state.activeSession.task);
    const activeIsCanonicalNext = activeTask && !activeTask.checked && (!next || activeTask.text === next.text);

    if (!activeIsCanonicalNext) {
      console.warn(
        `Stale Jules queue state detected: active task "${state.activeSession.task}" ` +
        `does not match the first unchecked task under ### Ready ("${next?.text ?? 'none'}"). ` +
        'Clearing the stale session state so the canonical queue can advance.'
      );
      state.activeSession = null;
      stateChanged = true;
    }
  }

  if (state.activeSession) {
    console.log(`Checking active session ${state.activeSession.name} ...`);
    const session = await julesFetch(state.activeSession.name);
    const prOutput = (session.outputs || []).find(o => o.pullRequest)?.pullRequest;

    if (!prOutput) {
      console.log('No PR yet. Nothing to do this run.');
      if (stateChanged) { saveState(state); commitAndPush(); }
      return;
    }
    const prNumber = extractPrNumber(prOutput.url);
    if (!prNumber) { console.log(`Could not parse PR number from ${prOutput.url}.`); return; }

    const pr = await githubFetch(`pulls/${prNumber}`);
    if (!pr.merged) {
      console.log(`PR #${prNumber} is open but not merged yet — waiting for review.`);
      return;
    }

    if (!isTaskConfirmedDone(roadmapText, state.activeSession.task)) {
      console.log(
        `PR #${prNumber} is merged, but "${state.activeSession.task}" is still "- [ ]" in ` +
        `ROADMAP.md. Jules should have checked its own box per AGENT_RULES.md §1 — this needs ` +
        `a manual look before the queue advances further.`
      );
      return;
    }

    console.log(`"${state.activeSession.task}" is merged AND confirmed done. Advancing the queue.`);
    state.activeSession = null;
    stateChanged = true;
    next = readyTasks.find(t => !t.checked);
  }

  if (!state.activeSession) {
    if (!next) {
      console.log('Nothing left unchecked under ### Ready (queue empty).');
      if (stateChanged) { saveState(state); commitAndPush(); }
      return;
    }

    console.log(`Dispatching next task: ${next.text}`);

    const prompt = [
      'Read AGENT.MD, AGENT_RULES.md, and ROADMAP.md before starting.',
      'Your task from ROADMAP.md\'s "### Ready" list:',
      next.text,
      "Follow AGENT_RULES.md strictly — especially: don't claim something works without " +
      "running it, and stay inside the relevant module.",
      'When you are done AND you have personally verified it works (per AGENT_RULES.md §1), ' +
      'edit ROADMAP.md yourself and change this task\'s own checkbox line from ' +
      `"- [ ] ${next.text}" to "- [x] ${next.text}" — in place, don't move or delete the ` +
      'Problem/Goal/Acceptance bullets underneath it. Include that edit in the same PR. ' +
      "If you could not fully verify it, leave the checkbox unchecked and say why in the PR " +
      'description instead.',
    ].join('\n\n');

    const session = await julesFetch('sessions', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        sourceContext: { source: JULES_SOURCE, githubRepoContext: { startingBranch: 'main' } },
        automationMode: 'AUTO_CREATE_PR',
        title: next.text.slice(0, 80),
      }),
    });

    state.activeSession = { name: session.name, task: next.text, startedAt: new Date().toISOString() };
    stateChanged = true;
  }

  if (stateChanged) {
    saveState(state);
    commitAndPush();
  }
}

function commitAndPush() {
  execSync('git config user.name "jules-orchestrator[bot]"');
  execSync('git config user.email "jules-orchestrator@users.noreply.github.com"');
  execSync(`git add ${STATE_PATH}`);
  try {
    execSync('git commit -m "chore: advance Jules queue"');
    execSync('git push');
  } catch (e) {
    console.log('Nothing to commit, or push raced with another run:', e.message);
  }
}

main().catch(err => { console.error(err); process.exit(1); });