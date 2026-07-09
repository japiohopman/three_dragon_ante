
# The Dragon's Flagon: Implementation Roadmap

## Phase 1: Data & Assets (The Foundation)
- [x] **Complete Deck Implementation** (`utils/constants.ts`)
    - [x] Implement the full 70-card deck list as per the rulebook.
    - [x] Ensure specific strength distributions are correct.
    - [x] Verify `spriteIndex` mappings.
- [x] **Type Definitions** (`types.ts`)
    - [x] Expand `CardData` and Define `GameEffect`.

## Phase 2: The Logic Engine (`utils/cardLogic.ts`)
- [x] **Card Power Logic**
    - [x] Implement `resolveDragonPower` for all cards.
- [x] **Flight Mechanics**
    - [x] Implement `checkSpecialFlight` (Color/Strength).
    - [x] Implement Tiamat wildcard logic.

## Phase 3: Game State & Flow (`store/useGameStore.ts`)
- [x] **Buying Cards Sequence**
    - [x] Implement `buyCards` with auto-trigger.
- [x] **Round Management**
    - [x] Refine `nextRound` and `resolveRound`.
- [x] **Gambit Lifecycle**
    - [x] **Ante:** Handle ties.
    - [x] **End of Gambit:** Winner, Board Clear, Draw Step.

## **Refinement Phase: Fixing the Loop** (Complete)
- [x] **Interaction System**
    - [x] Pause/Resume flow.
    - [x] UI Modal for choices.
    - [x] **Poverty Softlock Fix:** Allow partial payments.
- [x] **Missing Special Actions**
    - [x] Copper Dragon (Swap).
    - [x] Princess (Recursive Trigger).
    - [x] Archmage/Dracolich (Copying).
    - [x] **Dragonslayer:** Auto-discard weaker dragon from board (Fixed double-targeting).
- [x] **Loop Integrity**
    - [x] **Gambit Persistence:** `startNextGambit` keeps gold/hands.
    - [x] **Game Over:** Check bankruptcy at end of gambit.
    - [x] **Deck Refill:** reshuffle discard pile safely (Empty deck loop fixed).
    - [x] **Economy Safety:** Clamp gold values to 0.

## Phase 4: AI & UX Polish
- [x] **AI "Aldric" Improvements**
    - [x] Basic heuristic to aim for triggers and special flights.
- [x] **User Interface**
    - [x] Interaction Modal.
    - [x] Notification System.
    - [x] Hand Limit warning (Visual only, logic exists).

## Phase 5: Features & Meta-Game
- [x] **Match Duration:** 3/6/9 Gambits selection.
- [x] **Wager Note:** Display real-world betting disclaimer.
- [x] **D&D Skills:** Implement "Sleight of Hand", "Bluff", "Concentration".
- [x] **Animation Polish:** Fixed Coin Flight mechanics.
- [x] **Debt System:** Allow negative gold.

## Phase 6: Hub & Mini-Games
- [x] **Tavern Hub:** Main menu integration.
- [x] **Memory Game:** Basic implementation.
- [x] **Solitaire:**
    - [x] Drag and Drop.
    - [x] Double-click to Foundation.
    - [x] Scoring & Timer.
