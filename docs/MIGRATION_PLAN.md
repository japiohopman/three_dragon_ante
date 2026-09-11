# 🚚 TDA Minigame Embedding & Migration Specification

## 1. Executive Summary & Purpose
This document provides the canonical, zero-regression step-by-step migration specification for embedding **The Dragon's Flagon: Three-Dragon Ante (TDA)** minigame engine from this repository into the host [`artificer`](https://github.com/japiohopman/artificer) (Arcane Codex) application.

It builds upon the architectural boundary defined in `docs/ARTIFICER_INTEGRATION.md` and the visual layout specs in `docs/ARTIFICER_LAYOUT_ANALYSIS.md`.

---

## 2. Directory Mapping & File Migration Index

When transferring the TDA engine into `artificer`, copy files into the dedicated `src/components/minigames/tda/` directory structure within the host codebase:

```
three_dragon_ante /                         artificer /
├── src/                                    ├── src/
│   ├── components/minigames/tda/  ───────> │   ├── components/minigames/tda/
│   │   ├── Card.tsx                        │   │   ├── Card.tsx
│   │   ├── GameUI.tsx                      │   │   ├── GameUI.tsx
│   │   ├── TableTop.tsx                    │   │   ├── TableTop.tsx
│   │   ├── RulebookModal.tsx               │   │   ├── RulebookModal.tsx
│   │   ├── table/                          │   │   ├── table/
│   │   │   ├── Battleground.tsx            │   │   │   ├── Battleground.tsx
│   │   │   ├── MultiplayerSeats.tsx        │   │   │   ├── MultiplayerSeats.tsx
│   │   │   ├── OpponentInspectorDrawer.tsx │   │   │   ├── OpponentInspectorDrawer.tsx
│   │   │   ├── PileBrowserModal.tsx        │   │   │   ├── PileBrowserModal.tsx
│   │   │   ├── PlayerHandArea.tsx          │   │   │   ├── PlayerHandArea.tsx
│   │   │   ├── TavernLeftAside.tsx         │   │   │   ├── TavernLeftAside.tsx
│   │   │   └── TavernRightAside.tsx        │   │   │   └── TavernRightAside.tsx
│   │   └── ui/                             │   │   └── ui/
│   │       ├── CurrencyDisplay.tsx         │   │       ├── CurrencyDisplay.tsx
│   │       ├── EndGameModal.tsx            │   │       ├── EndGameModal.tsx
│   │       ├── FocusOverlay.tsx            │   │       ├── FocusOverlay.tsx
│   │       ├── HeaderHUD.tsx               │   │       ├── HeaderHUD.tsx
│   │       ├── InteractionModal.tsx        │   │       ├── InteractionModal.tsx
│   │       ├── LobbyScreen.tsx             │   │       ├── LobbyScreen.tsx
│   │       └── NotificationBanner.tsx      │   │       └── NotificationBanner.tsx
│   ├── components/VFXLayer.tsx   ───────>  │   ├── components/minigames/tda/VFXLayer.tsx
│   ├── store/                              │   ├── store/minigames/tda/
│   │   ├── useGameStore.ts       ───────>  │   │   ├── useGameStore.ts
│   │   ├── useAnimationStore.ts  ───────>  │   │   ├── useAnimationStore.ts
│   │   └── slices/               ───────>  │   │   └── slices/
│   ├── utils/                              │   ├── utils/minigames/tda/
│   │   ├── cardLogic.ts          ───────>  │   │   ├── cardLogic.ts
│   │   ├── currency.ts           ───────>  │   │   ├── currency.ts
│   │   └── npcConstants.ts       ───────>  │   │   └── npcConstants.ts
│   ├── types.ts                  ───────>  │   ├── types/tda.ts
│   └── constants/npcLines.ts     ───────>  │   └── constants/minigames/tda/npcLines.ts
└── public/                                 └── public/
    ├── assets/atlas/                        ├── assets/atlas/
    │   └── enhanced_tiamat.webp  ───────>  │   └── enhanced_tiamat.webp
    └── assets/icons/svg/                   └── assets/icons/svg/
        └── currency/             ───────>      └── currency/
```

---

## 3. Host Dependencies Checklist

Ensure the host `artificer/package.json` contains the required runtime dependencies:

```json
{
  "dependencies": {
    "zustand": "4.5.2",
    "motion": "^12.38.0",
    "howler": "^2.2.4",
    "lucide-react": "0.263.1",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
```

*Note: If `artificer` uses Framer Motion (`framer-motion`) instead of `motion`, update imports in `Card.tsx`, `TableTop.tsx`, `OpponentInspectorDrawer.tsx`, and `VFXLayer.tsx` from `motion/react` to `framer-motion`.*

