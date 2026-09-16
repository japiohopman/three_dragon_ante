import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../useGameStore';

describe('economySlice - buyCard narrative history log', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('appends narrative log entry to history when human player buys cards with an empty hand', () => {
    const store = useGameStore.getState();
    store.initMatch({ humanGold: 5000, opponentCount: 1 });

    // Empty human player hand
    useGameStore.setState({
      players: useGameStore.getState().players.map((p, idx) =>
        idx === 0 ? { ...p, hand: [] } : p
      ),
    });

    const initialHistoryLength = useGameStore.getState().history.length;

    useGameStore.getState().buyCard('player');

    const updatedState = useGameStore.getState();
    expect(updatedState.history.length).toBe(initialHistoryLength + 1);
    const lastHistoryMsg = updatedState.history[updatedState.history.length - 1];
    expect(lastHistoryMsg).toBe('You drew cards to replenish an empty hand.');
    expect(updatedState.players[0].hand.length).toBeGreaterThan(0);
  });

  it('appends narrative log entry to history when AI opponent buys cards with an empty hand', () => {
    const store = useGameStore.getState();
    store.initMatch({ humanGold: 5000, opponentCount: 1 });

    const aiPlayer = useGameStore.getState().players[1];

    // Empty AI opponent hand
    useGameStore.setState({
      players: useGameStore.getState().players.map((p, idx) =>
        idx === 1 ? { ...p, hand: [] } : p
      ),
    });

    const initialHistoryLength = useGameStore.getState().history.length;

    useGameStore.getState().buyCard(aiPlayer.id);

    const updatedState = useGameStore.getState();
    expect(updatedState.history.length).toBe(initialHistoryLength + 1);
    const lastHistoryMsg = updatedState.history[updatedState.history.length - 1];
    expect(lastHistoryMsg).toBe(`${aiPlayer.name} drew cards to replenish an empty hand.`);
    expect(updatedState.players[1].hand.length).toBeGreaterThan(0);
  });

  it('appends narrative log entry to history when buying cards with a non-empty hand', () => {
    const store = useGameStore.getState();
    store.initMatch({ humanGold: 5000, opponentCount: 1 });

    // Keep hand at 2 cards
    useGameStore.setState({
      players: useGameStore.getState().players.map((p, idx) =>
        idx === 0 ? { ...p, hand: p.hand.slice(0, 2) } : p
      ),
    });

    const initialHistoryLength = useGameStore.getState().history.length;

    useGameStore.getState().buyCard('player');

    const updatedState = useGameStore.getState();
    expect(updatedState.history.length).toBe(initialHistoryLength + 1);
    const lastHistoryMsg = updatedState.history[updatedState.history.length - 1];
    expect(lastHistoryMsg).toContain('You bought cards');
  });
});
