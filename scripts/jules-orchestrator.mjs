#!/usr/bin/env node
/**
 * Jules Queue Orchestrator (v7)
 *
 * ROADMAP.md is the canonical dispatch queue.
 *
 * Dispatch order:
 *   1. Now / Ready — concrete implementation work.
 *   2. Continuous Improvement Triage — only when Ready is empty and
 *      IDEAS_BOX.md contains NEW ideas. This is a recurring planning session;
 *      its roadmap checkbox intentionally remains unchecked.
 *   3. Integration — only after the human-owned Integration Gate is READY.
 *   4. Later — non-TDA backlog after integration work is exhausted.
 *
 * This keeps the normal loop continuous without allowing the orchestrator to
 * blindly unlock parked work or embed the game before the experience quality
 * gate has been reviewed by a human.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const JULES_API_KEY = process.env.JULES_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const JULES_SOURCE = process.env.JULES_SOURCE;

const STATE_PATH = '.github/jules-queue-state.json';
const ROADMAP_PATH = 'ROADMAP.md';
const IDEAS_PATH = 'docs/IDEAS_BOX.md';

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

function extractIssueNumber(taskText) {
  const match = taskText.match(/\bIssue\s+#(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

/** Finds top-level checkbox lines under a named level-3 heading inside "## Now". */
function findTasksUnderHeading(text, headingName) {
  const lines = text.split('\n');
  let inNow = false;
  let inHeading = false;
  const tasks = [];

  for (const line of lines) {
    if (/^##\s+Now\b/i.test(line)) {
      inNow = true;
      inHeading = false;
      continue;
    }

    if (inNow && /^##\s+[^#]/.test(line)) break;
    if (!inNow) continue;

    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      const actualHeading = h3[1].trim().toLowerCase();
      const wantedHeading = headingName.trim().toLowerCase();
      inHeading = actualHeading === wantedHeading || actualHeading.startsWith(`${wantedHeading} `);
      continue;
    }

    if (!inHeading) continue;

    const task = line.match(/^- \[( |x)\]\s*(.+)$/i);
    if (task) {
      tasks.push({
        checked: task[1].toLowerCase() === 'x',
        text: task[2].trim(),
      });
    }
  }

  return tasks;
}

/** Finds top-level checkbox lines directly inside a named level-2 section. */
function findTasksInSection(text, sectionName) {
  const lines = text.split('\n');
  let inSection = false;
  const tasks = [];
  const wantedSection = sectionName.trim().toLowerCase();

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      const actualSection = h2[1].trim().toLowerCase();
      inSection = actualSection === wantedSection || actualSection.startsWith(`${wantedSection} `);
      continue;
    }

    if (!inSection) continue;

    const task = line.match(/^- \[( |x)\]\s*(.+)$/i);
    if (task) {
      tasks.push({
        checked: task[1].toLowerCase() === 'x',
        text: task[2].trim(),
      });
    }
  }

  return tasks;
}

function getIntegrationStatus(roadmapText) {
  const match = roadmapText.match(/^[-*]?\s*\*\*Integration status:\*\*\s*`?(BLOCKED|READY)`?\s*$/im);
  return match ? match[1].toUpperCase() : 'BLOCKED';
}

function countNewIdeas(ideasText) {
  return (ideasText.match(/^\s*-\s*\*\*Status:\*\*\s*NEW\s*$/gim) || []).length;
}

function findRecurringTriageTask(roadmapText) {
  const tasks = findTasksInSection(roadmapText, 'Continuous Improvement Triage');
  return tasks.find(task => /\bExperience Triage Cycle\b/i.test(task.text)) ?? null;
}

/**
 * Selects the next dispatch queue. Ready always wins when work exists. After
 * Ready is drained, NEW ideas trigger a recurring triage session. Integration
 * requires the explicit human-owned gate; Later is the final fallback.
 */
