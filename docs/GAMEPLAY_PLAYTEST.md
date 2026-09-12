# 🎮 Gameplay Playtest Protocol

Use this short protocol to make experience observations comparable across humans and AI agents.

## Standard session

1. Enter the game as a first-time player or reset to a clean session.
2. Start a game and identify the first actionable decision without reading implementation details first.
3. Play at least 3 player turns and observe one complete multi-player AI sequence.
4. Trigger at least one card power or interruption that requires a player decision when the rules allow it.
5. Observe a meaningful gold/pot change and at least one flight or other major resolution when the game state permits it.
6. Continue through a gambit boundary or game-end state when practical.
7. Repeat one short section at normal pace after the first pass to check whether the problem is reproducible.

## Record observations, not impressions only

For each issue capture:

- **Where:** screen, component, or game phase.
- **Trigger:** exact action/state that produced it.
- **What the player sees/hears:** concrete behavior.
- **Expected:** what a competent player would reasonably infer.
- **Impact:** confusion, delay, lost agency, missed feedback, visual clutter, or reduced satisfaction.
- **Frequency:** once / occasional / repeatable / every turn.
- **Severity:** blocker / high / medium / low.

Add worthwhile observations to `docs/IDEAS_BOX.md`.

## Design questions

During the session ask:

- Do I always know **whose turn it is**?
- Do I know **what phase I am in** and what can happen next?
- Can I tell **what I can interact with** without guessing?
- When I act, do I see **immediate confirmation** and then **consequence**?
- When an opponent acts, can I understand **what changed** without inspecting hidden state?
- When a reward occurs, do I understand **why I got it** and where it went?
- Do animations improve causality and anticipation, or merely slow the game?
- Is the table hierarchy helping me focus, or asking me to scan everything equally?
- Are important states communicated without depending on color alone?

## Pass/fail quality gate

A quality gate is not “it looks good.” It passes when the documented core flow is readable, responsive, and free of critical ambiguity, and remaining observations are explicitly captured for the next cycle.
