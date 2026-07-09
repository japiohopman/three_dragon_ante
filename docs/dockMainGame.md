# Project Chimera: Technical Documentation

## Table of Contents
1.  [Introduction & Philosophy](#1-introduction--philosophy)
2.  [Project Structure](#2-project-structure)
3.  [Core Concepts: The Zustand Architecture](#3-core-concepts-the-zustand-architecture)
    - [The Central Store (`useGameStore.ts`)](#the-central-store-usegamestorets)
    - [State Slices (`/src/store/*.ts`)](#state-slices-srcstorets)
    - [Accessing State & Actions](#accessing-state--actions)
    - [Side-Effects & Initialization](#side-effects--initialization)
    - [Persistence](#persistence)
    - [Architecture Diagram](#architecture-diagram)
4.  [How-To Guides (Cookbook)](#4-how-to-guides-cookbook)
5.  [AI Integration (Gemini API)](#5-ai-integration-gemini-api)
    - [The Two AI Personas](#the-two-ai-personas)
    - [System Prompts (`promptBuilder.ts`)](#system-prompts-promptbuilderts)
    - [NPC Memory System](#npc-memory-system)
    - [Detailed List of Tool Calls](#detailed-list-of-tool-calls)
6.  [Key Systems](#6-key-systems)
    - [Combat System (`combatSlice.ts`)](#combat-system-combatslicets)
    - [Level Up System (`LevelUpScreen.tsx`)](#level-up-system-levelupscreentsx)
    - [Inventory & Items (`inventorySlice.ts`)](#inventory--items-inventoryslicets)
    - [Companion System (`data/companionData.ts`)](#companion-system-datacompaniondatats)
    - [Quest System](#quest-system)
    - [Skill Checks & Interactions](#skill-checks--interactions)
    - [Map & Navigation System](#map--navigation-system)
7.  [UI & Components](#7-ui--components)
    - [Philosophy](#philosophy)
    - [Key Components](#key-components)
    - [Overlays & Modals](#overlays--modals)
8.  [Debugging the AI](#8-debugging-the-ai)
    - [Troubleshooting Failed Tool Calls](#troubleshooting-failed-tool-calls)
9.  [Asset Pipeline & Sprite Sheets](#9-asset-pipeline--sprite-sheets)

## 1. Introduction & Philosophy

Project Chimera is an experimental, voice-powered RPG that combines the power of the Gemini API with the structured gameplay of a classic D&D experience.

The core philosophy is a **separation of powers**:
1.  **Game Engine (The Source of Truth):** The core game logic—combat, inventory, quests, character progression—is managed by a centralized **Zustand store**. These systems are coded, deterministic, and function independently of the AI.
2.  **AI (The Narrator):** The Gemini API acts as an intelligent "skin" over the game engine. Its role is to *interpret* and *narrate* events, bring the world to life, and assume the persona of NPCs. The AI does not control the game; it tells its story.

This separation ensures the gameplay loop remains predictable and reliable, while the AI has the freedom to create a rich, dynamic narrative layer.

## 2. Project Structure

The structure is designed for modularity and a clear separation of concerns, with the store at its heart.

```
/src
|-- /components       # React components, organized by feature
|-- /contexts         # Lightweight contexts for UI, sound, and notifications
|-- /data             # Static game data (items, maps, NPCs, quests, etc.)
|-- /store            # Zustand state management
|   |-- combatSlice.ts
|   |-- playerSlice.ts
|   |-- ... (other slices)
|   `-- useGameStore.ts # The main, combined store
|-- /utils            # Helper functions (API calls, calculations)
`-- types.ts          # Global TypeScript type definitions
```

## 3. Core Concepts: The Zustand Architecture

The application's state and logic are managed by a single, central Zustand store, which replaces the previous complex system of multiple React Contexts and manager hooks.

### The Central Store (`useGameStore.ts`)

-   This file is the heart of the application. It uses Zustand's `create` function to build a single store.
-   It imports `create...Slice` functions from all the slice files and combines them into one state object.
-   All game state and all functions that modify that state are co-located here.

### State Slices (`/src/store/*.ts`)

-   To keep the main store file clean, logic is broken down into modular "slices".
-   Each slice is a function that returns an object containing a piece of the state and the functions (actions)) that operate on it.
-   Examples:
    -   `playerSlice.ts`: Manages `playerState` and actions like `handleUpdateQuestStatus` and `handleTakeLongRest`.
    -   `combatSlice.ts`: Manages `combatState` and all combat-related actions like `handleStartCombat` and `endPlayerTurn`.
    -   `inventorySlice.ts`: Manages the party's shared `stash` and actions like `handleAddItemToInventory` and `handleEquipItem`.

### Accessing State & Actions

-   **The Wrong Way:** Directly importing `useGameStore` into every component and selecting state with `useGameStore(state => state.someValue)`. This creates tight coupling and can lead to performance issues.
-   **The Right Way (`GameContext.tsx`):** We use a hybrid approach for clean architecture and optimal performance.
    -   The `GameContext.tsx` file defines a series of custom hooks, one for each major area of the game (e.g., `usePlayer`, `useCombat`, `useInventory`).
    -   These hooks are **not** React Contexts anymore. They are simply collections of granular selectors for the `useGameStore`.
    -   For example, `usePlayer` returns an object where each value is a separate `useGameStore` call:
        ```javascript
        export const usePlayer = () => ({
            party: useGameStore(state => state.playerState.party),
            wealth: useGameStore(state => state.playerState.wealth),
            handleUpdateQuestStatus: useGameStore(state => state.handleUpdateQuestStatus),
            // ...etc
        });
        ```
    -   This ensures that a component re-renders *only* when the specific piece of state it needs changes, preventing the "Maximum update depth exceeded" errors seen with the old architecture.

### Side-Effects & Initialization

-   Some actions need to trigger side-effects that live within the React tree (e.g., showing a notification, playing a sound).
-   The `GameProvider` in `GameContext.tsx` is a lightweight component that, on mount, calls an `initializeActions` function in the Zustand store.
-   It passes down functions from the `NotificationContext` and `SoundContext`, making them available to any action within the store.

### Persistence

-   The main store is wrapped with Zustand's `persist` middleware.
-   This automatically saves the specified parts of the game state (like `playerState`, `npcs`, `time`, etc.) to `localStorage` on every change.
-   Transient UI state (like `activeNpc` or `isOptionsMenuOpen`) is explicitly excluded from persistence to ensure a clean state upon page load.

### Architecture Diagram

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed dataflow diagram.

## 4. How-To Guides (Cookbook)

For practical, step-by-step instructions on implementing common gameplay features like locked doors, skill checks, and lootable containers, please refer to the dedicated "Cookbook" documentation.

-   **[Read the Cookbook](./cookbook.md)**

---

## 5. AI Integration (Gemini API)

### The Two AI Personas

1.  **The Narrator/DM:** Uses a comprehensive system prompt generated on-the-fly. This prompt includes the full game state, character info, and strict rules. This is the default conversational mode.
2.  **The NPC:** When a conversation starts, the system switches to a much more focused prompt specific to that NPC's personality, goals, and memories.

### System Prompts (`promptBuilder.ts`)

-   The main store (`useGameStore.ts`) dynamically builds prompts via selector functions (`buildNarratorPrompt`, `buildNpcPrompt`) defined in `src/store/promptBuilder.ts`.
-   These functions assemble the prompts by pulling real-time data from the store state (location, quests, party, etc.) and combining it with static rule definitions from `data/promptComponents.ts`.

### NPC Memory System

-   NPCs have a `NpcBrain` data structure managed in `npcBrainsSlice.ts` to maintain conversational continuity.
-   The AI is instructed to use the `updateNpcMemory` tool at the end of a meaningful conversation to create a `Memory` object.
-   This memory is then injected back into the NPC's prompt for future interactions, allowing them to "remember" past events.

### Detailed List of Tool Calls

The AI can *only* affect the game state via tool calls. The implementation of these functions resides within the relevant store slices. The full list of `FunctionDeclaration` objects is in `components/core/GameScreen.tsx`.

A key tool is `inspectObject`, which has dual functionality:
-   If the inspected object has an `imageUrl` defined in its data, it will trigger the `InspectWindow` UI overlay for visual interaction.
-   If it does not have an `imageUrl`, it returns the object's `description` string, which the AI is expected to narrate. It may also trigger another tool call if an `onInspect` action is defined.

## 6. Key Systems

### Combat System (`combatSlice.ts`)

-   **Grid-based & Turn-based:** Managed within `combatSlice.ts` and rendered by `TacticalGrid.tsx`.
-   **Grid Specifications:**
    -   **Dimensions:** 64 columns x 36 rows (16:9 Aspect Ratio).
    -   **Scale:** ~3.75ft per square.
-   **Action Points (AP) Economy:**
    -   **Max AP:** 6 per turn.
    -   **Movement:** 1 AP per square.
    -   **Standard Attack / Cantrip:** 3 AP.
    -   **Leveled Spell:** 4 AP.
    -   **Bonus Action / Item / Rage:** 2 AP.
    -   **Defend:** 3 AP.
-   **NPC AI:** The `executeNpcTurn` action in `combatSlice.ts` contains the simple, rule-based logic for enemy turns.

### Level Up System (`LevelUpScreen.tsx`)

-   `playerSlice.ts` detects when a character has enough XP and triggers the level up UI by updating `levelUpState` in `uiSlice.ts`.
-   Progression data is defined in `data/classProgressionData.ts`.
-   `handleFinalizeLevelUp` in `playerSlice.ts` applies the permanent changes.

### Inventory & Items (`inventorySlice.ts`)

-   **Shared Stash:** The party uses a single shared inventory: `playerState.stash`.
-   **Unique IDs:** Every item instance has a unique `id` (UUID), while `itemId` refers to the template in `masterItemList`.
-   **Equipment:** The `equipment` object on a `PartyMember` stores the unique `id` of the equipped item.
-   **Tool Slots:** The inventory system includes 4 dedicated slots (`TOOL1` - `TOOL4`) for non-combat utility items like Thieves' Tools.
-   **Tool Usage:** Tools must be **equipped** in a tool slot to be active. Simply having them in the stash is not sufficient for performing skill checks (like opening locks).

### Companion System (`data/companionData.ts`)

-   Recruitable companions are defined as full `PlayerCharacter` objects in `data/companionData.ts`.
-   The `recruitCompanion` action in `npcSlice.ts` uses a factory function (`createCompanionPartyMember`) to create a new `PartyMember` object, add their gear to the stash, and add them to the party.

### Quest System

-   Quest states are tracked in `playerState.quests`.
-   `updateQuestStatus` in `playerSlice.ts` is the sole function for changing quest states. Rewards are automatically granted upon completion.

### Skill Checks & Interactions

-   **InspectWindow:** Interactions with specific objects (like locked doors) are handled via the `InspectWindow` UI component.
-   **Multi-Character Support:**
    -   The `InspectWindow` features a character selector, allowing the player to choose which party member performs the action.
    -   This selection passes the correct `characterId` to the underlying tool call (e.g., `attemptSleightOfHandOnObject`).
-   **Validation:** The store action verifies that the *selected* character has the required proficiency, stats, and **equipped** tools before allowing the attempt or calculating the dice roll DC.

### Map & Navigation System

-   **Multi-Map Support:** The world is divided into distinct map regions (e.g., `stonefall_town`, `whispering_woods`).
-   **Seamless Travel:** `handleLocationChange` manages transitions between locations within a map and transitions between different maps, ensuring the correct background image and location data are loaded.

### Audio Subsystem (Audio Slice)

-   **Purpose:** Centralizes audio state and playback into a Zustand `audioSlice` so the rest of the codebase can call `get().playSound`, `get().setBusVolume`, or use streaming helpers without importing `AudioEngine` or the `AudioContext` directly.
-   **Where it lives:** `src/store/audioSlice.ts` and is composed into the main store in `src/store/useGameStore.ts`.
-   **Key state:** `masterVolume`, `musicVolume`, `ambienceVolume`, `sfxVolume`.
-   **Key actions:** `setMasterVolume`, `setMusicVolume`, `setAmbienceVolume`, `setSfxVolume`, `playSound(soundId)`, `playMusicStream(el)`, `stopMusicStream(el)`, `playAmbienceStream(el)`, `stopAmbienceStream(el)`, `setBusVolume(bus, value)`, `duckMusic`, `unduckMusic`, `userInteracted`.
-   **Compatibility wrapper:** The slice lazily instantiates the existing `AudioEngine` (`utils/AudioEngine.ts`) and calls `AudioEngine` methods when available. If the engine or decoded buffers are not available it falls back to basic HTMLAudio playback using the `public/assets/catalog.json` mapping.
-   **Migration notes:** Existing code that previously called `get()._actions.setBusVolume(...)` or `get()._actions.playSound(...)` will keep working. The long-term plan is to migrate all audio-related side-effects to call `get().playSound(...)` or the streaming helpers directly and remove direct `AudioEngine` usage from components.

#### Available sounds (catalog)

The audio assets are listed in `public/assets/catalog.json`. Key sound IDs available to call via `playSound(id)` include:

-   miss
-   spell_cast
-   sword_slash
-   dice_roll
-   failure
-   falling_coin
-   level_up
-   open_chest
-   quest_complete
-   quest_new
-   receive_item
-   receive_xp
-   success
-   use_consumable
-   wooden_door_opens_slow
-   close_model
-   open_model
-   ui_click
-   rain_heavy
-   rain_light
-   wind_gentle
-   wind_stormy

Music tracks:

-   tavern_ambiance
-   combat_theme

For any sound ID above, call `get().playSound('dice_roll')` (or via a `useGameStore` selector) to play it. Streaming music/ambience should use an `HTMLAudioElement` and `get().playMusicStream(el)` / `get().playAmbienceStream(el)` so `AudioEngine` can connect the element into the right audio bus.

## 7. UI & Components

### Philosophy

-   **Component-Driven:** UI is built from small, reusable components.
-   **Zustand Selectors:** All game-related components consume state via the custom hooks in `GameContext.tsx`, which select data from the central `useGameStore`.

### Key Components

-   `GameScreen.tsx`: The main layout container.
-   `PartySheet.tsx`: Left panel displaying the active character's stats.
-   `WorldPanel.tsx`: Right panel with mini-map and logs.
-   **Central Panel:** The middle section that dynamically shows the `MapView`, `TacticalGrid`, `InventoryScreen`, etc.

### Overlays & Modals

-   All overlay components are rendered centrally in `components/core/Overlays.tsx`.
-   Their visibility is controlled by boolean flags or object state in the `uiSlice` of the Zustand store (e.g., `isOptionsMenuOpen`, `activeNpc`).
-   **Key Overlays:**
    -   `DiceResultWindow.tsx`: A new modal that displays the outcome of non-combat skill checks (`d20 + bonus vs DC`), pausing the game until the user continues.
    -   `LootScreen.tsx`: A new UI for interacting with containers. It displays items and coins and allows the player to take them.
    -   `InspectWindow.tsx`: An overlay that appears when an `inspectable` object with an `imageUrl` is triggered, allowing for visual point-and-click interaction with secrets.

## 8. Debugging the AI

### Troubleshooting Failed Tool Calls

1.  **Console Logs:** The `handleToolCall` function in `useGameStore.ts` logs all incoming calls. Check if the call is being made.
2.  **Prompt Rules:** The most likely cause is a vague rule in `data/promptComponents.ts`. Use forceful language like "You MUST call..."
3.  **Function Parameters:** Check that the AI is providing correct parameters. The action implementation in the relevant slice should return a clear error string if parameters are missing.
4.  **Result Narration:** Ensure the AI is instructed to interpret the 'result' string from a tool call. If a tool returns "Error: Player is too encumbered," the AI must narrate that failure.

## 9. Asset Pipeline & Sprite Sheets

To optimize performance and reduce the number of HTTP requests, Project Chimera uses sprite sheets for item icons. Instead of loading individual image files for every item, the application loads a few large images (one per ItemType) and uses CSS `background-position` to display the correct icon.

### Sprite Sheet Configuration
-   **Resolution:** 2560x2560 pixels.
-   **Grid:** 10x10 (100 items max per sheet).
-   **Cell Size:** 256x256 pixels.

### Sprite Indices

The `spriteIndex` property in `Item` definitions corresponds to the 0-based index on the sheet, reading left-to-right, top-to-bottom.

================================================================================
PROJECT CHIMERA: ITEM SPRITE INDEX
================================================================================
Grid Size: 10x10 (100 items per sheet)
Resolution: 1024x1024px (102.4px per cell)

--------------------------------------------------------------------------------
WEAPON SHEET (ItemType.WEAPON)
--------------------------------------------------------------------------------
## Sprite Placement Guide:
## For each base item, allocate 4 consecutive sprite cells:
## Cell N: Base Item Artwork
## Cell N+1: +1 Variant Artwork
## Cell N+2: +2 Variant Artwork
## Cell N+3: +3 Variant Artwork
## (Note: Some specific magic items may break this pattern if they are not variants.)

00  short_sword
01  short_sword-1
02  short_sword-2
03  short_sword-3
04  dagger
05  dagger-1
06  dagger-2
07  dagger-3
08  mace
09  mace-1
10  mace-2
11  mace-3
12  longsword
13  longsword-1
14  longsword-2
15  longsword-3
16  longsword_plus_one
17  battleaxe
18  battleaxe-1
19  battleaxe-2
20  battleaxe-3
21  greataxe
22  greataxe-1
23  greataxe-2
24  greataxe-3
25  gritstone_greataxe
26  javelin
27  javelin-1
28  javelin-2
29  javelin-3
30  handaxe
31  handaxe-1
32  handaxe-2
33  handaxe-3
34  rapier
35  rapier-1
36  rapier-2
37  rapier-3
38  scimitar
39  scimitar-1
40  scimitar-2
41  scimitar-3
42  warhammer
43  warhammer-1
44  warhammer-2
45  warhammer-3
46  quarterstaff
47  quarterstaff-1
48  quarterstaff-2
49  quarterstaff-3
50  shortbow
51  shortbow-1
52  shortbow-2
53  shortbow-3
54  longbow
55  longbow-1
56  longbow-2
57  longbow-3
58  light_crossbow
59  light_crossbow-1
60  light_crossbow-2
61  light_crossbow-3
62  heavy_crossbow
63  heavy_crossbow-1
64  heavy_crossbow-2
65  heavy_crossbow-3
66  sling
67  sling-1
68  sling-2
69  sling-3
70  greatsword
71  greatsword-1
72  greatsword-2
73  greatsword-3

--------------------------------------------------------------------------------
ARMOR SHEET (ItemType.ARMOR)
--------------------------------------------------------------------------------
## Sprite Placement Guide:
## For each base item, allocate 4 consecutive sprite cells:
## Cell N: Base Item Artwork
## Cell N+1: +1 Variant Artwork
## Cell N+2: +2 Variant Artwork
## Cell N+3: +3 Variant Artwork
## (Note: Some specific magic items may break this pattern if they are not variants.)

00  padded_armor
01  padded_armor-1
02  padded_armor-2
03  padded_armor-3
04  leather_armor
05  leather_armor-1
06  leather_armor-2
07  leather_armor-3
08  studded_leather_armor
09  studded_leather_armor-1
10  studded_leather_armor-2
11  studded_leather_armor-3
12  hide_armor
13  hide_armor-1
14  hide_armor-2
15  hide_armor-3
16  chain_shirt
17  chain_shirt-1
18  chain_shirt-2
19  chain_shirt-3
20  scale_mail
21  scale_mail-1
22  scale_mail-2
23  scale_mail-3
24  breastplate
25  breastplate-1
26  breastplate-2
27  breastplate-3
28  half_plate_armor
29  half_plate_armor-1
30  half_plate_armor-2
31  half_plate_armor-3
32  ring_mail
33  ring_mail-1
34  ring_mail-2
35  ring_mail-3
36  chain_mail
37  chain_mail-1
38  chain_mail-2
39  chain_mail-3
40  splint_armor
41  splint_armor-1
42  splint_armor-2
43  splint_armor-3
44  plate_armor
45  plate_armor-1
46  plate_armor-2
47  plate_armor-3
48  shield
49  shield-1
50  shield-2
51  shield-3
52  boots_of_speed
53  boots_of_elvenkind
54  slippers_of_spider_climbing
55  amulet_of_health
56  vestments
57  vestments-1
58  vestments-2
59  vestments-3

--------------------------------------------------------------------------------
CONSUMABLE SHEET (ItemType.CONSUMABLE)
--------------------------------------------------------------------------------
00  potion-of-healing
01  magic_potion
02  potion_of_strength
03  antidote
04  ration
05  waterskin

--------------------------------------------------------------------------------
MISC SHEET (ItemType.MISC)
--------------------------------------------------------------------------------
00  thieves_tools
01  scholars_pack
02  horse_whistle
03  sailing_boat
04  climbers_kit
05  disguise_kit
06  forgery_kit
07  herbalism_kit
08  healers_kit
09  poisoners_kit
10  dice_set
11  playing_card_set
12  backpack
13  crowbar
14  hammer
15  piton
16  torch
17  tinderbox
18  rope_hempen_50_feet
19  bedroll
20  mess_kit
21  ball_bearings
22  string
23  bell
24  candle
25  hooded_lantern
26  oil_flask
27  blanket
28  component_pouch
29  arcane_focus
30  quill
31  ink_bottle
32  parchment
33  bag_of_sand
34  quiver
35  alms_box
36  block_of_incense
37  censer
38  small_coin_pouch
39  wolf_pelt
40  amethyst
41  sapphire
42  emerald
43  ruby
44  diamond
45  arrow
46  arrow-1
47  arrow-2
48  arrow-3
49  crossbow_bolt
50  crossbow_bolt-1
51  crossbow_bolt-2
52  crossbow_bolt-3
53  sling_bullet
54  sling_bullet-1
55  sling_bullet-2
56  sling_bullet-3
57  alchemists-supplies
58  bagpipes
59  brewers-supplies
60  burglars-pack
61  calligraphers-supplies
62  carpenters-tools
63  carriage
64  cart
65  cartographers-tools
66  chariot
67  climbers-kit
68  cobblers-tools
69  cooks-utensils
70  dice-set
71  diplomats-pack
72  disguise-kit
73  drum
74  dulcimer
75  dungeoneers-pack
76  elephant
77  entertainers-pack
78  explorers-pack
79  flute
80  forgery-kit
81  galley
82  glassblowers-tools
83  healers-kit
84  herbalism-kit
85  horn
86  horse-draft
87  horse-riding
88  jewelers-tools
89  keelboat
90  leatherworkers-tools
91  longship
92  lute
93  lyre
94  masons-tools
95  mastiff
96  mess-kit
97  mule
98  navigators-tools
99  painters-supplies

--------------------------------------------------------------------------------
QUEST ITEM SHEET (ItemType.QUEST)
--------------------------------------------------------------------------------
00  iron_ingot
01  rusty_key
02  shaft_key

--------------------------------------------------------------------------------
BOOK SHEET (ItemType.BOOK)
--------------------------------------------------------------------------------
00  spellbook
01  book_history_stonefall
02  book_creatures_woods
03  book
--------------------------------------------------------------------------------
MAGIC WEAPONS SHEET (ItemType.WEAPON - Magical)
--------------------------------------------------------------------------------
00  berserker-axe
01  dagger-of-venom
02  dancing-sword
03  javelin-of-lightning
04  mace-of-disruption
05  mace-of-smiting
06  mace-of-terror
07  oathbow
08  sword-of-life-stealing
09  sword-of-sharpness
10  sword-of-wounding
11  trident-of-fish-command
12  vicious-weapon
13  vorpal-sword

--------------------------------------------------------------------------------
MAGIC ARMOR SHEET (ItemType.ARMOR - Magical)
--------------------------------------------------------------------------------
00  adamantine-armor
01  animated-shield
02  armor
03  armor-of-invulnerability
04  armor-of-resistance
05  armor-of-vulnerability
06  arrow-catching-shield
07  demon-armor
08  dragon-scale-mail
09  dwarven-plate
10  elven-chain
11  glamoured-studded-leather-armor
12  mithral-armor
13  plate-armor-of-etherealness
14  shield-of-missile-attraction
15  spellguard-shield
16  dragon-scale-mail-black
17  dragon-scale-mail-blue
18  dragon-scale-mail-brass
19  dragon-scale-mail-bronze
20  dragon-scale-mail-copper
21  dragon-scale-mail-gold
22  dragon-scale-mail-green
23  dragon-scale-mail-red
24  dragon-scale-mail-silver
25  dragon-scale-mail-white
26  ring-of-mind-shielding

--------------------------------------------------------------------------------
MAGIC GEAR SHEET (ItemType.MISC - Magical Gear)
--------------------------------------------------------------------------------
00  defender
01  dragon-slayer
02  dwarven-thrower
03  flame-tongue
04  frost-brand
05  giant-slayer
06  hammer-of-thunderbolts
07  holy-avenger
08  luck-blade
09  nine-lives-stealer
10  scimitar-of-speed
11  sun-blade
12  ring-of-animal-influence
13  ring-of-djinni-summoning
14  ring-of-elemental-command
15  ring-of-elemental-command-air
16  ring-of-elemental-command-earth
17  ring-of-elemental-command-fire
18  ring-of-elemental-command-water
19  ring-of-evasion
20  ring-of-feather-falling
21  ring-of-free-action
22  ring-of-invisibility
23  ring-of-jumping
24  ring-of-protection
25  ring-of-regeneration
26  ring-of-resistance
27  ring-of-resistance-acid
28  ring-of-resistance-cold
29  ring-of-resistance-fire
30  ring-of-resistance-force
31  ring-of-resistance-lightning
32  ring-of-resistance-necrotic
33  ring-of-resistance-poison
34  ring-of-resistance-psychic
35  ring-of-resistance-radiant
36  ring-of-resistance-thunder
37  ring-of-shooting-stars
38  ring-of-spell-storing
39  ring-of-spell-turning
40  ring-of-swimming
41  ring-of-telekinesis
42  ring-of-the-ram
43  ring-of-three-wishes
44  ring-of-warmth
45  ring-of-water-walking
46  ring-of-x-ray-vision
47  robe-of-eyes
48  robe-of-scintillating-colors
49  robe-of-stars
50  robe-of-the-archmagi
51  robe-of-useful-items
52  necklace-of-adaptation
53  necklace-of-fireballs
54  necklace-of-prayer-beads
55  hat-of-disguise
56  headband-of-intellect
57  helm-of-brilliance
58  helm-of-comprehending-languages
59  helm-of-telepathy
60  helm-of-teleportation
61  goggles-of-night
62  gloves-of-missile-snaring
63  gloves-of-swimming-and-climbing

--------------------------------------------------------------------------------
TOOLS & VEHICLES SHEET (ItemType.MISC - Overflow)
--------------------------------------------------------------------------------
00  pan-flute
01  playing-card-set
02  poisoners-kit
03  pony
04  potters-tools
05  priests-pack
06  rowboat
07  sailing-ship
08  scholars-pack
09  shawm
10  sled
11  smiths-tools
12  thieves-tools
13  tinkers-tools
14  viol
15  wagon
16  warhorse
17  warship
18  weavers-tools
19  woodcarvers-tools

--------------------------------------------------------------------------------
MATERIALS_RAW SHEET (Raw Ores, Woods, Beast Parts)
--------------------------------------------------------------------------------
# ORES
00  iron-ore
01  copper-ore
02  tin-ore
03  silver-ore
04  gold-ore
05  mithral-ore
06  adamantine-ore
07  coal
08  obsidian-shard
09  meteorite-ore

# WOODS
10  softwood-log
11  hardwood-log
12  darkwood-log
13  elderwood-log
14  ironwood-log
15  stick
16  yew-branch
17  ash-branch
18  charcoal
19  bark
20  resin

# BEAST PARTS
21  raw-hide
22  wolf-pelt
23  bear-pelt
24  bone-fragment
25  skull
26  beast-fang
27  sharp-claw
28  feather
29  griffin-feather
30  dragon-scale-red
31  dragon-scale-black
32  chitin-plate
33  monster-guts
34  sinew
35  horn
36  troll-blood
37  slime-glob
38  spider-silk

# MISC RAW
39  sand
40  clay
41  rusty-scrap

--------------------------------------------------------------------------------
MATERIALS_REFINED SHEET (Ingots, Planks, Textiles, Arcane)
--------------------------------------------------------------------------------
# INGOTS
00  iron-ingot
01  steel-ingot
02  copper-ingot
03  bronze-ingot
04  silver-ingot
05  gold-ingot
06  mithral-ingot
07  adamantine-ingot
08  darksteel-ingot

# PLANKS
10  softwood-plank
11  hardwood-plank
12  darkwood-plank
13  elderwood-plank

# TEXTILES & LEATHER
20  cured-leather
21  studded-leather-pad
22  leather-straps
23  cotton-boll
24  linen-cloth
25  wool-cloth
26  silk-thread
27  velvet

# ARCANE & GEM
30  glass-shard
31  empty-vial
32  crystal-vial
33  flux
34  wax-seal
35  parchment-sheet
36  enchanted-ink
37  arcane-dust
38  void-essence
39  soul-gem-empty
40  soul-gem-filled
41  rune-stone-blank
42  glimmering-shard

--------------------------------------------------------------------------------
COMPONENTS_WEAPON SHEET (Crafting Matrix Components)
--------------------------------------------------------------------------------
# BLADES
00  iron-blade-straight
01  steel-blade-straight
02  mithral-blade-straight
03  adamantine-blade-straight
04  iron-blade-heavy
05  steel-blade-heavy
06  mithral-blade-heavy
07  adamantine-blade-heavy
08  iron-blade-dagger
09  steel-blade-dagger

# GUARDS
10  iron-guard-cross
11  steel-guard-cross
12  mithral-guard-cross
13  adamantine-guard

# GRIPS & HAFTS
20  wood-grip-straight
21  wood-grip-curved
22  leather-wrapped-grip
23  wood-haft-short
24  wood-haft-long

# POMMELS
30  iron-pommel
31  steel-pommel
32  mithral-pommel

# MISC PARTS
40  weapon-hilt-mold
41  buckle
42  fletching-kit
43  grindstone

--------------------------------------------------------------------------------
ALCHEMY_FOOD SHEET (Herbs, Potions, Food)
--------------------------------------------------------------------------------
# HERBS
00  kingsfoil
01  peacebloom
02  silverleaf
03  earthroot
04  bloodroot
05  mandrake-root
06  nightshade
07  wolfsbane
08  firebloom
09  sungrass
10  blindweed
11  ghost-mushroom
12  cave-moss
13  black-lotus

# REAGENTS
20  distilled-water
21  alcohol
22  oil
23  beeswax
24  sulfur
25  salt
26  mercury
27  herbal-paste

# FOODS
30  raw-meat
31  cooked-meat
32  bread
33  cheese
34  apple
35  root-vegetable
36  hearty-stew
37  fish-raw
38  fish-cooked
39  dried-ration

## 10. SVG Icon System (UI & Actions)

While the item system uses sprite sheets for richness, the game UI and functional actions use a **Custom SVG Icon System**. This ensures that UI elements (gold coins, crowns, dice) remain crisp at any resolution (4K support).

### Key Features
- **Performance**: Icons are stored as raw path strings, reducing DOM nodes.
- **Normalization**: Automatically handles naming variations (e.g., `gold-coin` vs `gold_coin`).
- **Fallbacks**: Built-in logic to provide similar icons if an exact match is missing, preventing UI "empty spots".

### Usage
```tsx
import { Icon } from '@/assets/icons';

// Simple usage
<Icon name="crown" size={32} />

// Detailed usage with Tailwind
<Icon name="gold-coin" className="text-amber-500 drop-shadow-md" />
```

For a full list of available icons and the registry structure, see **[IconSystemMainGame.md](./IconSystemMainGame.md)**.
