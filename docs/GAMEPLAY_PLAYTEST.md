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

## Repeatable Playtest Flow Baseline

An automated Playwright test script (`tests/audit_playtest_flow.spec.ts`) captures visual screenshots and verifies the end-to-end playable journey.

### Automated Playtest Steps (`npm run dev` & `npx playwright test tests/audit_playtest_flow.spec.ts`):
1. **Landing & Onboarding**: Navigate to `http://localhost:3000`, click `ENTER THE TAVERN`, then `Challenge to Three-Dragon Ante`.
2. **Lobby Setup**: Select opponent count (e.g. 3 opponents), pick player skill (e.g. Sleight of Hand), and choose game duration (Short: 3 Gambits).
3. **Ante Phase**: Confirm prompt directive in Header HUD, inspect player hand fan, select an ante card, and verify ante reveal & leader assignment.
4. **Gambit Rounds & AI Sequence**: Play cards during turn, observe AI decision pace & speech bubble triggers, verify seat chip highlights and turn banner transitions.
5. **Opponent Inspection Drawer**: Click seat chip or inspect button to slide out Opponent Inspector Drawer and navigate opponent carousel.
6. **Decision Prompts / Interruptions**: Verify `InteractionModal` options and formatted gold/power icons when card powers trigger choices.
7. **Responsive Audit**: Test layout and card fan step-spacing at 1920x1080 (Desktop), 1024x768 (Tablet), and 375x667 (Mobile).

## Audit Checklist (13 Acceptance Areas)

1. **Onboarding**: Entry landing page, skill requirements, opponent count options, rulebook modal accessibility.
2. **Table Hierarchy**: 3D perspective table, battleground pot, stakes, player hand area, sidebars.
3. **Hand Readability**: Dynamic fan step-spacing, 10-card capacity warning badge, card strength & power indicators (`⚡ Power` / `⚔️ Str`).
4. **Turn Ownership**: Active seat glow, leader crown, Header HUD directive banner, turn ownership banners.
5. **Card Selection/Play**: Card click responsiveness, play commitment, visual confirmation.
6. **AI Turns**: Thinking delay (1000–1400ms), speech line triggers, seat emotion changes.
7. **Decision Prompts**: `InteractionModal` options, card targets, gold cost formatting, clear resolution.
8. **Animation Timing**: Card spring physics, particle VFX (fire, lightning, poison), screen shake/flash.
9. **Pot/Gold Feedback**: `CurrencyDisplay` coin rendering (copper/silver/gold), pot collection updates.
10. **Opponent Readability**: Seat chips, gold balances, public flight cards, opponent inspector drawer.
11. **End-of-round/game Feedback**: `EndGameModal` gambit summary, flight strengths, game over standings.
12. **Audio/VFX**: Sound triggers (`CARD_SLAM`, `UI_CLICK`, `FIRE_BREATH`), screen effects.
13. **Responsive Behavior**: Desktop (1920x1080), Tablet (1024x768), Mobile (375x667) viewport support.

## Pass/fail quality gate

A quality gate is not “it looks good.” It passes when the documented core flow is readable, responsive, and free of critical ambiguity, and remaining observations are explicitly captured for the next cycle.
