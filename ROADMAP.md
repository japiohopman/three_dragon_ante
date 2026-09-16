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

- [x] **Responsive & accessibility polish — final quality pass**
  - **Problem:** desktop success does not guarantee a readable or usable experience at smaller sizes, reduced motion, or keyboard/focus interactions.
  - **Goal:** verify responsive layout, text/icon readability, focus visibility, hit targets, overflow, reduced-motion behavior where applicable, and non-color-only state cues.
  - **Acceptance:** core game remains usable without overlap or clipped critical controls at supported viewport sizes; important state is not conveyed by color alone; existing tests/build stay green.

- [x] **Full playtest regression — quality gate before embedding**
  - **Problem:** isolated fixes can create interaction regressions when combined in a real game session.
  - **Goal:** run the standardized playtest flow after the quality tasks and compare against the audit findings.
  - **Acceptance:** no critical UX blocker remains in the documented flow; remaining issues are captured in `IDEAS_BOX.md` with status; the game is judged ready for the integration phase based on observable criteria rather than optimism.

- [x] **Opponent drawer auto-open & table status readability**
  - **Problem:** when `phase === 'opponent-turn'`, `OpponentInspectorDrawer` automatically slides in on the right, covering the `TavernRightAside` panel (including the round log button and discard pile shortcut) without an option to minimize or collapse while remaining in turn view.
  - **Goal:** add a collapse/dock toggle to `OpponentInspectorDrawer` or make auto-drawer opening optional in settings so table status remains fully visible during multi-opponent AI turns.
  - **Acceptance:** player can view right-side table status and discard pile during AI turn sequences; drawer overlay does not permanently block primary table controls.

- [x] **Mobile viewport card fan translation & target bounds**
  - **Problem:** on mobile viewports (375x667), when hovering or touching cards in a full 10-card hand, the hover translation lifts zoomed cards above the hand container top boundary, clipping under the battleground pot.
  - **Goal:** adjust card fan Y-translation and hover bounds for mobile viewports to keep zoomed cards fully visible without clipping table elements.
  - **Acceptance:** zoomed cards in full 10-card hands remain fully readable and unobstructed on narrow mobile viewports; no clipping occurs with central battleground elements.

- [x] **Visual progress indicator during targeted AI-to-AI card power interactions**
  - **Problem:** when an AI player plays a targeted power against another AI opponent, resolution is delayed by 1400ms without visual progress or status indicator on seat chips, creating ambiguous pauses.
  - **Goal:** display a subtle "Thinking..." badge or resolution spinner on targeted opponent seat chips during automated AI-to-AI card power resolution.
  - **Acceptance:** targeted AI-to-AI interactions clearly communicate pending resolution on the affected seat chip; turn pacing remains transparent and readable.

- [x] **Flight card power preview tooltips**
  - **Problem:** cards played in player or opponent flights render at scaled-down sizes (`scale-[0.75]`), obscuring card power description text and requiring memory or inspection drawer searching.
  - **Goal:** add an expanded preview tooltip or hover card overlay for cards in active flights showing full power text and round information.
  - **Acceptance:** hovering over any card in a flight displays a readable card description tooltip without requiring full drawer modal inspection; turn flow is uninterrupted.

- [x] **Phase transition audio cues for turn initiative & decision prompts**
  - **Problem:** visual badges for phase changes (`HeaderHUD.tsx`) and turn initiative banners (`VFXLayer.tsx`) communicate active state changes clearly, but lack dedicated ambient sound cues on phase transitions (e.g. Ante -> Gambit, Player Turn start, or Decision Required prompt), relying solely on visual feedback.
  - **Goal:** add distinct audio transition triggers in `soundService.ts` when game phase changes or decision prompts appear for the human player.
  - **Acceptance:** phase transitions and human decision prompts trigger subtle, distinct audio feedback; audio cues do not overlap or disrupt gameplay during fast AI turns; all existing unit tests and build pass.

- [x] **Table central pot ambient lighting & pulse feedback on pot growth**
  - **Problem:** in `Battleground.tsx`, the central Pot container is visually dominant, but when gold is added to the pot during ante or card power bets, the pot numerical amount updates instantly without a temporary radiant glow or border pulse animation.
  - **Goal:** add a dynamic visual pulse and radiant border flash on the central `Battleground.tsx` Pot element whenever `pot` value increases in `useGameStore`.
  - **Acceptance:** increasing pot value triggers a visible radiant glow/pulse effect on the central pot border; the effect resolves smoothly and does not obscure pot currency text; existing build and tests pass.

- [x] **AI speech history log in Opponent Inspector Drawer**
  - **Problem:** during multi-opponent games (4–5 AI players), speech line badges on seat chips disappear after 3000ms or are overwritten during fast AI turn transitions before the player can finish reading NPC dialogue.
  - **Goal:** add a "Dialogue History" log inside `OpponentInspectorDrawer` showing recent speech lines spoken by the selected opponent.
  - **Acceptance:** players can open `OpponentInspectorDrawer` and review recent speech lines spoken by the selected opponent; dialogue history preserves NPC persona flavor; unit test suite passes.

