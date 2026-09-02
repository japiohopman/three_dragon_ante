# 🔮 Artificer Integration Boundary — Three-Dragon Ante (TDA) Engine

## 1. Overview & Purpose
This document defines the architectural integration boundary for embedding **The Dragon's Flagon: Three-Dragon Ante (TDA)** minigame engine into a host application (such as the main [`artificer`](https://github.com/japiohopman/artificer) / Arcane Codex repository).

The goal of this boundary definition is to delineate:
- **Core TDA Engine**: Pure card game state, rule evaluation, flight resolution, and UI rendering modules that can be imported and mounted by a host container.
- **Host Application Shell**: Container logic, app-level routing, audio orchestration, tavern patron selection, and server-side AI/GitHub integrations.
- **Integration Contracts & Stubs**: Interface requirements and adapters for hosting TDA inside another React environment.

---

## 2. Architecture & Boundary Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            HOST CONTAINER (Artificer)                       │
│                                                                             │
│  ┌────────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ Character Sheet / Vault│  │  Host Sound System  │  │  Host Navigation │  │
│  └───────────┬────────────┘  └──────────┬──────────┘  └────────┬─────────┘  │
└──────────────│──────────────────────────│──────────────────────│────────────┘
               │                          │                      │
===============│==========================│======================│=============
               ▼                          ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TDA ENGINE BOUNDARY                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ UI Layer: <GameUI />, <TableTop />, <Card />, Subcomponents           │  │
│  └────────────────图─────────────────┬───────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────┴────────────────────────────────────┐  │
│  │ State Engine: useGameStore (slices: ante, turn, round, effect, etc.)   │  │
│  │               useAnimationStore (VFX particle/shake states)           │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────┴────────────────────────────────────┐  │
│  │ Pure Logic & Rules: utils/cardLogic.ts, utils/currency.ts, types.ts   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Engine Manifest (Files & Exports)

The following files constitute the **Core TDA Engine** and are required when embedding TDA in a host app:

### A. UI Components (`src/components/minigames/tda/`)
- **`GameUI.tsx`**: Primary HUD layer controlling header scores, turn banners, end-game modals, and interaction prompts.
- **`TableTop.tsx`**: Main 3D physical table view managing board layouts, coin drop VFX, and player card slots.
- **`Card.tsx`**: 3D card component handling sprite atlas mapping, flip animations, and hover/drag effects.
- **`RulebookModal.tsx`**: In-game reference rulebook modal.
- **`table/`**: Table layout subcomponents:
  - `Battleground.tsx`: Active flights and played card stacks.
  - `PlayerHandArea.tsx`: Interactive player hand slots and capacity warnings.
  - `MultiplayerSeats.tsx`: Multi-opponent seating layout (1 human + up to 5 AI opponents).
  - `TavernLeftAside.tsx` & `TavernRightAside.tsx`: Opponent speech and stats panels.
  - `OpponentInspectorDrawer.tsx`: Detailed opponent inspection panel.
  - `PileBrowserModal.tsx`: Deck and discard pile browser.
- **`ui/`**: Modal & HUD subcomponents:
  - `HeaderHUD.tsx`, `NotificationBanner.tsx`, `LobbyScreen.tsx`, `InteractionModal.tsx`, `FocusOverlay.tsx`, `EndGameModal.tsx`.

### B. State Engine (`src/store/`)
- **`useGameStore.ts`**: Unified Zustand store composition.
- **`slices/`**: Modularized state slices:
  - `gameSetupSlice.ts`: Match initialization (players, hands, skills).
  - `anteSlice.ts`: Ante selection and reveal handling.
  - `turnSlice.ts`: Turn progression, leader selection, pass/play logic.
  - `roundSlice.ts`: Round scoring, flight resolution (Color & Strength flights).
  - `effectSlice.ts`: Special card power evaluation and execution.
  - `economySlice.ts`: Pot and player gold transactions.
  - `interactionSlice.ts`: Player/AI prompt resolutions (e.g., Green Dragon choices).
  - `uiSlice.ts`: Inspection, notifications, and modal triggers.
  - `types.ts` & `helpers.ts`: Slice type contracts and state initialization helpers.
- **`useAnimationStore.ts`**: Transient UI animation state (screen shake, coin particles).

