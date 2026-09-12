# 💡 Ideas Box — The Dragon's Flagon

This is the shared intake for gameplay, UX, presentation, accessibility, technical-feel, and content ideas discovered by humans or AI agents.

The Ideas Box is **not** a dispatch queue. An idea does not become work merely because it is written here. `ROADMAP.md` remains the canonical execution queue.

## Why this exists

The game is functional, but functional is not the same as finished. We want a repeatable professional game-development loop:

**PLAYTEST → OBSERVE → CAPTURE → TRIAGE → IMPLEMENT → VERIFY → PLAYTEST AGAIN**

The Ideas Box prevents useful observations from disappearing between Jules runs, playtests, reviews, and architecture sessions.

## Who may add ideas

- Human project owner
- Jules
- GitHub Copilot agents
- Other approved AI coding/design agents

Agents may add ideas when they have evidence from code inspection, tests, screenshots, playtesting, or a concrete player-experience observation.

## Evidence first

Prefer an observation over a vague preference.

Good: “During a 6-player AI turn, the active player indicator changes before the previous card animation finishes, so ownership is ambiguous for roughly 300–500ms.”

Weak: “Turn UI feels weird.”

When possible include the flow/state, affected area, frequency, and why it matters to a player.

## Idea format

Append new entries using this structure:

```md
### YYYY-MM-DD — Short title
- **Agent:** Jules / Copilot / Human / ChatGPT
- **Area:** Gameplay / UX / UI / Animation / Audio / VFX / Accessibility / Performance / Content / Integration
- **Observation:** What was observed or measured?
- **Idea:** What change could improve the experience?
- **Player value:** Why does this improve clarity, agency, feedback, pacing, or enjoyment?
- **Evidence:** Test, playtest flow, file/component, screenshot, or other concrete evidence.
- **Confidence:** High / Medium / Low
- **Status:** NEW
```

Allowed status values:

- `NEW` — captured, not yet triaged
- `TRIAGED` — reviewed and deliberately kept
- `PROMOTED` — converted into a concrete `ROADMAP.md` task
- `REJECTED` — reviewed and intentionally not pursued
- `DUPLICATE` — already represented by another idea/task

## Triage rules

1. Do not implement directly from an Ideas Box entry.
2. Triage should group duplicates, challenge weak assumptions, and rank player impact.
3. A promoted idea must become a concrete, testable `ROADMAP.md` task with scope and acceptance criteria.
4. Keep the original observation in this file so we retain the reasoning behind the task.
5. A low-confidence idea may remain in `NEW` until better evidence exists.
6. Technical convenience alone is not enough to promote an idea; player value or meaningful risk reduction should be clear.

## Current design lens

When evaluating ideas, think in terms of the player's experience loop:

**Anticipation → Action → Resolution → Feedback → Next decision**

Prioritize problems that disrupt:

- understanding who can act and why;
- understanding what just happened;
- choosing between meaningful options;
- perceiving impact/reward;
- maintaining tempo without feeling rushed;
- reading the table, hand, opponents, and game state;
- recovering from mistakes without confusion.

---

## Audit Findings

### 2025-05-19 — Drawer Overlay obscures right-side table status and discard pile during AI turn auto-open
- **Agent:** Jules
- **Area:** UI / UX
- **Observation:** When `phase === 'opponent-turn'`, `OpponentInspectorDrawer` automatically slides in on the right, covering the `TavernRightAside` panel (including the round log button and discard pile shortcut) without an option to minimize or collapse while remaining in turn view.
- **Idea:** Add a collapse/dock toggle to `OpponentInspectorDrawer` or make auto-drawer opening optional in settings so table status remains fully visible during multi-opponent AI turns.
- **Player value:** Prevents drawer overlay from blocking primary table state and discard inspection during long AI turn sequences.
- **Evidence:** Playtest flow in `tests/audit_playtest_flow.spec.ts`, `TableTop.tsx` line 80-84 (`useEffect` auto-opening `isDrawerOpen` on `phase === 'opponent-turn'`).
- **Confidence:** High
- **Status:** NEW

