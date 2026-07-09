
import { create } from 'zustand';
import { PlayerId } from '../types';

interface CoinParticle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
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
    const newCoins: CoinParticle[] = [];
    for (let i = 0; i < count; i++) {
      // Add Jitter to destination so they land in a pile, not a single point
      const jitterX = (Math.random() - 0.5) * 60; // +/- 30px
      const jitterY = (Math.random() - 0.5) * 40; // +/- 20px

      newCoins.push({
        id: Math.random().toString(36).substr(2, 9),
        startX: start.x,
        startY: start.y,
        endX: end.x + jitterX,
        endY: end.y + jitterY,
        delay: i * 50 // Stagger by 50ms
      });
    }
    set((state) => ({ activeCoins: [...state.activeCoins, ...newCoins] }));

    // Auto clear after animation duration (approx 1.5s)
    setTimeout(() => {
        set((state) => ({
            activeCoins: state.activeCoins.filter(c => !newCoins.find(n => n.id === c.id))
        }));
    }, 1500);
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

  clearCoins: () => set({ activeCoins: [] }),

  setFocusedCard: (id) => set({ focusedCardId: id }),
  setHoveredCard: (id) => set({ hoveredCardId: id }),

  triggerTurnBanner: (player: PlayerId, duration = 2000) => {
    set({ showTurnBanner: true, activePlayer: player });
    setTimeout(() => set({ showTurnBanner: false }), duration);
  }
}));
