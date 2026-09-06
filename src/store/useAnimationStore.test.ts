import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAnimationStore, MAX_CONCURRENT_COINS } from './useAnimationStore';

describe('useAnimationStore - Particle Pooling & Caching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAnimationStore.getState().clearCoins();
  });

  it('spawns coin particles up to MAX_CONCURRENT_COINS limit', () => {
    const store = useAnimationStore.getState();

    // Spawn 20 coins
    store.spawnCoins(20, { x: 100, y: 100 }, { x: 500, y: 500 });
    expect(useAnimationStore.getState().activeCoins.length).toBe(20);

    // Spawn 40 more coins (total requested 60)
    store.spawnCoins(40, { x: 100, y: 100 }, { x: 500, y: 500 });
    // Should be strictly capped at MAX_CONCURRENT_COINS (50)
    expect(useAnimationStore.getState().activeCoins.length).toBe(MAX_CONCURRENT_COINS);
  });

  it('recycles particle slots and updates generation IDs on repeated bursts', () => {
    const store = useAnimationStore.getState();

    store.spawnCoins(5, { x: 0, y: 0 }, { x: 100, y: 100 });
    // Take a snapshot copy of the coin objects
    const firstBurst = useAnimationStore.getState().activeCoins.map(c => ({ ...c }));

    expect(firstBurst.length).toBe(5);
    firstBurst.forEach(coin => {
      expect(coin.id).toMatch(/^coin-slot-\d+-gen-\d+$/);
    });

    // Clear and spawn another burst
    store.clearCoins();
    store.spawnCoins(5, { x: 0, y: 0 }, { x: 100, y: 100 });
    const secondBurst = useAnimationStore.getState().activeCoins.map(c => ({ ...c }));

    expect(secondBurst.length).toBe(5);
    secondBurst.forEach((coin, idx) => {
      const firstGen = parseInt(firstBurst[idx].id.split('-gen-')[1], 10);
      const secondGen = parseInt(coin.id.split('-gen-')[1], 10);
      expect(secondGen).toBeGreaterThan(firstGen);
    });
  });

  it('automatically deactivates particles after their duration completes', () => {
    const store = useAnimationStore.getState();

    store.spawnCoins(10, { x: 50, y: 50 }, { x: 200, y: 200 });
    expect(useAnimationStore.getState().activeCoins.length).toBe(10);

    // Fast-forward time past delay (9 * 45 = 405ms) + duration (1400ms) = 1805ms
    vi.advanceTimersByTime(3000);

    expect(useAnimationStore.getState().activeCoins.length).toBe(0);
  });

  it('clears all active coins immediately when clearCoins is called', () => {
    const store = useAnimationStore.getState();

    store.spawnCoins(15, { x: 10, y: 10 }, { x: 300, y: 300 });
    expect(useAnimationStore.getState().activeCoins.length).toBe(15);

    store.clearCoins();
    expect(useAnimationStore.getState().activeCoins.length).toBe(0);
  });
});
