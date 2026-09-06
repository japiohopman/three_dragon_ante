# 📐 Artificer Layout Analysis & Deep Understanding

## 1. Executive Summary & Overview

Embedding **The Dragon's Flagon: Three-Dragon Ante (TDA)** into the main [`artificer`](https://github.com/japiohopman/artificer) (Arcane Codex) application requires complete layout, theme, and component alignment.

The main Artificer application uses a dark fantasy D&D aesthetic, combining a responsive 16:9 tactical container grid, floating navigation dock, high-contrast typography, and strict z-index modal stacking. This document details Artificer's container layout architecture, CSS variable tokens, sidebar dock dimensions, z-index layering hierarchy, and the exact target mount point for embedding the TDA minigame engine.

---

## 2. Container Grid & Viewport Architecture

Artificer employs a hybrid viewport grid system designed to support both full-screen tactical views (such as overworld maps and tabletop games) and structured content panes (such as character sheets, vaults, and spellbooks).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VIEWPORT CONTAINER (100vw x 100vh)              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TOP HEADER HUD (Height: 56px / 64px | z-100)                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐ ┌───────────────────────────────────────┐ ┌────────────┐  │
│  │ LEFT DOCK /  │ │ CENTRAL TACTICAL / MINIGAME STAGE     │ │ RIGHT DOCK │  │
│  │ SIDEBAR      │ │                                       │ │ / INSPECT  │  │
│  │ (Width:      │ │ Aspect Ratio: 16:9 / Fluid Responsive │ │ (Width:    │  │
│  │ 64px - 320px │ │ Container Grid: Flex/Absolute Center  │ │ 320px -    │  │
│  │ z-100)       │ │ Target Mount: <TDAMinigame />         │ │ 384px)     │  │
│  │              │ │ (z-10 - z-50)                         │ │ (z-130)    │  │
│  └──────────────┘ └───────────────────────────────────────┘ └────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ FLOATING BOTTOM DOCK / PLAYER HAND AREA (Height: 120px - 180px)       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Grid Container Specifications
- **Viewport Outer Bounds**: `100vw` × `100vh` (`w-screen h-screen overflow-hidden relative`).
- **Inner Stage Constraint**: Centered flex container (`flex items-center justify-center`) with optional 16:9 aspect locks (`aspect-[16/9]` or max container `max-w-7xl`).
- **Minigame Overlay Host**: When TDA is mounted, it renders inside a `.minigame-overlay` or direct root container that fills the main tactical stage while preserving navigation dock access or offering an explicit "Exit Table" HUD affordance.

---

## 3. CSS Variable Tokens & Theme Color System

Artificer uses a dark gothic and fantasy color palette built upon Tailwind CSS stone and amber color scales, enhanced with custom CSS keyframes, text shadows, and glowing border tokens.

### A. Color Palette Tokens

| Category | Tailwind Token / Hex | Usage / Application |
| :--- | :--- | :--- |
| **Background Dark Base** | `stone-950` (`#0c0a09`) / `stone-900` (`#1c1917`) | Main viewport background, dark wood textures, overlay backdrops |
| **Parchment Surface** | `stone-800` (`#292524`) / `stone-700` (`#44403c`) | Card backings, modal panel backgrounds, drawer containers |
| **Primary Accent Gold** | `amber-500` (`#f59e0b`) / `amber-400` (`#fbbf24`) | Interactive highlights, active turn borders, gold coin glows |
| **Secondary Accent Amber**| `amber-800` (`#92400e`) / `amber-900` (`#78350f`) | Standard panel borders, scrollbar thumbs, subdued headers |
| **Light Text Gold** | `amber-100` (`#fef3c7`) / `amber-200` (`#fde68a`) | High-priority headers, character names, victory alerts |
| **Muted Text Stone** | `stone-400` (`#a8a29e`) / `stone-300` (`#d6d3d1`) | Subtitles, descriptions, passive card stats, rule text |
| **Combat / Danger Red** | `red-900` (`#7f1d1d`) / `red-950` (`#450a0a`) | Loss alerts, damage floats, negative gold transactions |

### B. Typography Tokens
- **Serif / Title Font**: `Cinzel` (`font-serif`, CSS `font-family: 'Cinzel', serif`). Used for clean headers, player names, and HUD labels.
- **Gothic / Fantasy Numbers**: `UnifrakturCook` (`font-gothic`, CSS `font-family: 'UnifrakturCook', cursive`). Used for high-impact titles ("THE DRAGON'S FLAGON"), dragon strength numbers, and turn banners.
- **Body / Interface**: `Cinzel` / `Inter` fallback for dense UI tables, rulebook text, and inspector stats.

### C. Text Shadow & Glow Tokens
```css
/* Gold Highlighting for Floating Numbers & Headers */
.text-shadow-gold {
  text-shadow: 2px 2px 0px #78350f, -1px -1px 0 #000;
}

/* Red Highlighting for Danger / Loss */
.text-shadow-red {
  text-shadow: 2px 2px 0px #450a0a, -1px -1px 0 #000;
}

/* Standard Drop Shadow */
.text-shadow-black {
  text-shadow: 2px 2px 0px #000;
}
```

---

## 4. Sidebar Dock & Navigation Dimensions

