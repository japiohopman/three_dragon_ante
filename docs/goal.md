
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
    *   *Effect:* Opponent pays you gold equal to the strongest dragon in that flight.
*   **Strength Flight:** Playing 3 dragons of the same strength (e.g., Str 5, Str 5, Str 5).
    *   *Effect:* Gambit ends immediately. Winner takes the pot.
*   **The Pot (Stakes):** If the Pot hits 0 at any time, the Gambit ends immediately.

---

## 3. Technical Architecture

### Stack
*   **Framework:** React 19
*   **State Management:** Zustand
*   **Styling:** Tailwind CSS (Responsive Grid Layout)
*   **Icons:** Custom SVG Icon System (see `IconSystemMainGame.md`)
*   **Fonts:** Cinzel (Headers), UnifrakturCook (Numbers/Stats)
*   **AI:** Google Gemini 2.0 Flash (Dialogue & Personality)

### State Management (`useGameStore.ts`)
The entire game state is monolithic, contained within a single Zustand store. This prevents prop-drilling and ensures the UI (TableTop) is always in sync with the Logic (CardLogic).

**Key State Slices:**
*   `hand` / `opponentHand`: Array of `CardData`.
*   `board`: Array of `BoardCard` (CardData + `owner` property).
*   `pot`, `playerGold`, `opponentGold`: Economy state.
*   `gambitPhase`: 'ante' | 'reveal-ante' | 'round-1' ... 'scoring'.
*   `notification`: The central narration banner object.

---

## 4. NPC & Dialogue System

### Voice Archetypes
The game features 37 NPCs, categorized into **9 Voice Archetypes** to facilitate scalable voice-over production:
1. **Sage:** Wise & Elderly (e.g., Obaya, Laeral Silverhand).
2. **Warrior:** Gruff & Direct (e.g., Bruenor, Hadrian).
3. **Noble:** Refined & Arrogant (e.g., Lady Alustriel, Matron Malice).
4. **Scoundrel:** Cunning & Sly (e.g., Jarlaxle, Viconia).
5. **Worker:** Hardy & Friendly (e.g., Thrak, Tordek).
6. **Host:** Jovial & Welcoming (e.g., Durnan, Grog).
7. **Stalker:** Watchful & Quiet (e.g., Hoot, Slow-Shell).
8. **Adept:** Focused & Studious (e.g., Aris, Morgana).
9. **Wild:** Unpredictable & Primal (e.g., Willow, Flow).

### AI Integration
NPCs are powered by Gemini 2.0 Flash for context-aware dialogue. The prompt includes:
*   Current Game State (Gold, Pot, Hand sizes).
*   Game History (Who won previous rounds).
*   Personality Seeds (Archetype-specific traits).

---

## 5. The Sprite System (Asset Pipeline)

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

---

## 6. Visual & UI Systems

### Card Rendering (`components/Card.tsx`)
*   **Typography:** Uses `UnifrakturCook` for strength numbers (Fantasy/Gothic feel) and `Cinzel` for body text.
*   **CSS 3D:** Uses `preserve-3d`, `rotateY`, and `perspective` for realistic flipping.
*   **Juice:** Dynamic tilt effects and holographic sheen using `motion/react`.

### TableTop Environment (`components/TableTop.tsx`)
*   **Physical Pot:** A DOM-based particle system generates gold coin divs.
*   **VFX Layer:** Cinematic banners for flights and "Big Wins".
