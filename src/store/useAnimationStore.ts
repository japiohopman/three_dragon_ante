import { create } from 'zustand';
import { PlayerId } from '../types';
import { preloadSpriteAtlases } from '../utils/constants';

// Trigger sprite atlas preloading on store module load
preloadSpriteAtlases();

export interface CoinParticle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  arcY?: number;
  spinDeg?: number;
}

interface PooledCoinParticle extends CoinParticle {
  slotIndex: number;
  generation: number;
  active: boolean;
  spawnTime: number;
  cleanupTimeoutId?: ReturnType<typeof setTimeout>;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: 'gold' | 'red' | 'white';
}

export type SpecialEffectType = 'fire' | 'lightning' | 'poison' | 'divine' | 'necrotic' | 'slash' | 'chromatic' | null;

interface AnimationState {
  // Screen Shake & Flash
  shakeIntensity: number; // 0 = none, 1 = mild, 2 = heavy
  flashColor: string | null; // e.g. 'rgba(255,255,255,0.5)'
  triggerShake: (intensity?: number) => void;
  triggerFlash: (color?: string) => void;

  // Special Card Effects
  specialEffect: SpecialEffectType;
  triggerSpecialEffect: (effect: SpecialEffectType) => void;

  // Coin Particles
  activeCoins: CoinParticle[];
  spawnCoins: (count: number, start: {x: number, y: number}, end: {x: number, y: number}) => void;
  clearCoins: () => void;

  // Floating Text (Damage Numbers)
  floatingTexts: FloatingText[];
  triggerFloatingText: (x: number, y: number, text: string, color?: 'gold' | 'red' | 'white') => void;

  // Card Focusing & Hovering
  focusedCardId: string | null;
  hoveredCardId: string | null;
  setFocusedCard: (id: string | null) => void;
  setHoveredCard: (id: string | null) => void;

  // Turn Banner
  showTurnBanner: boolean;
  activePlayer: PlayerId | null;
  triggerTurnBanner: (player: PlayerId, duration?: number) => void;
}

export const MAX_CONCURRENT_COINS = 50;

// Pre-allocated object pool for coin particles
const coinPool: PooledCoinParticle[] = Array.from({ length: MAX_CONCURRENT_COINS }, (_, i) => ({
  slotIndex: i,
  generation: 0,
  active: false,
  id: `coin-slot-${i}-gen-0`,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  delay: 0,
  arcY: -60,
  spinDeg: 720,
  spawnTime: 0,
}));

export const useAnimationStore = create<AnimationState>((set) => ({
  shakeIntensity: 0,
  flashColor: null,
  specialEffect: null,
  activeCoins: [],
  floatingTexts: [],
  focusedCardId: null,
  hoveredCardId: null,
  showTurnBanner: false,
  activePlayer: null,

  triggerShake: (intensity = 1) => {
    if (intensity === 0) {
      set({ shakeIntensity: 0 });
      return;
    }
    set({ shakeIntensity: intensity });
    setTimeout(() => set({ shakeIntensity: 0 }), 500);
  },

  triggerFlash: (color = 'rgba(255, 255, 255, 0.4)') => {
    set({ flashColor: color });
    setTimeout(() => set({ flashColor: null }), 150);
  },

  triggerSpecialEffect: (effect) => {
    set({ specialEffect: effect });
    // Auto-clear depends on the animation length, usually around 1-1.5s
    setTimeout(() => set({ specialEffect: null }), 1500);
  },

  spawnCoins: (count, start, end) => {
    const coinsToSpawn = Math.min(count, MAX_CONCURRENT_COINS);
    const now = Date.now();

    for (let i = 0; i < coinsToSpawn; i++) {
      // Add Jitter to destination so they land in a pile, not a single point
      const jitterX = (Math.random() - 0.5) * 60; // +/- 30px
      const jitterY = (Math.random() - 0.5) * 40; // +/- 20px
      const delay = i * 45; // Stagger by 45ms

      const dx = (end.x + jitterX) - start.x;
      const dy = (end.y + jitterY) - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Dynamic parabolic upward arc based on distance
      const arcY = -Math.min(120, Math.max(30, dist * 0.25)) - (Math.random() * 30);
      // Random spin degrees (1-3 full rotations, either direction)
      const spinDeg = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.floor(Math.random() * 720));

      // Acquire an available pool slot, or recycle the oldest active slot
      let slot = coinPool.find(c => !c.active);
      if (!slot) {
        // Find slot with oldest spawnTime
        slot = coinPool.reduce((oldest, current) => current.spawnTime < oldest.spawnTime ? current : oldest, coinPool[0]);
      }

      if (slot.cleanupTimeoutId) {
        clearTimeout(slot.cleanupTimeoutId);
        slot.cleanupTimeoutId = undefined;
      }

      slot.generation++;
      slot.id = `coin-slot-${slot.slotIndex}-gen-${slot.generation}`;
      slot.startX = start.x;
      slot.startY = start.y;
      slot.endX = end.x + jitterX;
      slot.endY = end.y + jitterY;
      slot.delay = delay;
      slot.arcY = arcY;
      slot.spinDeg = spinDeg;
      slot.active = true;
      slot.spawnTime = now + delay;

      const currentGeneration = slot.generation;
      const currentSlotIndex = slot.slotIndex;
      const cleanupTime = delay + 1400;

      slot.cleanupTimeoutId = setTimeout(() => {
        const targetSlot = coinPool[currentSlotIndex];
        if (targetSlot && targetSlot.generation === currentGeneration) {
          targetSlot.active = false;
          targetSlot.cleanupTimeoutId = undefined;
          set({ activeCoins: coinPool.filter(c => c.active) });
        }
      }, cleanupTime);
    }

    set({ activeCoins: coinPool.filter(c => c.active) });
  },

  triggerFloatingText: (x, y, text, color: 'gold' | 'red' | 'white' = 'gold') => {
      const id = Math.random().toString(36).substr(2, 9);
      // Add slight random offset to start position so multiple texts don't overlap perfectly
      const offsetX = (Math.random() - 0.5) * 40;

      const newText: FloatingText = { id, x: x + offsetX, y, text, color };

      set(state => ({ floatingTexts: [...state.floatingTexts, newText] }));

      setTimeout(() => {
          set(state => ({
              floatingTexts: state.floatingTexts.filter(t => t.id !== id)
          }));
      }, 2000); // Duration matches CSS animation
  },

  clearCoins: () => {
    coinPool.forEach((slot) => {
      if (slot.cleanupTimeoutId) {
        clearTimeout(slot.cleanupTimeoutId);
        slot.cleanupTimeoutId = undefined;
      }
      slot.active = false;
    });
    set({ activeCoins: [] });
  },

  setFocusedCard: (id) => set({ focusedCardId: id }),
  setHoveredCard: (id) => set({ hoveredCardId: id }),

  triggerTurnBanner: (player: PlayerId, duration = 2000) => {
    set({ showTurnBanner: true, activePlayer: player });
    setTimeout(() => set({ showTurnBanner: false }), duration);
  }
}));
