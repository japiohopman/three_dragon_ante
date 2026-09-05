# 🗺️ Roadmap — The Dragon's Flagon: Three-Dragon Ante

This is the single canonical dispatch roadmap for the Jules orchestrator: it says what's
actually in scope *now*. `todo.md` (Phases 1–6, all complete) was the original build-out;
this file is the polish and pre-integration pass — animation tuning, game flow, layout polish,
D&D money icons visual alignment, Artificer layout understanding, migration planning, and performance optimization before embedding the TDA engine into [artificer](https://github.com/japiohopman/artificer).

Jules checks its own boxes: once it has personally verified a task (per AGENT_RULES.md §1),
it flips that task's own `- [ ]` to `- [x]` in the same PR — the orchestrator script only
reads this file, it never edits it. Your review/merge of the PR is the real checkpoint.

## Now

### Completed Tasks

- [x] **CI pipeline — build/lint/test on every push and PR**
  - **Problem:** there was no `.github/workflows` CI at all — a broken build could land on `main` undetected.
  - **Goal:** add `.github/workflows/ci.yml` that runs `npm ci`, `npm run lint` (`tsc --noEmit`), `npm run test` (`vitest run src/`), and `npm run build` on push/PR to `main`.
  - **Acceptance:** workflow is green on a clean checkout; a deliberately broken type or a failing test fails CI.

- [x] **Repo hygiene — stop committing build/verification artifacts**
  - **Problem:** `verification/` (8.2MB of PNGs) and `test-results/.last-run.json` were tracked in git.
  - **Goal:** add `verification/` and `test-results/` to `.gitignore`, `git rm --cached` tracked copies.
  - **Acceptance:** `git status` clean after Playwright run; repo clone size drops; CI passes.

- [x] **Performance pass — split the largest monolithic files**
  - **Problem:** monolithic files (`useGameStore.ts`, `GameUI.tsx`, `TableTop.tsx`) mixed multiple concerns.
  - **Goal:** split into smaller cohesion-based modules and slices without changing behavior.
  - **Acceptance:** app behavior unchanged, `npm run test` and `npm run build` pass, no single file exceeds ~400 lines without documented reason.

- [x] **Performance pass — table VFX and sprite loading**
  - **Problem:** coin particle system and sprite atlas loading required performance verification.
  - **Goal:** profile full 6-player gambits and document findings in `docs/PERFORMANCE.md`.
  - **Acceptance:** written before/after performance note in `docs/PERFORMANCE.md`.

- [x] **Follow-up — finish the store split**
  - **Problem:** `turnSlice.ts` and `interactionSlice.ts` were still over 400 lines.
  - **Goal:** split slices further or document exceptions.
  - **Acceptance:** both files carry documented maintainability notes; tests pass cleanly.

- [x] **UX pass — onboarding and in-game clarity**
  - **Problem:** rulebook discoverability and hand-limit visual feedback needed polish.
  - **Goal:** walk through full game as a new player and improve key UX affordances.
  - **Acceptance:** before/after UX note in `docs/UX_PASS.md`.

- [x] **Artificer-readiness — define the TDA engine's integration boundary**
  - **Problem:** no clear boundary existed between the TDA engine and this repo's host shell.
  - **Goal:** document the TDA core engine vs host shell boundary in `docs/ARTIFICER_INTEGRATION.md`.
  - **Acceptance:** concrete documentation outlining engine manifests, host shell boundaries, dependencies, and proposed embedding API contract (`TDAMinigameProps`).

---

### Ready (Pre-Embedding Polish & Migration Prep)

- [x] **Issue #28 — fix: prevent repeated special-flight resolution on extended flights**
  - **Problem:** `finishTurn()` can re-evaluate an already-completed flight formation. If an extended/sudden-death flight still contains the qualifying three cards, the same special flight can potentially resolve again and duplicate its payout/effect.
  - **Goal:** make special-flight resolution occur only for the newly completed formation while preserving all legitimate strength/color flight behavior.
  - **Acceptance:** first-time strength and color flights still resolve correctly; an already-resolved formation cannot resolve again later in the same extended flight; focused regression tests cover both cases.
  - **Issue:** https://github.com/japiohopman/three_dragon_ante/issues/28
  - **Branch:** `fix/special-flight-resolution-20260904`

- [x] **Animation refinement — card motion & coin drop physics pass**
  - **Problem:** card play transitions (slam, flip, slide) and coin particle drops can feel abrupt during fast turn sequences.
  - **Goal:** audit and refine card animation timing curves in `Card.tsx` / `TableTop.tsx` and smooth coin drop physics trajectories in `useAnimationStore.ts`.
  - **Acceptance:** playing cards and winning gold feel smooth, tactile, and non-blocking during turn progression.

- [x] **Artificer SVG icon system — canonical main-game icon integration (Issue #34)**
  - **Problem:** the main game is not currently using the canonical Artificer Solo SVG icon system. `docs/IconSystemMainGame.md` defines the intended registry, standalone SVG asset structure, and centralized `GameIcon` component, but the SVG system is not actually used throughout production game UI.
  - **Goal:** integrate the Artificer-compatible Solo SVG icon system as the canonical icon source for TDA, using the existing Artificer `public/assets/icons/svg/` conventions and the icons already available under `minigame/` where applicable.
  - **Acceptance:** production game UI actually renders canonical SVG icons through the documented `GameIcon`/registry architecture; existing ad-hoc icon/emoji/inline-SVG usages are migrated where an equivalent canonical icon exists; asset paths and naming remain migration-safe for embedding into Artificer; tests, lint, and build pass; documentation matches the final implementation.
  - **Issue:** https://github.com/japiohopman/three_dragon_ante/issues/34
  - **Reference:** https://github.com/japiohopman/artificer/tree/main/public/assets/icons/svg
  - **Documentation:** `docs/IconSystemMainGame.md`

- [x] **Game flow polish — turn pacing, auto-pass & decision prompts**
  - **Problem:** turn transitions between multi-AI opponents can feel either too fast to read or sluggish during complex card power triggers.
  - **Goal:** adjust AI turn delay pacing, provide clear banner cues during decision/interruption phases (e.g. Green Dragon card options), and ensure smooth gambit end state transitions.
  - **Acceptance:** player can comfortably follow turn order across 6 players without getting stuck or missing card power resolutions.

- [x] **Layout polish & bug fixes — 6-player responsive table & z-index layers**
  - **Problem:** on smaller viewports or non-standard aspect ratios, 6-player seat chips and opponent drawers can obscure the battleground or player hand.
  - **Goal:** audit and adjust flex/grid positioning in `TableTop.tsx`, `MultiplayerSeats.tsx`, and `OpponentInspectorDrawer.tsx` to fix z-index layering and clipping bugs.
  - **Acceptance:** 6-player layout renders cleanly across desktop and tablet screen sizes without overlapping UI elements.

- [ ] **Money icons & currency art alignment — D&D 5e copper/silver/gold visual pass**
  - **Problem:** gold displays currently use generic text or simple coin badges rather than matching `japiohopman/artificer`'s rich D&D 5e currency icon system (copper, silver, gold, electrum, platinum).
  - **Goal:** integrate standard D&D currency icon SVGs and formatting helpers from `src/utils/currency.ts` into header HUDs, player seats, inspect drawers, and pot displays.
  - **Acceptance:** currency amounts display with high-fidelity D&D coin icons and formatted copper/silver/gold weight tooltips matching Artificer standards.

- [ ] **Artificer layout analysis & deep understanding**
  - **Problem:** embedding TDA inside `japiohopman/artificer` requires matching Artificer's container grid, navigation dock, color tokens, and modal overlays.
  - **Goal:** analyze `japiohopman/artificer` layout specs, theme tokens, and component conventions; document findings in `docs/ARTIFICER_LAYOUT_ANALYSIS.md`.
  - **Acceptance:** document details Artificer's layout grid, CSS variable tokens, sidebar dock dimensions, and target mount point for minigames.

- [ ] **Migration planning — step-by-step TDA minigame embedding spec**
  - **Problem:** migrating TDA into the main `artificer` repository requires a clear, zero-regression step-by-step plan.
  - **Goal:** write `docs/MIGRATION_PLAN.md` detailing file copying/import steps, state store scoping, host event wiring (`onExit`, character gold sync), and asset bundle paths.
  - **Acceptance:** document provides a comprehensive migration checklist ready for execution when `artificer` minigame hosting is enabled.

- [ ] **Performance & asset optimization — particle pooling & sprite atlas caching**
  - **Problem:** spawning multiple coin particle bursts in quick succession could create unnecessary DOM element allocations.
  - **Goal:** implement DOM element pooling or canvas particle fallback in `useAnimationStore.ts` and verify `enhanced_tiamat.webp` atlas preloading.
  - **Acceptance:** smooth 60fps performance maintained during multi-flight coin awards and rapid gambit rounds.

---

## Later — Parked until Pre-Embedding Polish is Complete

- [ ] **TDA Minigame Migration** — Execute embedding of TDA into `artificer` following `docs/MIGRATION_PLAN.md`.
- [ ] **Mobile/touch input pass** for Solitaire and Memory minigames.
- [ ] **NPC dialogue variety pass** — extended Gemini-driven reactions per Voice Archetype.
