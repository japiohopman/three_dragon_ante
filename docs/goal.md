
# The Dragon's Flagon: Three-Dragon Ante (TDA) - Technical Design Document

## 1. Executive Summary & Substance
**Three-Dragon Ante** is a high-stakes, D&D-themed card game played within a virtual tavern environment. Unlike standard card games, TDA relies on specific RPG mechanics: individual card powers, elemental alignments, and specific "flight" formations.

**The Substance:**
*   **Genre:** Strategy / Gambling / RPG.
*   **Vibe:** Immersive, tactile, "physical" tavern simulation (wood textures, lighting, floating dust, gold physics).
*   **Core Loop:** Players bet gold (Ante), play dragons into a "Flight" over 3 rounds, trigger special abilities, and the strongest flight wins the pot.
*   **Unique Selling Point:** The game separates the "Art" from the "Logic", allowing for high-fidelity visuals using a compact sprite atlas, and features a "Dungeon Master" style narration system for game actions.

---

## 2. Game Rules & Mechanics

### The Objective
Have the most gold. The game is played in **Gambits**. A Gambit ends after 3 rounds. The player with the highest total **Strength** (sum of all cards in their Flight) wins the Pot.

### Setup
*   **Starting Gold:** 50 Gold per player.
*   **Hand Size:** 6 Cards drawn initially.
*   **Max Hand Size:** 10 Cards.
*   **Ante:** Players select 1 card from hand. The strongest card determines the **Leader** and the **Base Stake** (e.g., Strength 5 card = 5 Gold pay-in).

### The Turn Structure (The Gambit)
A Gambit consists of 3 Rounds.
1.  **Leader Plays First:** The Leader plays a card. Its power **ALWAYS** triggers.
2.  **Opponent Plays:** The opponent plays a card. Its power **ONLY** triggers if the card's Strength is **Lower or Equal** to the previous card played that round.
3.  **Round End:** The player who played the **Strongest Card** becomes the Leader for the next round.

### Special Mechanics
*   **Buying Cards:** If a player has 1 or 0 cards, they MUST buy.
    *   *Cost:* Strength of top deck card.
    *   *Effect:* Discard top card, pay cost, refill hand to 4 cards.
*   **Color Flight:** Playing 3 dragons of the same color (e.g., Red, Red, Red).
    *   *Effect:* Opponent pays you gold equal to the 2nd strongest dragon.
*   **Strength Flight:** Playing 3 dragons of the same strength (e.g., Str 5, Str 5, Str 5).
    *   *Effect:* Steal gold from Pot + Retrieve Ante cards.
*   **The Pot (Stakes):** If the Pot hits 0 at any time, the Gambit ends immediately.

---

## 3. Technical Architecture

### Stack
*   **Framework:** React 19
*   **State Management:** Zustand
*   **Styling:** Tailwind CSS (Responsive Grid Layout)
*   **Icons:** Custom SVG Icon System (see `IconSystemMainGame.md`)
*   **Fonts:** Cinzel (Headers), UnifrakturCook (Numbers/Stats)

### State Management (`useGameStore.ts`)
The entire game state is monolithic, contained within a single Zustand store. This prevents prop-drilling and ensures the UI (TableTop) is always in sync with the Logic (CardLogic).

**Key State Slices:**
*   `hand` / `opponentHand`: Array of `CardData`.
*   `board`: Array of `BoardCard` (CardData + `owner` property).
*   `pot`, `playerGold`, `opponentGold`: Economy state.
*   `gambitPhase`: 'ante' | 'reveal-ante' | 'round-1' ... 'scoring'.
*   `notification`: The central narration banner object.

---

## 4. The Sprite System (Asset Pipeline)

To optimize performance and asset management, the game uses a **5x5 Grid Sprite Atlas**.

### The Atlas
*   **Source:** Single WebP file (`enhanced_tiamat.webp`).
*   **Dimensions:** 5 Columns x 5 Rows (25 Cells total).
*   **CSS Logic:** `background-size: 500% 500%`.

### The Coordinate System
The logic in `utils/cardLogic.ts` -> `getSpritePosition` calculates the background position percentage.

**Formula:**
```typescript
// Column Calculation
const colIndex = index % 5;
const xPercent = (colIndex / 4) * 100;

// Row Calculation
const rowIndex = Math.floor(index / 5);
const yPercent = (rowIndex / 4) * 100;
```

**The Mapping (Rows):**
1.  **Row 1:** Chromatic Dragons (Red, Blue, Green, Black, White).
2.  **Row 2:** Metallic Dragons (Gold, Silver, Bronze, Copper, Brass).
3.  **Row 3:** Legends (Bahamut, Tiamat, Dracolich).
4.  **Row 4:** Mortals (Thief, Archmage, Druid, Slayer, Fool).
5.  **Row 5:** Specials & Assets (Princess, Priest, Card Back, Rules Card).

url to use https://github.com/japiohopman/chimera/blob/main/enhanced_tiamat.webp?raw=true

**React Component Implementation:**
The `Card` component applies these coordinates dynamically based on the card's `spriteIndex`.

---

## 5. Core Systems Breakdown

### A. Card Data Structure (`types.ts`)
Cards are data-objects first, visuals second.
```typescript
interface CardData {
  id: string; // Unique ID
  spriteIndex: number; // 0-24
  rpg: {
    name: string; // "Red Dragon"
    element: 'fire' | 'acid' ...; // Affects border glow colors
    powerStrength: number; // 1-13 (The gameplay value)
    description: string; // The rule text
  }
}
```

### B. The Power Engine (`utils/cardLogic.ts`)
This is the brain of the game rules.