function getDispatchQueue(roadmapText, ideasText) {
  const readyTasks = findTasksUnderHeading(roadmapText, 'Ready');
  if (readyTasks.some(task => !task.checked)) {
    return { section: 'Ready', tasks: readyTasks, recurring: false };
  }

  const newIdeaCount = countNewIdeas(ideasText);
  const triageTask = findRecurringTriageTask(roadmapText);
  if (newIdeaCount > 0 && triageTask) {
    return { section: 'Triage', tasks: [triageTask], recurring: true, newIdeaCount };
  }

  const integrationStatus = getIntegrationStatus(roadmapText);
  if (integrationStatus === 'READY') {
    const integrationTasks = findTasksInSection(roadmapText, 'Integration');
    if (integrationTasks.some(task => !task.checked)) {
      return { section: 'Integration', tasks: integrationTasks, recurring: false };
    }
  }

  const laterTasks = findTasksInSection(roadmapText, 'Later');
  if (laterTasks.some(task => !task.checked)) {
    return { section: 'Later', tasks: laterTasks, recurring: false };
  }

  return { section: 'Idle', tasks: [], recurring: false, newIdeaCount };
}

function isTaskConfirmedDone(roadmapText, taskText, recurring = false) {
  if (recurring) return true;

  const allSections = [
    findTasksUnderHeading(roadmapText, 'Ready'),
    findTasksInSection(roadmapText, 'Integration'),
    findTasksInSection(roadmapText, 'Later'),
  ];
  const match = allSections.flat().find(task => task.text === taskText);
  return match ? match.checked : false;
}

async function getIssueContext(taskText) {
  const issueNumber = extractIssueNumber(taskText);
  if (!issueNumber) return null;

  const issue = await githubFetch(`issues/${issueNumber}`);
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body || '',
    url: issue.html_url,
  };
}

