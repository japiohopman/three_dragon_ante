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
