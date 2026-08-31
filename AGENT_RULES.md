# 🛑 Agent Ground Rules

> Read this alongside [AGENT.MD](./AGENT.MD). ROADMAP.md is the current task list; this
> document is about *how* you're allowed to work through it.

## 1. Don't mark it `[x]` until you've watched it work
A checked box (or a task moved out of `### Active`) is a claim that you personally ran the app
and observed the behavior — not that you wrote code you believe should produce it.
- Run `npm run dev` (or `npm run test` / `npm run build` as relevant) and check the affected
  screen or behavior before checking a box.
- If you can't run it, leave it unchecked and say so explicitly in your PR description. An
  honest unchecked box is more useful than a false checked one.

## 2. Stay inside the task's module
Each ROADMAP.md task names the files/areas it touches. If finishing it genuinely requires
touching something outside that scope:
- Say so explicitly in your PR description ("this required editing `useGameStore.ts`, which
  is outside this task's stated scope, because X").
- Don't silently refactor unrelated code in passing.

## 3. Every change updates the docs it affects — accurately
If your change makes `docs/goal.md`, `README.md`, or a `docs/*.md` file wrong, update it in the
same PR. Aspirational documentation is worse than none, because it's trusted.

## 4. Repo hygiene — binaries and vendored code
- Never commit reference material (forked/vendored third-party repos, downloaded systems,
  example codebases) into the main tree.
- No new binary asset over 1MB goes into git without flagging it in your PR description first
  (images, audio, screenshots). `verification/` and `test-results/` are gitignored — don't
  re-add tracked files there.
- If you find existing bloat while working nearby, flag it in your PR description — don't
  silently leave it, and don't do a large unrelated cleanup mid-task either.

## 5. Verify before you build on top
Before extending a system (game state, card logic, NPC dialogue, etc.), re-read the relevant
file(s) directly — `docs/goal.md` describes intent, the code is the source of truth for
current behavior.

## 6. When you hit an error, leave a trail
If you hit a build/runtime error while working, fix it if it's in scope and note in your PR
description what broke, why, and what fixed it. If you can't fix it, say what you tried.

---
*These rules are enforced by review (you, reading the PR), not by tooling — CI (see
`.github/workflows/ci.yml`) only catches build/lint/test failures, not scope creep or
unverified checkboxes.*
