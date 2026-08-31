# 🗺️ Roadmap — The Dragon's Flagon: Three-Dragon Ante

This is the single canonical dispatch roadmap for the Jules orchestrator: it says what's
actually in scope *now*. `todo.md` (Phases 1–6, all complete) was the original build-out;
this file is the polish pass — performance, UX, repo hygiene, and getting the TDA engine
ready to eventually live inside [artificer](https://github.com/japiohopman/artificer) as a
minigame.

## Now

### Active
- [x] **Repo hygiene — stop committing build/verification artifacts**

### Ready

  - **Problem:** `verification/` (8.2MB of PNGs) and `test-results/.last-run.json` are
    tracked in git. These are Playwright debug screenshots and run-state, not source.
  - **Goal:** add `verification/` and `test-results/` to `.gitignore`, `git rm --cached` the
    currently-tracked copies (keep them on disk locally, just untrack them), and confirm
    nothing in the app or CI depends on those paths being present in the repo.
  - **Acceptance:** `git status` is clean after regenerating a Playwright run; repo clone
    size drops; CI still passes.

- [ ] **CI pipeline — build/lint/test on every push and PR**
  - **Problem:** there is no `.github/workflows` CI at all yet — a broken build can land on
    `main` undetected.
  - **Goal:** add `.github/workflows/ci.yml` that runs `npm ci`, `npm run lint` (`tsc --noEmit`),
    `npm run test` (`vitest run src/`), and `npm run build` on push/PR to `main`.
  - **Acceptance:** workflow is green on a clean checkout; a deliberately broken type or a
    failing test actually fails the workflow (verify once, then revert the deliberate break).

- [ ] **Performance pass — split the largest monolithic files**
  - **Problem:** `src/store/useGameStore.ts` (~1550 lines), `src/components/minigames/tda/GameUI.tsx`
    (~825 lines) and `.../TableTop.tsx` (~775 lines) are large single files mixing multiple
    concerns, which makes unnecessary re-renders hard to spot and hard to review.
  - **Goal:** split each into smaller, cohesion-based modules (e.g. store slices for
    ante/board/economy/notification state; UI subcomponents by responsibility) without
    changing behavior. Check for obviously-avoidable re-renders while in there (e.g.
    components that re-render on unrelated store keys).
  - **Acceptance:** app behavior is unchanged (play a full gambit manually and confirm),
    `npm run test` and `npm run build` still pass, no single game-logic file exceeds ~400
    lines without a documented reason.

- [ ] **Performance pass — table VFX and sprite loading**
  - **Problem:** `TableTop.tsx` implements a DOM-based particle system for gold coins, and
    the card art relies on a single sprite atlas (`enhanced_tiamat.webp`) — worth confirming
    both are not causing jank on lower-end devices.
  - **Goal:** profile a full gambit (6-player game, several coin-spawn events) with the
    browser performance tab; if the particle system or sprite loading shows up as a hot
    path, apply a targeted fix (e.g. cap concurrent particles, ensure the atlas is
    preloaded/cached rather than re-fetched).
  - **Acceptance:** written before/after note in `docs/PERFORMANCE.md` (create if missing)
    with what was measured and what changed, even if the conclusion is "no change needed."

- [ ] **UX pass — onboarding and in-game clarity**
  - **Problem:** `todo.md` flags the hand-limit warning as "visual only, logic exists" —
    worth a fresh look at whether new-player affordances (rulebook discoverability, hand
    limit, whose turn it is, what a click will do) are clear without prior knowledge of the
    rules.
  - **Goal:** walk through a full game as a first-time player would, note friction points,
    fix the clearest 3–5 wins (e.g. rulebook entry point visibility, turn/leader indicator,
    hand-limit warning styling).
  - **Acceptance:** short before/after note of what changed and why, screenshots optional
    (don't commit new PNGs into the tracked tree — see the repo-hygiene task above).

- [ ] **Artificer-readiness — define the TDA engine's integration boundary**
  - **Goal:** without assuming artificer's exact integration API yet, identify and document
    what a clean "drop this minigame into another app" boundary would look like for the TDA
    engine (`src/components/minigames/tda/`, `utils/cardLogic.ts`, the relevant
    `useGameStore` slices): what's genuinely engine/logic vs. what's this repo's own
    shell (routing, audio manager, NPC system).
  - **Goal:** write `docs/ARTIFICER_INTEGRATION.md` describing that boundary and what would
    need to change to embed it elsewhere, without doing the extraction yet — this is a
    scoping task, not a refactor.
  - **Acceptance:** the doc exists, is concrete about which files/exports form the boundary,
    and flags any hard dependencies (Gemini API calls, this repo's own audio/NPC systems)
    that a host app would need to supply or stub.

### Blocked

### Human Review

- [ ] Actually embedding the TDA minigame inside `artificer` — needs a decision on
  artificer's own minigame-hosting pattern first (does one exist yet?). Do the
  Artificer-readiness scoping task above first, then decide together.

## Later — parked until Now is clear

- [ ] Mobile/touch input pass for the Solitaire and Memory minigames.
- [ ] NPC dialogue variety pass — more Gemini-driven reactions per Voice Archetype.
