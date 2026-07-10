# The Dragon's Flagon: Sound Design Specification

This document outlines the comprehensive soundscape for "The Dragon's Flagon". The goal is to create an immersive, tactile, and high-stakes tavern atmosphere using a mix of organic foley (wood, paper, coins) and magical fantasy effects.

## 1. Ambient & Atmosphere
| Sound Name | Description | Duration | Loop | Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Tavern Ambience** | Low-level chatter, clinking mugs, distant hearth crackling, and faint medieval lute music. | 60s+ | Yes | App Start / Tavern Hub |
| **Drafty Cellar** | Subtle wind whistling through stone cracks, low-frequency rumble. | 30s+ | Yes | During high-stakes TDA matches |

## 2. UI & Navigation
| Sound Name | Description | Duration | Loop | Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Menu Hover** | A soft, wooden "thud" or a parchment rustle. | 0.2s | No | Hovering over game cards in Hub |
| **Menu Select** | A firm wooden click or a heavy latch sound. | 0.4s | No | Clicking a game mode |
| **Modal Open** | The sound of a heavy scroll unrolling. | 0.6s | No | Opening Rulebook or Solitaire Warning |
| **Modal Close** | A quick parchment snap or roll-up sound. | 0.4s | No | Closing any modal |
| **Button Click** | A tactile, mechanical click (like a heavy stone button). | 0.2s | No | General UI buttons |
| **Back/Exit** | A sliding wooden sound, like a chair pulling back. | 0.5s | No | Exiting a game to the Hub |

## 3. General Card Actions
| Sound Name | Description | Duration | Loop | Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Deck Shuffle** | Rapid, rhythmic paper riffling (high quality, crisp). | 1.5s | No | Game start / Deck reset |
| **Card Deal** | A single, sharp "zip" of a card sliding across wood. | 0.3s | No | Drawing a card to hand |
| **Card Flip** | A soft "whump" with a subtle paper snap. | 0.3s | No | Revealing an Ante or Memory card |
| **Card Slam** | A heavy, impactful "THUD" with a slight table rattle. | 0.6s | No | Playing a card to the flight (Slam animation) |
| **Card Slide** | A smooth, sustained friction sound of paper on wood. | 0.5s | No | Discarding or moving cards |

## 4. Three-Dragon Ante (TDA) Gameplay
| Sound Name | Description | Duration | Loop | Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Gold Gain (Small)** | A few light metallic clinks. | 0.5s | No | Gaining 1-5 gold |
| **Gold Gain (Large)** | A heavy bag of coins dropping and spilling. | 1.2s | No | Winning a large pot |
| **Gold Loss** | A single coin sliding away or a hollow "clink". | 0.4s | No | Paying an ante or penalty |
| **Turn Start (Player)** | A bright, heroic chime or a "Your Move" whisper. | 0.8s | No | Player Turn Banner appears |
| **Turn Start (AI)** | A low, contemplative hum or a "Thinking" clock tick. | 0.8s | No | Opponent's Turn Banner appears |
| **Gambit Win** | A triumphant orchestral swell with cheering coins. | 2.0s | No | Winning a Gambit (Round 3) |
| **Gambit Loss** | A low, dissonant cello note or a heavy sigh. | 2.0s | No | Losing a Gambit |
| **Match Victory** | A grand, epic fanfare with tavern cheers. | 5.0s | No | Final Game Win |
| **Match Defeat** | A somber, fading melody with a closing door sound. | 5.0s | No | Final Game Loss |

## 5. Special VFX & Dragon Powers
| Sound Name | Description | Duration | Loop | Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Fire Breath** | A sudden "WHOOSH" of a flamethrower followed by crackling. | 1.0s | No | Red Dragon Power |
| **Lightning Strike** | A sharp, high-voltage "CRACK" and sizzle. | 0.8s | No | Blue Dragon Power |
| **Poison Cloud** | A bubbling, hissing gas sound with a low drone. | 1.5s | No | Green Dragon Power |
| **Divine Ray** | A shimmering, celestial choir chord (high pitch). | 1.5s | No | Bahamut / Gold Dragon Power |
| **Necrotic Pulse** | A dark, ethereal "void" sound with a ghostly whisper. | 1.2s | No | Dracolich / Black Dragon Power |
| **Sword Slash** | A sharp metallic "SHING" followed by a heavy cut. | 0.5s | No | Dragonslayer Power |
| **Chromatic Shift** | A multi-tonal, phasing magical shimmer. | 1.5s | No | Tiamat Power |
| **Screen Shake** | A low-frequency earth rumble (sub-bass). | 0.5s | No | Critical hits or heavy slams |

## 6. Mini-Game Specifics
| Sound Name | Description | Duration | Loop | Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Memory Match** | A satisfying "Ding" or magical sparkle. | 0.6s | No | Correct pair found |
| **Memory Mismatch** | A dull "Buzzer" or a wooden "clack". | 0.5s | No | Incorrect pair selected |
| **Solitaire Stack** | A quick "fanning" sound of multiple cards. | 0.4s | No | Moving a stack of cards |
| **Solitaire Win** | A cascading "waterfall" of card snaps. | 3.0s | No | Completing Solitaire |

---

## Implementation Notes

### Audio Engine Suggestions:
1. **Spatial Audio**: Use slight panning for the Deck (Right) and Player Hand (Center-Bottom) to enhance the "TableTop" feel.
2. **Dynamic Pitch**: Vary the pitch of "Card Deal" and "Gold Clink" by ±5% to avoid "machine-gun" repetition fatigue.
3. **Layering**: The "Card Slam" should be a composite of:
   - *Low*: Table impact.
   - *Mid*: Paper snap.
   - *High*: Subtle wood creak.
4. **Volume Ducking**: Ambient tavern music should duck (lower volume) by 20% when a "Match Victory" or "Special Power" sound plays to ensure clarity.
