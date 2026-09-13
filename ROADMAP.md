# 🗺️ Roadmap — The Dragon's Flagon: Three-Dragon Ante

This is the **single canonical dispatch roadmap** for the Jules orchestrator. `todo.md` contains the original build-out (Phases 1–6, complete); this file controls the current product-development loop.

The project is intentionally separated into three concepts:

1. **Ready** — concrete work that Jules may implement now, in order.
2. **Integration / Later** — work that is intentionally parked until the Ready quality gate allows it.
3. **Continuous Improvement Triage** — a recurring planning trigger. When the Ready queue is empty and there are new ideas, Jules reviews `docs/IDEAS_BOX.md` and the current player experience, then proposes a small number of concrete Ready tasks. The trigger itself is never checked off.

Jules checks ordinary task boxes only after personally verifying the work, per `AGENT_RULES.md §1`. The orchestrator never edits ordinary task checkboxes. Review and merge remain the real checkpoints.

The target development loop is:

**PLAYTEST → OBSERVE → IDEAS BOX → TRIAGE → READY → IMPLEMENT → VERIFY → MERGE → PLAYTEST AGAIN**

## Now

### Ready — Game Experience Quality Gate

This queue is deliberately ordered. Do not skip ahead because a later item looks easier.

- [x] **Game Experience Audit — full playable-flow baseline**
  - **Problem:** the game is functionally complete, but the current product experience has not been assessed as one coherent player journey after the recent technical polish.
  - **Goal:** play the main game from entry through multiple gambits and game end, inspect the implementation, and document concrete experience problems in `docs/IDEAS_BOX.md` rather than immediately coding fixes.
  - **Acceptance:** audit covers onboarding, table hierarchy, hand readability, turn ownership, card selection/play, AI turns, decision prompts, animation timing, pot/gold feedback, opponent readability, end-of-round/game feedback, audio/VFX, and responsive behavior; findings contain evidence and player impact; at least one repeatable playtest flow is documented.

- [x] **Card interaction feel — selection, affordance, play commitment & resolution**
  - **Problem:** card interaction is one of the highest-frequency player actions and must communicate what can be selected, what will happen, and when the action is committed.
  - **Goal:** refine selection affordance, playable/unplayable state, hover/focus feedback, commitment feedback, and post-play resolution without adding unnecessary UI chrome.
  - **Acceptance:** a player can identify playable cards and understand selection/commitment state without guessing; feedback remains readable during fast AI turns; keyboard focus is not broken where interaction is supported.

- [x] **Turn readability — ownership, phase, tempo & interruption states**
  - **Problem:** a card game can feel chaotic when the player is uncertain whose turn it is, which phase is active, or whether an interruption is waiting for input.
  - **Goal:** establish one consistent visual and motion language for turn ownership, phase changes, AI thinking, player decisions, and resolved triggers.
  - **Acceptance:** in a 6-player sequence the active actor and current phase are immediately identifiable; decision-required states cannot be mistaken for passive animation; pacing communicates progress without unnecessary waiting.

- [x] **Table hierarchy — make the important state visually dominant**
  - **Problem:** table UI, seats, drawers, hand, pot, and effects can compete for attention even when only one element needs player focus.
  - **Goal:** audit visual hierarchy and reduce competing emphasis so the board state, active player, current action, and meaningful rewards dominate secondary information.
  - **Acceptance:** primary action/state is visually distinguishable from secondary information at a glance on desktop and tablet; no critical element is obscured by a drawer, seat, overlay, or effect.

- [x] **Animation language — anticipation → action → resolution**
  - **Problem:** individual animations may be polished while the overall motion language still lacks consistent timing and causal readability.
  - **Goal:** define and apply a coherent motion vocabulary for card movement, flights, coins, banners, opponent actions, and end states.
  - **Acceptance:** important actions have readable anticipation, a clear action moment, and a visible resolution; animations remain non-blocking; repeated turns do not feel sluggish.

- [x] **Opponent readability — AI intent, actions & reactions**
  - **Problem:** AI participants need to feel like actors at the table rather than background state changes.
  - **Goal:** improve clarity of opponent action, timing, relevant public information, and reaction feedback without exposing hidden information.
  - **Acceptance:** players can follow which opponent acted and what public consequence occurred; AI turns have consistent cadence; no hidden state is accidentally revealed.

- [x] **Decision UX — interruption prompts and meaningful choices**
  - **Problem:** rule-driven interruptions can become modal friction when their timing, consequence, or default path is unclear.
  - **Goal:** standardize prompts for card powers and player decisions around context, available actions, consequence, and resolution.
  - **Acceptance:** every player decision clearly states what requires input, available choices, and what happens after selection; no prompt traps the player or competes with unrelated animation.

