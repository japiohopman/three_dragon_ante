# UX Pass — Onboarding & In-Game Clarity

## Overview
This document summarizes the user experience and onboarding improvements made to Three-Dragon Ante (TDA) in accordance with ROADMAP.md.

---

## Changes & Before/After Summary

### 1. Rulebook Discoverability & Access
- **Before:** The Rulebook was accessed via an unlabelled icon button in `HeaderHUD` next to player hand stats, making it easy for new players to miss.
- **After:**
  - Replaced the icon with an explicit `Rules (?)` button featuring an amber border, hover animation, and keyboard shortcut hint.
  - Added global keyboard shortcuts (`?` and `H`) in `GameUI` to toggle the Rulebook modal instantly during gameplay.

### 2. Hand Limit Visual Warnings & Affordances
- **Before:** Hand limit logic (`HAND_LIMIT = 10`) generated a temporary alert notification when full, but gave no persistent visual indicator or capacity feedback in the player UI.
- **After:**
  - Updated `HeaderHUD` hand counter to display capacity explicitly (`Hand: X/10`).
  - Implemented dynamic color-coded warning states: neutral gray (<8 cards), amber warning (8-9 cards), and a pulsing red `FULL` badge at 10 cards.
  - Added a bouncing warning banner (`Hand Limit Reached (10/10) — Cannot draw or buy cards`) directly above the player's hand cards when capacity is reached.

### 3. Turn & Round Leader Visual Clarity
- **Before:** First-time players had to rely solely on the central HUD directive text to know if it was their turn or if they were the round leader.
- **After:**
  - Added a prominent indicator banner (`YOUR TURN — PLAY CARD` / `YOUR TURN — ROUND LEADER` / `ANTE PHASE — CHOOSE CARD`) directly above the player hand area.
  - Enhanced opponent seat cards in `MultiplayerSeats` with explicit `TURN` badges and `LEADER` crown indicators for active AI opponents.

### 4. Action Clarity & Power Activation Hints
- **Before:** Players had no visual indicator showing whether playing a card would trigger its special power (which requires card strength ≤ previous card played, or being the round leader).
- **After:**
  - Added power activation badges (`⚡ Power` vs `⚔️ Str Only`) above cards in hand during the player's turn.
  - Fixed card glow logic so initial round leader plays correctly glow gold.
  - Enhanced `FocusOverlay` (card inspection overlay) with detailed action status text explaining why a card's special power will or will not trigger based on `lastCardPlayed`.

---

## Verification
- `npm run lint` (`tsc --noEmit`): PASSED (0 errors).
- `npm test` (`vitest run src/`): PASSED (3/3 unit tests).
- `npm run build`: PASSED (production bundle succeeded).