- [x] **Background drawer backdrop dimming during decision prompts**
  - **Problem:** when an interruption decision prompt (`InteractionModal`) appears (`pendingInteraction.target === 'player'`), open drawers (`OpponentInspectorDrawer`) or modals (`PileBrowserModal`) can remain visible in background layers (`z-[130]`/`z-[150]`), creating visual competition behind the decision modal (`z-[200]`).
  - **Goal:** dim or temporarily hide background drawers/modals while `pendingInteraction` requires human player input.
  - **Acceptance:** when a human decision prompt triggers, background drawers/modals are dimmed or hidden so player focus is directed solely to `InteractionModal`; background state restores cleanly after decision resolution; tests pass.

- [x] **Flight card tooltip keyboard accessibility focus trigger**
  - **Problem:** `FlightCardTooltip` triggers cleanly on mouse hover across `PlayerHandArea`, `MultiplayerSeats`, and `OpponentInspectorDrawer`, but keyboard focus using `Tab` navigation on flight card elements does not trigger the tooltip overlay.
  - **Goal:** bind keyboard focus events (`onFocus` / `onBlur`) on flight card buttons/elements across `MultiplayerSeats.tsx` and `PlayerHandArea.tsx` to update `hoveredCardId` in `useAnimationStore`.
  - **Acceptance:** keyboard users navigating flight cards with Tab key see `FlightCardTooltip` open and close in sync with keyboard focus; mouse hover behavior remains unaffected; tests pass.

- [x] **Turn initiative banner entrance anticipation motion curve**
  - **Problem:** in `VFXLayer.tsx`, the full-screen editorial turn banner (`showTurnBanner`) animates into view using a standard spring transition (`damping: 15, stiffness: 100`), but starts abruptly without a brief scale-up anticipation or pre-blur flash to signal the turn ownership shift to the player.
  - **Goal:** add a subtle pre-entrance scale anticipation or entrance transition to `motion.div` in `VFXLayer.tsx` when `triggerTurnBanner` is called.
  - **Acceptance:** turn banner entrance includes subtle scale/flash anticipation before settling; motion feels smooth and non-blocking; existing build and tests pass.

- [x] **Audio feedback cue during automatic card draw on empty hand**
  - **Problem:** when a player or AI opponent has 0 cards in hand at turn start in `turnSlice.ts` and `roundSlice.ts`, `buyCard` is automatically invoked to draw a card, but this automatic state recovery triggers without playing the standard `CARD_DEAL` sound effect, creating a silent card draw event.
  - **Goal:** trigger `CARD_DEAL` sound effect when `buyCard` is auto-invoked on empty hand state recovery.
  - **Acceptance:** automatic hand card draws play `CARD_DEAL` audio feedback; audio cue remains non-disruptive; existing unit test suite passes.

- [x] **Keyboard focus z-index elevation and scale expansion for flight card tooltips**
  - **Problem:** in `MultiplayerSeats.tsx` and `PlayerHandArea.tsx`, when keyboard Tab navigation focuses a flight card, adjacent overlapping flight cards in dense 6-player seat chips can partially overlap the focused card boundary unless z-index elevation and transform scaling are explicitly applied to the focused element (`focus-visible:z-50`).
  - **Goal:** ensure all flight card containers apply explicit relative z-index stacking (`z-50`) and scale expansion (`scale-110`) during active `:focus-visible` state across tabletop components.
  - **Acceptance:** focused flight cards remain completely unobstructed by adjacent sibling cards during keyboard navigation; tests pass.

- [x] **Visual Gold/Pot breakdown summary tooltips on Gambit End banner**
  - **Problem:** in `EndGameModal.tsx`, when `isGambitEnd` is active, the modal displays the total pot won, but does not provide an itemized visual breakdown showing how much was contributed from ante stakes vs card power bets (e.g. Red Dragon / Gold Dragon bets) during that gambit.
  - **Goal:** add an expandable or hoverable tooltip/accordion inside `EndGameModal.tsx` breaking down pot earnings by source (Antes vs Powers vs Color Flight rewards).
  - **Acceptance:** gambit end summary displays a clear, itemized breakdown of pot contributions; test suite passes.

- [ ] **Animated visual countdown ring on active player turn indicator**
  - **Problem:** during human player turn in `HeaderHUD.tsx` and `PlayerHandArea.tsx`, the directive banner indicates "Your turn - Play a card to the table", but does not provide a subtle ambient glow intensity pulse or visual timer cue to signal turn duration/pacing in fast-paced tavern play.
  - **Goal:** add an optional subtle radial breathing ring or pulse indicator around the active turn badge when awaiting player card selection.
  - **Acceptance:** active turn badge features a smooth ambient breathing pulse indicator when awaiting human player input; tests pass.

- [ ] **Game log narrative entry for automatic card draw on empty hand state**
  - **Problem:** in `turnSlice.ts` and `roundSlice.ts`, when a player or AI opponent starts their turn with an empty hand (0 cards), `buyCard` automatically executes state recovery and draws a card, but no explicit narrative log entry (e.g., "[Player/NPC] drew a card to replenish an empty hand") is appended to `history`, leaving the event absent from Tavern Records.
  - **Goal:** append a clear narrative log entry to `history` when `buyCard` is automatically invoked on an empty hand.
  - **Acceptance:** Tavern Records history log displays clear entries when cards are automatically drawn for empty hands; unit test suite passes.

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