---

## 4. State Store Isolation & Scoping

To avoid state collisions between `artificer`'s global state (e.g. character sheet, inventory) and TDA's game state:

1. **Dedicated Store Slices**: Place TDA store files under `src/store/minigames/tda/`.
2. **Reset on Unmount**: Expose a `resetGame()` action in `gameSetupSlice.ts` or `useGameStore.ts` that clears active rounds, player hands, and scores upon exiting the minigame table.
3. **Transient VFX Store**: `useAnimationStore` should remain isolated within TDA to prevent coin particle or screen shake events from affecting host UI.

---

## 5. Host Event & Component Contract (`TDAMinigameProps`)

Create a host wrapper component at `src/components/minigames/tda/TDAMinigame.tsx`:

```tsx
import React, { useEffect } from 'react';
import { useGameStore } from '../../../store/minigames/tda/useGameStore';
import GameUI from './GameUI';
import TableTop from './TableTop';
import VFXLayer from './VFXLayer';

export interface TDAMinigameProps {
  /** Initial human player gold balance from host character sheet (in copper or GP) */
  playerGold?: number;
  /** Primary opponent patron ID injected from Artificer tavern node */
  opponentNpcId?: string;
  /** Callback fired when match finishes (victory or defeat) with final gold delta */
  onGameOver?: (result: { winnerId: string; finalGold: number; goldDelta: number }) => void;
  /** Callback fired when player clicks 'Exit Table' button */
  onExit?: () => void;
  /** Optional audio adapter callback */
  onPlaySound?: (soundName: string) => void;
}

export const TDAMinigame: React.FC<TDAMinigameProps> = ({
  playerGold,
  opponentNpcId,
  onGameOver,
  onExit,
}) => {
  const initMatch = useGameStore((state) => state.initMatch);
  const resetGame = useGameStore((state) => state.resetGame);

  useEffect(() => {
    // Initialize TDA match with player gold from host character sheet
    if (playerGold !== undefined || opponentNpcId) {
      initMatch({
        humanGold: playerGold,
        opponentId: opponentNpcId,
      });
    }

    return () => {
      resetGame();
    };
  }, [playerGold, opponentNpcId, initMatch, resetGame]);

  return (
    <div className="w-full h-full relative bg-stone-950 overflow-hidden wood-texture select-none">
      <VFXLayer />
      <GameUI onExit={onExit} onGameOver={onGameOver} />
      <div className="w-full h-full flex items-center justify-center">
        <TableTop />
      </div>
    </div>
  );
};

export default TDAMinigame;
```

---

## 6. Static Asset Bundle Paths

Verify that the static assets are accessible in `artificer/public/`:

1. **Card Atlas**: `public/assets/atlas/enhanced_tiamat.webp` (5x5 matrix for 25 TDA dragon & mortal cards).
2. **D&D Currency Icons**: `public/assets/icons/svg/currency/` containing `cp.svg`, `sp.svg`, `ep.svg`, `gp.svg`, `pp.svg`.
3. **Solo SVG Icons**: `public/assets/icons/svg/` registry consumed by `GameIcon` component.
4. **NPC Matrix Images**: Remote or local paths mapped in `npcConstants.ts`.

---

## 7. Migration Step-by-Step Execution Checklist

When executing the migration into `artificer`, complete the following steps in order:

- [x] **Step 1: Create Host Integration Wrapper (`TDAMinigame.tsx`)**
  - Implemented `TDAMinigame.tsx` host integration wrapper and export module `src/components/minigames/tda/index.ts`.
- [x] **Step 2: Implement Store Initialization (`initMatch`) & Integration Tests**
  - Added `initMatch` to `gameSetupSlice.ts` to accept `TDAMinigameProps` (`playerGold`, `opponentNpcId`, etc.) and verified with unit tests in `TDAMinigame.test.tsx`.
- [ ] **Step 3: Copy Source Files to `artificer/src/`**
  - Transfer `components/minigames/tda/`, `store/`, `utils/cardLogic.ts`, `utils/currency.ts`, and `constants/npcLines.ts` into `artificer/src/` upon host integration dispatch.
- [ ] **Step 4: Transfer Static Assets to `artificer/public/`**
  - Copy `public/assets/atlas/enhanced_tiamat.webp` and `public/assets/icons/svg/currency/` into `artificer/public/`.
- [ ] **Step 5: Mount `<TDAMinigame />` in Host Application**
  - Register `<TDAMinigame />` in Artificer's Tavern / Minigame routing view or tavern modal overlay.
- [ ] **Step 6: Verify Integration in Host Application**
  - Run `npm run lint`, `npm test`, and `npm run dev` in `artificer` to test TDA gameplay, gold synchronization, and exit triggers.