The Artificer layout incorporates side navigation docks and inspect drawers that flank the central tactical stage.

### A. Navigation Dock Dimensions
- **Collapsed Dock Width**: `64px` (`w-16`). Contains icon-only shortcuts for overworld navigation, character sheet, inventory, and audio settings.
- **Expanded Dock Width**: `280px` – `320px` (`w-70` – `w-80`). Displays full patron roster, active party stats, or minigame mode controls.
- **Top HUD Height**: `56px` – `64px` (`h-14` / `h-16`). Houses character gold status, session pot, sound toggle, and exit triggers.

### B. TDA Minigame Dock Integration
To prevent overlap when TDA is active:
- **Left Patron Aside (`TavernLeftAside.tsx`)**: Occupies a left safe area (`w-72` or `w-80`) reserved for active opponent dialogue bubbles and emotion matrices.
- **Right Inspect Drawer (`OpponentInspectorDrawer.tsx`)**: Slides in from `right: 0` with a width of `320px` (`w-80` / `w-96`), constrained under `z-130` so it renders over the table surface but below top modals.
- **Bottom Hand Dock (`PlayerHandArea.tsx`)**: Occupies the bottom `160px` (`h-40`), using dynamic card fan step spacing to ensure hand capacity (up to 10 cards) fits within `100vw`.

---

## 5. Modal Overlays & Z-Index Layer Hierarchy

Artificer enforces a structured z-index stacking order across all modules to ensure modal overlays, card animations, and particle VFX layer deterministically without visual flickering or blocking user interaction.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Z-INDEX STACKING HIERARCHY                            │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ Level         │ Components / Elements                                       │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ z-1000        │ Global Rulebook Modal (<RulebookModal />)                    │
│ z-500         │ Particle VFX Layer (<VFXLayer />, coin drop animations)    │
│ z-200         │ Interaction Modals (Green dragon choices, decision prompts) │
│ z-150         │ Pile Browser Modal (<PileBrowserModal />, deck/discard)      │
│ z-130         │ Opponent Inspector Drawer (<OpponentInspectorDrawer />)     │
│ z-100         │ Header HUD Bar (<HeaderHUD />), Audio Mixer Button          │
│ z-50          │ Floating Action Banners & Turn Cue Notices                  │
│ z-40          │ Player Hand Slots & Action Controls                         │
│ z-30          │ Ambient Lighting Overlay & Vignette (`pointer-events-none`) │
│ z-20          │ Tabletop Battleground Stacks & Played Dragon Cards          │
│ z-10          │ Table Background Wood Texture & Felt Mat                    │
│ z-0           │ Root Application Canvas                                     │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

### Backdrop & Filter Conventions
- **Modal Backdrops**: `bg-black/70 backdrop-blur-md` or `bg-stone-950/80 backdrop-blur-sm`.
- **Focus Overlay**: Interactive elements during decision prompts use `z-190` dark focus overlays to highlight active card choices.

---

## 6. Target Mount Point & Integration Specification

### A. Mount Location in Artificer
The TDA engine mounts inside the main Artificer tactical view container (e.g., when a player interacts with a Tavern Table node or initiates a gambling challenge with an NPC patron).

### B. React Target Component Wrapper
The proposed target mount wrapper for Artificer integration is defined in `TDAMinigameProps`:

```tsx
import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import GameUI from '../components/minigames/tda/GameUI';
import TableTop from '../components/minigames/tda/TableTop';
import VFXLayer from '../components/VFXLayer';

export interface TDAMinigameProps {
  /** Initial gold balance from host character sheet */
  playerGold?: number;
  /** Primary opponent patron injected from Artificer overworld */
  opponentNpcId?: string;
  /** Callback fired when match finishes (victory or defeat) */
  onGameOver?: (result: { winnerId: string; finalGold: number }) => void;
  /** Callback fired when player exits the minigame table */
  onExit?: () => void;
}

export const TDAMinigame: React.FC<TDAMinigameProps> = ({
  playerGold,
  opponentNpcId,
  onGameOver,
  onExit,
}) => {
  const setNPC = useGameStore((state) => state.setNPC);

  useEffect(() => {
    if (opponentNpcId) {
      setNPC(opponentNpcId);
    }
  }, [opponentNpcId, setNPC]);

  return (
    <div className="w-full h-full relative bg-stone-950 overflow-hidden wood-texture select-none">
      <VFXLayer />
      <GameUI onExit={onExit} />
      <div className="w-full h-full flex items-center justify-center">
        <TableTop />
      </div>
    </div>
  );
};
```

---

## 7. Verification & Alignment Summary

- **Container Grid**: Matches Artificer's `100vw`/`100vh` flex-centered tactical stage with 16:9 inner scaling.
- **Theme Tokens**: Fully mapped to standard `stone` / `amber` Tailwind scales, `Cinzel`/`UnifrakturCook` typography, and standard text shadows.
- **Sidebar & Dock**: Delineated safe areas for left patron aside (`w-80`), right inspect drawer (`w-80`, `z-130`), and bottom hand dock (`h-40`).
- **Z-Index Hierarchy**: Audited from `z-0` (board texture) up to `z-1000` (rulebook overlay).
- **Target Mount**: Standardized React wrapper interface ready for embedding in Artificer.