1.  **`checkDragonFlight(flight: CardData[])`**
    *   Analyzes the last 3 cards played by a player.
    *   **Tiamat Logic:** Checks if Tiamat is present (Wildcard for Color Flights).
    *   **Trigger:** Only returns true if the *newly played card* completes the set of 3.

2.  **`resolveDragonPower(card, context)` -> `GameEffect`**
    *   **Input:** The card played and the entire game context (Gold, Pot, Hands, Board).
    *   **Output:** A `GameEffect` object (Delta changes).
    *   **Design Pattern:** Pure function. It calculates "What *should* happen?", it does not mutate state directly.
    *   **Example Output:**
        ```javascript
        {
          dPlayerGold: 5,
          dOpponentGold: -5,
          log: "The Green Dragon extorts 5 gold!",
          stealCardFromOpponent: true
        }
        ```

### C. Effect Applicator (`store/useGameStore.ts`)
The `applyGameEffects` function takes the `GameEffect` from the logic engine and actually mutates the Zustand store.
*   **Visual Feedback:** Triggers `triggerFloat` (Floating text) for every gold change.
*   **Recursion:** Handles complex chains like the **Archmage** (which copies an Ante card) or **Princess** (triggers all good dragons) by calling `triggerCardEffect` recursively with delays.

### D. The Narrator System (UX)
To solve the "game moves too fast" issue, actions are sequenced:
1.  `setNotification({ message: "Action...", icon: ... })` (Slide in banner).
2.  `setTimeout` delay.
3.  Perform Logic (State update).
4.  `setNotification(null)` (Slide out).

---

## 6. Visual & UI Systems

### Card Rendering (`components/Card.tsx`)
*   **Typography:** Uses `UnifrakturCook` for strength numbers (Fantasy/Gothic feel) and `Cinzel` for body text.
*   **Shape:** Asymmetrical Border Radius.
    *   *Player:* Top-Right/Bottom-Left are 25px.
    *   *Opponent:* Inverted.
*   **CSS 3D:** Uses `preserve-3d`, `rotateY`, and `perspective` for realistic flipping.
*   **Holographic Sheen:** Mouse-move event listener calculates cursor position to apply a dynamic gradient overlay (`mix-blend-soft-light`).

### TableTop Environment (`components/TableTop.tsx`)
*   **Physical Pot:** A DOM-based particle system generates gold coin divs inside a wooden bowl based on the `pot` value.
*   **Zones:** 3D transformed containers for Deck and Discard piles (`rotateX`, `rotateY`) to give depth.

---

## 7. AI Logic (Dynamic NPC System)
The AI is contained in `aiTurn` and `aiBuyCard`.
*   **Behavior:**
    1.  **Check Hand:** If <= 1 card, call `aiBuyCard` (and await resolution).
    2.  **Play:** Pick a random card from hand (Simple heuristic).
    3.  **Resolve:** Game engine handles triggers and flight checks automatically.
*   **Pacing:** Uses `setTimeout` to mimic "thinking" time.

---

## 8. Migration Checklist
To move this to a new repo, ensure you copy:

1.  **Assets:**
    *   `enhanced_tiamat.webp` (The 5x5 Atlas).
    *   `opponent_avatar.webp` (The AI opponent).
2.  **Configuration:**
    *   `tailwind.config.js` (Ensure animations/keyframes from `index.html` style block are ported).
    *   `index.html` (Google Fonts imports are critical).
3.  **Code:**
    *   `store` and `utils` folders are the core logic; they are UI-agnostic.
    *   `components` folder contains the specific visual implementation.

## 9. Color Reference & Themes
Used for Border Glows and UI accents.
*   **Fire/Red:** `red-500`
*   **Lightning/Blue/Bronze:** `blue-500` / `cyan-400`
*   **Acid/Black/Copper:** `lime-600`
*   **Poison/Green:** `emerald-500`
*   **Radiant/Gold/Bahamut:** `yellow-400`
*   **Cold/White/Silver:** `cyan-400`
*   **Necrotic/Dracolich:** `purple-500`

---

## 10. Integration Strategy: Game-Within-A-Game
The "Dragon's Flagon" is designed to be an embedded mini-game within a larger RPG world.

### A. Modular Architecture
*   **Encapsulation:** The entire TDA game loop is contained within `useGameStore`.
*   **Entry Point:** Currently `TavernHub.tsx` acts as the menu. In the main game, this component will be replaced by an **Interaction Event** (e.g., interacting with an NPC in the overworld).
*   **Exit Point:** The `onBack` or `Exit` callbacks currently return to the Hub. In the main game, these will resolve the Promise/Event that started the mini-game, returning control to the Overworld exploration mode.

### B. NPC System
*   **Current State:** Single hardcoded opponent.
*   **Future State:**
    *   Opponents will be passed as props/objects to the game engine: `{ name: string, avatar: string, aiPersonality: 'aggressive' | 'cautious' }`.
    *   Game difficulty and deck composition can vary by NPC.
    *   Dialogue triggers will exist during specific game events (e.g., NPC reacts when playing a specific dragon).

### C. Character Skills
*   **Current State:** Player manually selects a skill (Bluff/Sleight/Concentration) in the Lobby.
*   **Future State:**
    *   Skills are **injected** based on the main game's **Character Sheet**.
    *   Example Logic: `const playerSkill = character.skills.bluff >= 5 ? 'bluff' : 'none';`
    *   This ensures character build choices in the RPG affect mini-game performance.

### D. Currency System
*   **Current State:** Uses abstract "Gold".
*   **Future State:** Uses D&D standard coinage (PP, GP, EP, SP, CP).
*   **Conversion:**
    *   TDA is typically played with Gold Pieces (GP).
    *   The `utils/currency.ts` module is prepared to handle formatting and conversion from the main game's total copper value.
    *   Bankroll will be checked against the player's actual inventory before starting a match.