### 2025-05-19 — Mobile viewport card fan hover height and touch target overflow
- **Agent:** Jules
- **Area:** UX / Accessibility
- **Observation:** On mobile viewports (375x667), when hovering or touching cards in a 10-card full hand, the `-120px` Y-axis hover translation (`getFanStyle` in `PlayerHandArea.tsx`) lifts the zoomed card above the top boundary of the hand container, occasionally clipping under the battleground pot.
- **Idea:** Scale down card fan transform translation on narrow viewports (`y: -80` for mobile) and adjust hover z-index.
- **Player value:** Ensures card preview remains fully visible on small mobile screens without clipping table elements.
- **Evidence:** Playwright mobile screenshot (`verification/audit_08_mobile_viewport.png`), `PlayerHandArea.tsx` line 34.
- **Confidence:** High
- **Status:** NEW

### 2025-05-19 — Visual progress indicator during targeted AI-to-AI card power interactions
- **Agent:** Jules
- **Area:** Animation / Gameplay
- **Observation:** When an AI player plays a card with a targeted power against another AI opponent, `resolveAiInteraction()` is delayed by 1400ms (`setTimeout` in `turnSlice.ts`), but no visual progress or "AI choice..." progress bar is rendered on the seat chip, leaving a brief pause where the player cannot tell if the game is waiting or processing.
- **Idea:** Add a subtle timer/spinner or "Thinking..." badge on the targeted opponent's seat chip during pending AI-to-AI interaction resolution.
- **Player value:** Improves AI turn transparency and temporal feedback during automated card power interactions.
- **Evidence:** Code inspection of `turnSlice.ts` lines 180-184 and `InteractionModal.tsx` lines 24-34.
- **Confidence:** High
- **Status:** NEW

### 2025-05-19 — Onboarding skill requirement visual focus state
- **Agent:** Jules
- **Area:** UX / Accessibility
- **Observation:** On the `LobbyScreen.tsx`, when a player has not yet selected a skill, the pulse warning "Select a skill above to start your match" appears, but keyboard Tab focus does not automatically cycle or highlight the skill cards, making keyboard-only onboarding less obvious.
- **Idea:** Add clear `aria-selected` attributes and explicit outline styling on keyboard focus for skill cards in `LobbyScreen.tsx`.
- **Player value:** Improves keyboard navigation accessibility and onboarding clarity for first-time players.
- **Evidence:** Code inspection of `LobbyScreen.tsx` lines 61-128.
- **Confidence:** High
- **Status:** NEW

### 2025-05-19 — Expanded card power preview tooltip on flight cards
- **Agent:** Jules
- **Area:** UX / Gameplay
- **Observation:** When hovering over cards already played in a player or opponent flight (`playerFlight` in `PlayerHandArea.tsx` and `flight` in `MultiplayerSeats.tsx`), the small card scale (`scale-[0.75]`) hides the card description text, requiring right-click inspection or memory to recall what power was executed earlier in the gambit.
- **Idea:** Display a rich floating tooltip or expanded preview overlay on hover for flight cards to show full card power description and round played.
- **Player value:** Allows players to quickly review previously played powers and evaluate flight formations without interrupting turn flow.
- **Evidence:** Code inspection of `PlayerHandArea.tsx` lines 78-83 and `MultiplayerSeats.tsx` lines 98-105.
- **Confidence:** High
- **Status:** NEW

### 2025-05-19 — Phase transition audio cues for turn initiative changes
- **Agent:** Jules
- **Area:** Audio / UX
- **Observation:** Visual badges for phase changes (`HeaderHUD.tsx`) and turn initiative banners (`VFXLayer.tsx`) communicate active state changes clearly, but lack a subtle distinct sound effect on phase transitions (e.g. Ante -> Player Turn or Decision Required prompt), relying solely on visual feedback.
- **Idea:** Trigger subtle ambient audio cues (e.g. `UI_PHASE_CHANGE` chime or `DECISION_PROMPT` chime) whenever phase or decision-required state changes.
- **Player value:** Reinforces multi-sensory feedback and attention cues for fast-paced multi-opponent AI turns.
- **Evidence:** Code inspection of `HeaderHUD.tsx` lines 28-56 and `soundService.ts`.
- **Confidence:** High
- **Status:** NEW
