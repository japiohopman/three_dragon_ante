# The Dragon's Flagon: Animation Design Document

## 1. Core Philosophy: "Tactile & Juicy"
The game should feel like a physical board game played in a fantasy tavern.
- **Weight:** Cards shouldn't just appear; they should slide, slam, and settle.
- **Materiality:** Gold coins are heavy metal. Wood creaks. Cards are thick paper.
- **Diegetic UI:** Interface elements should feel like part of the world (scrolls, wood, metal), not digital overlays.

---

## 2. Animation Architecture (Zustand Slices)
We separate **Logic State** (Gold = 50) from **Visual State** (Coin particle flying from X to Y).

### The `useAnimationStore`
This store handles transient visual events.
- `vfxQueue`: A queue of effects to play (e.g., ["fire-breath", "shake-screen"]).
- `isAnimating`: Flags to block user input during sequences.
- `coinParticles`: Array of active coin objects `{ x, y, id }` for the React renderer.

---

## 3. Priority Animation List

### A. Card Dynamics (High Priority)
1.  **The Draw:**
    *   *Motion:* Card spawns from Deck (Right), flies in an arc to Hand (Bottom), scales up, then settles into the fan.
    *   *Easing:* `cubic-bezier(0.34, 1.56, 0.64, 1)` (Overshoot/Elastic).
2.  **The Play (The Slam):**
    *   *Motion:* Card lifts from hand (scale 1.1), follows cursor, then "Slams" onto the board (scale 1.0 -> 0.95 -> 1.0) with a dust particle effect.
    *   *Sound:* Paper slide + Heavy thud.
3.  **The Reveal (Ante/Flip):**
    *   *Motion:* Card lifts Z-index, rotates Y 180deg (CSS 3D), pauses for drama, then settles.
    *   *Glow:* Edge lighting intensifies during the flip.
4.  **The Discard:**
    *   *Motion:* Card spins slightly, shrinks, and moves rapidly to the discard pile.

### B. Economy & Gold (High Priority)
1.  **Coin Shower:**
    *   *Trigger:* Winning a pot or stealing gold.
    *   *Visual:* 10-20 small gold divs spawn at Source (Loser/Pot) and follow a parabolic arc to Target (Winner).
    *   *Stagger:* They don't arrive at once; they arrive over 0.5s.
2.  **Pot Fill:**
    *   *Visual:* When betting, a coin flies from Player to Pot. The Pot container performs a small "bounce" when the coin lands.

### C. Environmental VFX (Medium Priority)
1.  **Screen Shake:**
    *   *Trigger:* Playing a Strength 10+ Dragon or Tiamat/Bahamut.
    *   *Visual:* The entire `#root` container translates X/Y randomly by 5px for 200ms.
2.  **Dragon Breath:**
    *   *Trigger:* Red Dragon (Fire), Blue (Lightning), Green (Poison cloud).
    *   *Visual:* SVG overlay or Particle Canvas layer briefly covers the opponent's side.
3.  **Table Ambience:**
    *   *Visual:* Subtle floating dust motes (CSS Keyframes) over the board. Candle flicker lighting overlay.

---

## 4. Specific Card Power Animations

| Card | Animation Effect |
| :--- | :--- |
| **Red Dragon** | Screen flashes Red. Shake effect. |
| **Blue Dragon** | Blue lightning crackle across the center line. |
| **Green Dragon** | Green toxic mist rises from the bottom of the card. |
| **Gold/Silver** | Radiant shine (sweep gradient across card face). |
| **Copper Dragon** | **Morph:** Card spins rapidly, blurs, and texture changes to new card. |
| **Tiamat** | **The Arrival:** Screen darkens, 5-color glow pulse, heavy screen shake. |
| **Thief** | "Yoink" sound. A coin flies explicitly from Pot to Player Hand. |
| **The Fool** | Card wobbles/tilts back and forth (confused motion). |

---

## 5. UI Transitions
1.  **Turn Change:** A wooden banner slides across the screen: "YOUR TURN".
2.  **Gambit End:**
    *   *Victory:* Gold rays spin behind the Victory Banner.
    *   *Defeat:* Screen desaturates (grayscale) slightly.

## 6. Implementation Strategy
1.  **CSS Classes:** Define `shake`, `slam`, `draw-curve` in `index.html`.
2.  **React Spring / Framer Motion:** (Optional) If CSS is too rigid, use `framer-motion` for the Coin Particle system.
3.  **Sound Triggers:** The Animation Store should also dispatch sound events (future phase).
