#!/usr/bin/env node
/**
 * Jules orchestrator preflight.
 *
 * Protects the queue from stale local state and duplicate Jules sessions:
 *   1. Reconcile the session recorded in jules-queue-state.json with Jules.
 *   2. If that session is still active, do not dispatch another task.
 *   3. If its PR is merged/closed or the session is terminal, clear local state.
 *   4. If state is empty, detect any other active session for this repository and wait.
 *
 * Emits `dispatch=true|false` through GITHUB_OUTPUT when available.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const JULES_API_KEY = process.env.JULES_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const JULES_SOURCE = process.env.JULES_SOURCE;
const STATE_PATH = '.github/jules-queue-state.json';

for (const [name, value] of Object.entries({ JULES_API_KEY, GITHUB_TOKEN, REPO, JULES_SOURCE })) {
  if (!value) throw new Error(`${name} is not set`);
}

const ACTIVE_STATES = new Set([
  'QUEUED',
  'PLANNING',
  'AWAITING_PLAN_APPROVAL',
  'AWAITING_USER_FEEDBACK',
  'IN_PROGRESS',
]);

async function julesFetch(path) {
  const response = await fetch(`https://jules.googleapis.com/v1alpha/${path}`, {
    headers: {
      'X-Goog-Api-Key': JULES_API_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Jules API ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function githubFetch(path) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function setDispatch(value) {
  const output = process.env.GITHUB_OUTPUT;
  if (output) writeFileSync(output, `dispatch=${value ? 'true' : 'false'}\n`, { flag: 'a' });
}

function loadState() {
  if (!existsSync(STATE_PATH)) return { activeSession: null };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

function clearState() {
  writeFileSync(STATE_PATH, JSON.stringify({ activeSession: null }, null, 2) + '\n');
  execSync(`git add ${STATE_PATH}`);
  try {
    execSync('git config user.name "jules-orchestrator[bot]"');
    execSync('git config user.email "jules-orchestrator@users.noreply.github.com"');
    execSync('git commit -m "chore: reconcile Jules queue state"');
    execSync('git push');
  } catch (error) {
    console.log(`State already clean or push raced: ${error.message}`);
  }
}

function isSameRepository(session) {
  return session?.sourceContext?.source === JULES_SOURCE
    || session?.source?.name === JULES_SOURCE
    || session?.source === JULES_SOURCE;
}

async function main() {
  const state = loadState();

  if (state.activeSession?.name) {
    console.log(`Reconciling recorded Jules session ${state.activeSession.name} ...`);
    const session = await julesFetch(state.activeSession.name);
    const stateName = String(session.state || '').toUpperCase();

    if (ACTIVE_STATES.has(stateName)) {
      console.log(`Recorded Jules session is still ${stateName}. Waiting; no new task will be dispatched.`);
      setDispatch(false);
      return;
    }

    const prOutput = (session.outputs || []).find(output => output.pullRequest)?.pullRequest;
    if (prOutput?.url) {
      const match = prOutput.url.match(/\/pull\/(\d+)/);
      if (match) {
        const pr = await githubFetch(`pulls/${Number(match[1])}`);
        if (!pr.merged && pr.state === 'open') {
          console.log(`Recorded Jules session has open PR #${pr.number}. Waiting for review.`);
          setDispatch(false);
          return;
        }
      }
    }

    console.log(`Recorded Jules session is terminal (${stateName || 'unknown'}). Clearing queue state.`);
    clearState();
  }

  const sessionsResponse = await julesFetch('sessions?pageSize=30');
  const sessions = sessionsResponse.sessions || [];
  const activeRepositorySessions = sessions.filter(session =>
    isSameRepository(session) && ACTIVE_STATES.has(String(session.state || '').toUpperCase()),
  );

  if (activeRepositorySessions.length > 0) {
    console.log(
      `Found ${activeRepositorySessions.length} active Jules session(s) for ${JULES_SOURCE}. ` +
      'Waiting instead of creating a duplicate task.',
    );
    for (const session of activeRepositorySessions) {
      console.log(`Active session: ${session.name} — ${session.title || 'untitled'}`);
    }
    setDispatch(false);
    return;
  }

  console.log('No active Jules session is recorded or detected for this repository. Dispatch is safe.');
  setDispatch(true);
}

main().catch(error => {
  console.error(error);
  setDispatch(false);
  process.exit(1);
});