- [x] **Reward & game-state feedback — gold, pot, flights and round endings**
  - **Problem:** rewards and state changes are core reinforcement and should read as consequences of player actions, not incidental number updates.
  - **Goal:** synchronize visual, motion, audio, and numerical feedback for gold/pot changes, flights, gambit completion, and game end.
  - **Acceptance:** after a meaningful event the player can identify what changed and why; reward feedback has a clear destination and does not obscure the next decision.

- [ ] **Responsive & accessibility polish — final quality pass**
  - **Problem:** desktop success does not guarantee a readable or usable experience at smaller sizes, reduced motion, or keyboard/focus interactions.
  - **Goal:** verify responsive layout, text/icon readability, focus visibility, hit targets, overflow, reduced-motion behavior where applicable, and non-color-only state cues.
  - **Acceptance:** core game remains usable without overlap or clipped critical controls at supported viewport sizes; important state is not conveyed by color alone; existing tests/build stay green.

- [ ] **Full playtest regression — quality gate before embedding**
  - **Problem:** isolated fixes can create interaction regressions when combined in a real game session.
  - **Goal:** run the standardized playtest flow after the quality tasks and compare against the audit findings.
  - **Acceptance:** no critical UX blocker remains in the documented flow; remaining issues are captured in `IDEAS_BOX.md` with status; the game is judged ready for the integration phase based on observable criteria rather than optimism.

## Integration Gate

- **Integration status:** `BLOCKED`
- **Owner:** human project owner
- **Meaning:** the orchestrator must not dispatch Integration work while this status is `BLOCKED`.
- **To unlock:** after reviewing the Quality Gate results and merged history, change only the value from `BLOCKED` to `READY` in a deliberate human review commit.

## Integration — only when Integration status is READY

- [ ] **TDA Minigame Migration** — Execute embedding of TDA into `artificer` following `docs/MIGRATION_PLAN.md`.
- [ ] **Host integration verification** — validate `TDAMinigameProps`, gold synchronization, exit flow, state boundaries, and asset paths inside Artificer.
- [ ] **Migration regression pass** — verify TDA works in the real Artificer host without changing unrelated Artificer behavior.

## Later — Non-TDA backlog

- [ ] **Mobile/touch input pass** for Solitaire and Memory minigames.
- [ ] **NPC dialogue variety pass** — extended Gemini-driven reactions per Voice Archetype.

## Continuous Improvement Triage

- [ ] **🔁 Experience Triage Cycle — recurring planning trigger (DO NOT CHECK OFF)**
  - **Purpose:** when the Ready queue is empty and `docs/IDEAS_BOX.md` contains `NEW` ideas, review the evidence and replenish the Ready queue with the next small set of high-value, testable tasks.
  - **Rules:** do not implement the promoted work in the triage PR; do not promote vague ideas; challenge assumptions; consolidate duplicates; preserve evidence; add no more than 3–5 Ready tasks per cycle; keep Integration blocked until the explicit human gate is set to `READY`.
  - **Completion semantics:** recurring trigger, not a one-time completion marker. Leave it unchecked after a successful triage cycle.
  - **Primary source:** `docs/IDEAS_BOX.md`.
  - **Design lens:** **Anticipation → Action → Resolution → Feedback → Next decision**.

## Completed Work Archive

The following work is complete and retained here as historical context. It is **not** part of the active dispatch queue.

- [x] CI pipeline — build/lint/test on every push and PR.
- [x] Repo hygiene — stop committing build/verification artifacts.
- [x] Performance pass — split the largest monolithic files.
- [x] Performance pass — table VFX and sprite loading.
- [x] Follow-up — finish the store split.
- [x] UX pass — onboarding and in-game clarity.
- [x] Artificer-readiness — define the TDA engine's integration boundary.
- [x] Issue #28 — prevent repeated special-flight resolution on extended flights.
- [x] Animation refinement — card motion & coin drop physics pass.
- [x] Artificer SVG icon system — canonical main-game icon integration.
- [x] Game flow polish — turn pacing, auto-pass & decision prompts.
- [x] Layout polish & bug fixes — 6-player responsive table & z-index layers.
- [x] Money icons & currency art alignment — D&D 5e copper/silver/gold visual pass.
- [x] Artificer layout analysis & deep understanding.
- [x] Migration planning — step-by-step TDA minigame embedding spec.
- [x] Performance & asset optimization — particle pooling & sprite atlas caching.
