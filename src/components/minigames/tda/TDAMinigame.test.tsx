import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../../store/useGameStore';

describe('TDAMinigame Integration API Contract', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('initMatch initializes game state with custom player gold and opponent NPC', () => {
    const store = useGameStore.getState();

    store.initMatch({
      humanGold: 8500,
      opponentId: 'female_cleric_goliath_obaya',
      opponentCount: 1,
      duration: 5,
    });

    const state = useGameStore.getState();
    expect(state.players.length).toBe(2);
    expect(state.players[0].gold).toBe(8500);
    expect(state.players[1].npcId).toBe('female_cleric_goliath_obaya');
    expect(state.players[1].name).toBe('Obaya');
    expect(state.maxGambits).toBe(5);
    expect(state.phase).toBe('ante-selection');
  });

  it('resetGame resets match state to initial defaults', () => {
    const store = useGameStore.getState();

    store.initMatch({ humanGold: 10000, opponentId: 'female_alchemist_lightfoot_halfling' });
    expect(useGameStore.getState().players[0].gold).toBe(10000);

    store.resetGame();
    expect(useGameStore.getState().phase).toBe('lobby');
    expect(useGameStore.getState().players).toEqual([]);
  });
});
