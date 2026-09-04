
import { describe, it, expect } from 'vitest';
import { resolveCardPower, checkFlightFormation } from './cardLogic';
import { BoardCard, CardData, GameState, PlayerState } from '../types';

describe('resolveCardPower', () => {
  const p0: PlayerState = {
    id: 'player',
    name: 'You',
    isNpc: false,
    gold: 5000,
    hand: [],
    flight: [],
    ante: null,
    emotion: 'neutral',
    npcLine: '',
    isTalking: false
  };

  const p1: PlayerState = {
    id: 'npc_1',
    name: 'Opponent',
    isNpc: true,
    npcId: 'female_alchemist_tabaxi',
    gold: 5000,
    hand: [],
    flight: [],
    ante: null,
    emotion: 'neutral',
    npcLine: '',
    isTalking: false
  };

  const mockState: GameState = {
    npcId: 'female_alchemist_tabaxi',
    phase: 'player-turn',
    round: 1,
    pot: 1000,
    deck: [],
    discardPile: [],
    maxGambits: 3,
    gambitsPlayed: 0,
    playerSkill: 'none',

    players: [p0, p1],
    activePlayerIndex: 0,
    currentLeaderIndex: 0,
    focusedOpponentIndex: 1,

    playerGold: 5000,
    playerHand: [],
    playerFlight: [],
    playerAnte: null,
    opponentGold: 5000,
    opponentHand: [],
    opponentFlight: [],
    opponentAnte: null,
    opponentEmotion: 'neutral',
    npcLine: '',
    isTalking: false,
    currentLeader: 'player',
    activePlayer: 'player',
    lastCardPlayed: null,
    activeSpecialRules: {},
    gambitResult: null,
    pendingInteraction: null,
    notification: null,
    history: [],
    characterStats: {
      strength: 10,
      dexterity: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    }
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

describe('checkFlightFormation', () => {
  const red5: BoardCard = { id: 'r5', name: 'Red Dragon', strength: 5, color: 'red', type: 'evil', spriteIndex: 0, description: '', owner: 'player', playedAtRound: 1 };
  const red8: BoardCard = { id: 'r8', name: 'Red Dragon', strength: 8, color: 'red', type: 'evil', spriteIndex: 0, description: '', owner: 'player', playedAtRound: 1 };
  const red3: BoardCard = { id: 'r3', name: 'Red Dragon', strength: 3, color: 'red', type: 'evil', spriteIndex: 0, description: '', owner: 'player', playedAtRound: 1 };
  const red10: BoardCard = { id: 'r10', name: 'Red Dragon', strength: 10, color: 'red', type: 'evil', spriteIndex: 0, description: '', owner: 'player', playedAtRound: 1 };

  const blue5: BoardCard = { id: 'b5', name: 'Blue Dragon', strength: 5, color: 'blue', type: 'evil', spriteIndex: 1, description: '', owner: 'player', playedAtRound: 1 };
  const green5: BoardCard = { id: 'g5', name: 'Green Dragon', strength: 5, color: 'green', type: 'evil', spriteIndex: 2, description: '', owner: 'player', playedAtRound: 1 };
  const gold5: BoardCard = { id: 'gold5', name: 'Gold Dragon', strength: 5, color: 'gold', type: 'good', spriteIndex: 5, description: '', owner: 'player', playedAtRound: 1 };

  const thief: BoardCard = { id: 't1', name: 'The Thief', strength: 7, color: 'none', type: 'mortal', spriteIndex: 15, description: '', owner: 'player', playedAtRound: 1 };

  it('detects a newly completed color flight', () => {
    const flight = [red5, red8, red3];
    const result = checkFlightFormation(flight, red3);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('color');
    expect(result?.color).toBe('red');
    expect(result?.cards).toHaveLength(3);
  });

  it('detects a newly completed strength flight', () => {
    const flight = [red5, blue5, green5];
    const result = checkFlightFormation(flight, green5);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('strength');
    expect(result?.strength).toBe(5);
    expect(result?.cards).toHaveLength(3);
  });

  it('does not re-trigger color flight on extended flight when 4th matching color is played', () => {
    const flight = [red5, red8, red3, red10];
    const result = checkFlightFormation(flight, red10);
    expect(result).toBeNull();
  });

  it('does not re-trigger strength flight on extended flight when 4th matching strength is played', () => {
    const flight = [red5, blue5, green5, gold5];
    const result = checkFlightFormation(flight, gold5);
    expect(result).toBeNull();
  });

  it('does not trigger flight formation when a mortal card is played', () => {
    const flight = [red5, red8, red3, thief];
    const result = checkFlightFormation(flight, thief);
    expect(result).toBeNull();
  });

  it('triggers a second valid formation when a new set of 3 matching cards is completed', () => {
    const blue8: BoardCard = { id: 'b8', name: 'Blue Dragon', strength: 8, color: 'blue', type: 'evil', spriteIndex: 1, description: '', owner: 'player', playedAtRound: 1 };
    const green8: BoardCard = { id: 'g8', name: 'Green Dragon', strength: 8, color: 'green', type: 'evil', spriteIndex: 2, description: '', owner: 'player', playedAtRound: 1 };

    // Initial color flight was completed at index 2 (red3).
    // Now playing green8 completes a strength 8 flight with red8, blue8, green8.
    const flight = [red5, red8, red3, blue8, green8];
    const result = checkFlightFormation(flight, green8);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('strength');
    expect(result?.strength).toBe(8);
  });
});