async function main() {
  const state = loadState();
  const roadmapText = readFileSync(ROADMAP_PATH, 'utf8');
  const ideasText = existsSync(IDEAS_PATH) ? readFileSync(IDEAS_PATH, 'utf8') : '';
  const queue = getDispatchQueue(roadmapText, ideasText);
  let next = queue.tasks.find(task => !task.checked) ?? (queue.recurring ? queue.tasks[0] : null);
  let stateChanged = false;

  console.log(`Dispatch queue section: ${queue.section}`);
  console.log(`Found ${queue.tasks.length} task(s) in the active queue.`);
  if (typeof queue.newIdeaCount === 'number') {
    console.log(`Ideas Box NEW ideas: ${queue.newIdeaCount}`);
  }
  console.log(`Integration gate: ${getIntegrationStatus(roadmapText)}`);

  if (state.activeSession) {
    const activeIsRecurring = Boolean(state.activeSession.recurring);
    const activeTask = queue.tasks.find(task => task.text === state.activeSession.task);
    const activeIsCanonicalNext = activeIsRecurring
      ? queue.recurring && activeTask
      : activeTask && !activeTask.checked && (!next || activeTask.text === next.text);

    if (!activeIsCanonicalNext) {
      console.warn(
        `Stale Jules queue state detected: active task "${state.activeSession.task}" ` +
        `does not match the first unchecked task in the active queue ("${next?.text ?? 'none'}"). ` +
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
    if (!prNumber) throw new Error(`Could not parse PR number from ${prOutput.url}`);

    const pr = await githubFetch(`pulls/${prNumber}`);
    if (!pr.merged) {
      console.log(`PR #${prNumber} is open but not merged yet — waiting for review.`);
      return;
    }

    const recurring = Boolean(state.activeSession.recurring);
    if (!isTaskConfirmedDone(roadmapText, state.activeSession.task, recurring)) {
      console.log(`PR #${prNumber} is merged, but "${state.activeSession.task}" is still unchecked in ROADMAP.md.`);
      return;
    }

    console.log(`"${state.activeSession.task}" is merged and confirmed. Advancing the queue.`);
    state.activeSession = null;
    stateChanged = true;

    // Do not dispatch immediately from the pre-merge roadmap snapshot. A
    // triage PR may have added new Ready tasks, so let the next heartbeat read
    // the merged commit as the new canonical queue.
    if (recurring) {
      saveState(state);
      commitAndPush();
      return;
    }

    const refreshedIdeasText = existsSync(IDEAS_PATH) ? readFileSync(IDEAS_PATH, 'utf8') : '';
    const refreshedQueue = getDispatchQueue(roadmapText, refreshedIdeasText);
    next = refreshedQueue.tasks.find(task => !task.checked) ?? (refreshedQueue.recurring ? refreshedQueue.tasks[0] : null);
  }

  if (!state.activeSession) {
    if (!next) {
      console.log('Nothing ready for dispatch. Waiting for new ideas, a roadmap task, or the human integration gate.');
      if (stateChanged) { saveState(state); commitAndPush(); }
      return;
    }

    console.log(`Dispatching next task from ${queue.section}: ${next.text}`);

    const issueContext = await getIssueContext(next.text);
    const promptParts = [
      'Read AGENT.MD, AGENT_RULES.md, ROADMAP.md, docs/IDEAS_BOX.md, and docs/GAMEPLAY_PLAYTEST.md before starting.',
      `Your task from ROADMAP.md's active "${queue.section}" queue:`,
      next.text,
    ];

    if (queue.recurring) {
      promptParts.push(
        'This is a RECURRING TRIAGE session. Do not implement product changes in this PR.',
        'Review NEW ideas in docs/IDEAS_BOX.md and the current game experience. Promote only evidence-backed, high-value ideas into 3–5 concrete unchecked tasks under ROADMAP.md → Now → Ready.',
        'For promoted ideas, update the original idea status from NEW to PROMOTED and preserve its observation/evidence.',
        'You may mark duplicates/rejections appropriately. Challenge assumptions instead of rubber-stamping ideas.',
        'Leave the "Experience Triage Cycle" checkbox unchecked. It is a recurring trigger, not a completion marker.',
        'Do not change Integration status; that gate is owned by the human project owner.',
      );
    }

    if (issueContext) {
      promptParts.push(
        `The roadmap task references GitHub Issue #${issueContext.number}. Treat that issue as the authoritative execution specification for this task.`,
        `Issue #${issueContext.number}: ${issueContext.title}\n${issueContext.url}\n\n${issueContext.body}`,
      );
    }

    promptParts.push(
      "Follow AGENT_RULES.md strictly — especially: don't claim something works without running it, and stay inside the relevant module.",
      'During implementation, when you discover a worthwhile non-blocking player-experience idea outside the task scope, you may add an evidence-based NEW entry to docs/IDEAS_BOX.md without implementing that idea.',
      ...(queue.recurring ? [] : [
        'When you are done AND you have personally verified it works (per AGENT_RULES.md §1), edit ROADMAP.md yourself and change this task\'s own checkbox line from ' +
        `"- [ ] ${next.text}" to "- [x] ${next.text}" — in place, don't move or delete the Problem/Goal/Acceptance bullets underneath it. Include that edit in the same PR. If you could not fully verify it, leave the checkbox unchecked and say why in the PR description instead.`,
      ]),
    );

    const session = await julesFetch('sessions', {
      method: 'POST',
      body: JSON.stringify({
        prompt: promptParts.join('\n\n'),
        sourceContext: { source: JULES_SOURCE, githubRepoContext: { startingBranch: 'main' } },
        automationMode: 'AUTO_CREATE_PR',
        title: next.text.slice(0, 80),
      }),
    });

    state.activeSession = {
      name: session.name,
      task: next.text,
      issueNumber: issueContext?.number ?? null,
      startedAt: new Date().toISOString(),
      recurring: queue.recurring,
    };
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
