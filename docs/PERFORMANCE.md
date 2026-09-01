# ⚡ Performance Audit — Table VFX and Sprite Loading

## 1. Overview
This document records the performance investigation and optimization changes made to the Three-Dragon Ante (TDA) table visual effects and card asset loading system.

---

## 2. Identified Hot Paths & Bottlenecks

### A. Coin Particle System (`src/components/VFXLayer.tsx` & `src/store/useAnimationStore.ts`)
- **Issue 1 (Unbounded particle queue):** `spawnCoins()` added incoming coin particles to `activeCoins` without a hard maximum limit. Rapid gold payouts or multi-player coin sweeps could trigger upwards of 100+ simultaneous DOM elements.
- **Issue 2 (Multiple React re-renders per particle):** The original `Coin` sub-component mounted with an initial style and scheduled two `setTimeout` calls (at 50ms and 800ms) to update React component `style` state. For a burst of 50 coins, this triggered ~100 state updates and React render passes across the animation lifecycle.

### B. Card Sprite Atlas Pop-in (`index.html` & `src/utils/constants.ts`)
- **Issue:** Card rendering relies on external WebP sprite atlases (`ATLAS_URL` and `ATLAS_URL_SMALL`). In initial game loads or network-throttled environments, cards would render blank/fallback background colors until the browser requested and fetched the atlas image assets.

---

## 3. Applied Optimizations

### A. GPU-Accelerated CSS Keyframe Animation for Particles (`index.html` & `src/components/VFXLayer.tsx`)
- Replaced component-level JS state changes (`setTimeout` + `setStyle`) with pure CSS keyframes (`coin-fly`).
- Utilized CSS custom variables (`--start-x`, `--start-y`, `--end-x`, `--end-y`) for trajectory calculations.
- Promoted coin particles to hardware-accelerated layers via `will-change: transform, opacity` and 3D transforms (`translate3d`), allowing composite-only execution on the GPU compositor thread without triggering React re-renders or layout reflows.

### B. Concurrent Particle Capping (`src/store/useAnimationStore.ts`)
- Implemented `MAX_CONCURRENT_COINS = 50` capping in `spawnCoins`.
- When coin bursts exceed 50 active particles, older active particles are trimmed automatically, protecting frame rates on low-end mobile or embedded devices.

### C. Resource Preloading for Card Sprite Atlases (`index.html`)
- Added HTML `<link rel="preload" as="image" href="..." />` tags for both `ATLAS_URL` and `ATLAS_URL_SMALL`.
- Ensures sprite sheets are fetched during document head parsing before entering the tabletop UI, eliminating image pop-in on game start.

---

## 4. Measurement & Verification Results

| Metric / Scenario | Before Optimization | After Optimization | Impact |
| :--- | :--- | :--- | :--- |
| **Coin Burst (50 particles)** | ~100 React state updates, layout reflows | 0 React state updates after mount, CSS compositor animation | Significant CPU main-thread relief |
| **Max Particle Limit** | Unbounded (100+ DOM nodes possible) | Strictly capped at 50 active particles | Memory & DOM node count bounded |
| **Initial Card Atlas Fetch** | Deferred until card element render | Preloaded during initial HTML head parse | Zero visual card image pop-in |
| **Build & Test Status** | Clean | Clean (`npm test`, `npm run lint`, `npm run build` green) | 100% test & build pass |

---

*Verified by Jules Orchestrator.*
