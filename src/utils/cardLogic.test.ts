
import { describe, it, expect } from 'vitest';
import { resolveCardPower } from './cardLogic';
import { CardData, GameState } from '../types';

describe('resolveCardPower', () => {
  const mockState: GameState = {
    deck: [],
    discardPile: [],
    antePile: [],
    playerHand: [],
    opponentHand: [],
    playerFlight: [],
    opponentFlight: [],
    pot: 10,
    playerGold: 50,
    opponentGold: 50,
    gambitPhase: 'round-1',
    leader: 'player',
    notification: null,
    history: [],
    isAIThinking: false,
    gameMode: 'tda',
    stakes: 0,
    roundWinner: null,
    gambitWinner: null
  };

  it('Black Dragon should steal 2 gold from the pot', () => {
    const card: CardData = {
      id: '1',
      name: 'Black Dragon',
      strength: 5,
      color: 'black',
      type: 'evil',
      spriteIndex: 3,
      description: 'Steal 2 gold from the stakes.'
    };

    const effect = resolveCardPower(card, mockState, 'player');
    expect(effect.goldChange).toEqual({ player: 2, pot: -2 });
    expect(effect.log).toContain('Steals 2 gold from the pot');
  });

  it('Red Dragon should make opponent pay 1 gold and steal 1 gold', () => {
    const card: CardData = {
      id: '2',
      name: 'Red Dragon',
      strength: 8,
      color: 'red',
      type: 'evil',
      spriteIndex: 0,
      description: 'Opponent pays 1 gold. Take a random card.'
    };

    const effect = resolveCardPower(card, mockState, 'player');
    expect(effect.goldChange).toEqual({ opponent: -1, player: 1 });
    expect(effect.stealCard).toEqual({ from: 'opponent', to: 'player', count: 1, criteria: 'random' });
  });

  it('White Dragon should fizzle if no mortals are in play', () => {
     const card: CardData = {
      id: '3',
      name: 'White Dragon',
      strength: 3,
      color: 'white',
      type: 'evil',
      spriteIndex: 4,
      description: 'If any flight includes a mortal, steal 3 gold from the stakes.'
    };

    const effect = resolveCardPower(card, mockState, 'player');
    expect(effect.goldChange).toBeUndefined();
    expect(effect.log).toContain('No mortals in play');
  });
});