### C. Logic, Currency & Domain Types (`src/utils/` & `src/`)
- **`src/utils/cardLogic.ts`**: Pure functions for deck initialization, flight score evaluation, special dragon card powers, and atlas sprite coordinates (`getSpritePosition`).
- **`src/utils/currency.ts`**: D&D 5e currency conversion (`Money` interface, copper/gold calculations, formatted currency strings).
- **`src/types.ts`**: Core TypeScript definitions (`CardData`, `BoardCard`, `PlayerState`, `GamePhase`, `GameEffect`, `InteractionRequest`, `NPCEmotion`).

---

## 4. Host Application Shell & Non-Engine Systems

The following files belong to **this repository's standalone host shell** and are not required by the core engine (or should be supplied/configured by the host application):

- **Routing & Shell Layout (`src/App.tsx`)**:
  - Landing screen ("Enter the Tavern"), mode switcher (`showcase`, `tda`, `memory`, `solitaire`, `forge`), background vignette, ambient lighting overlay.
- **Other Minigames**:
  - `MemoryGame.tsx`, `SolitaireGame.tsx` (standalone tavern games).
- **NPC Selection & Forge UI (`src/components/NPCShowcase.tsx`, `ArtificerForge.tsx`)**:
  - Tavern patron carousel, AI patron generation form.
- **Audio Infrastructure (`src/services/soundService.ts`, `src/store/useAudioStore.ts`, `src/components/AudioManager.tsx`, `src/components/audio/Mixer.tsx`)**:
  - Global Howler-based audio player and track mixer.

---

## 5. Host Dependencies & Integration Contracts

A host app embedding TDA must provide or stub the following dependencies:

### A. Asset Pipeline Dependencies
1. **Card Sprite Atlas**:
   - WebP image atlas (`enhanced_tiamat.webp`, 5x5 grid of 25 cards).
   - Hosted at `public/assets/atlas/` or loaded via remote URL specified in `src/utils/constants.ts`.
2. **Fonts**:
   - `Cinzel` (Gothic headers and card names).
   - `UnifrakturCook` (Fantasy numbers and strength badges).
3. **Tailwind CSS & Animations**:
   - Global Tailwind configuration including keyframes (`@keyframes coin-fly`, `@keyframes shake`).

### B. Audio Adapter Contract
The TDA engine triggers audio via `playSound(soundName)` in `src/services/soundService.ts`.
A host app can either:
- Include `soundService.ts` and ensure audio assets are accessible at the configured path/URL.
- Pass a custom `AudioAdapter` callback interface to intercept sound events (e.g., `onPlaySound(effectName)`).

### C. AI / Gemini Dialogue Endpoints (Optional / Fallback)
- **Hard Dependency**: None for offline core card gameplay.
- **Dynamic Dialogue Feature**: Uses `/api/tda/chat` (or `server.ts` Express proxies) requiring `GEMINI_API_KEY`.
- **Fallback**: If Gemini API is offline or unconfigured, TDA automatically falls back to local persona seeds in `src/constants/npcLines.ts`.

### D. GitHub Guild Vault Endpoints (Optional)
- Uses `/api/artificer/push-to-vault` requiring `GITHUB_TOKEN`, `REPO_OWNER`, and `REPO_NAME`.
- Only needed for the Artificer Forge patron export feature, completely isolated from the TDA card engine.

---

## 6. Proposed Target Embedding API

When `artificer` is ready to host TDA as a minigame, the integration boundary can be exposed as a single React component wrapper:

```typescript
// Proposed Host Integration Contract
export interface TDAMinigameProps {
  /** Initial human player gold balance from host character sheet */
  playerGold?: number;
  /** Opponent configuration (1 to 5 AI patrons) */
  opponents?: Array<{
    id: string;
    name: string;
    gold: number;
    archetype?: string;
  }>;
  /** Callback fired when match finishes (victory or defeat) */
  onGameOver?: (result: { winnerId: string; finalGold: number }) => void;
  /** Callback fired when player clicks 'Exit Table' */
  onExit?: () => void;
  /** Optional audio adapter to redirect SFX/BGM to host sound engine */
  audioAdapter?: {
    playSound: (soundName: string) => void;
  };
}

export const TDAMinigame: React.FC<TDAMinigameProps> = (props) => {
  // Encapsulates useGameStore initialization and renders GameUI + TableTop
};
```
