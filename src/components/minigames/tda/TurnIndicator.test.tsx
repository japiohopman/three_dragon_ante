import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { HeaderHUD } from './ui/HeaderHUD';
import { PlayerHandArea } from './table/PlayerHandArea';
import { CardData } from '../../../types';

const sampleCard: CardData = {
  id: 'card-1',
  name: 'Red Dragon',
  strength: 8,
  type: 'evil',
  color: 'red',
  spriteIndex: 1,
  description: 'Deal 8 damage or bet gold.'
};

let mockStoreState: any = {
  playerGold: 1000,
  playerHand: [sampleCard],
  fixGameState: () => {},
  phase: 'player-turn',
  players: [
    { id: 'player', name: 'You', isNpc: false, gold: 1000, hand: [sampleCard], flight: [], ante: null },
    { id: 'opp-1', name: 'Kava', isNpc: true, gold: 1000, hand: [], flight: [], ante: null }
  ],
  activePlayerIndex: 0,
  pendingInteraction: null
};

vi.mock('../../../store/useGameStore', () => ({
  useGameStore: () => mockStoreState
}));

describe('Active Player Turn Breathing Ring Indicator', () => {
  it('renders turn badge keyframe classes in HeaderHUD during human turn', () => {
    mockStoreState = {
      playerGold: 1000,
      playerHand: [sampleCard],
      fixGameState: () => {},
      phase: 'player-turn',
      players: [
        { id: 'player', name: 'You', isNpc: false, gold: 1000, hand: [sampleCard], flight: [], ante: null },
        { id: 'opp-1', name: 'Kava', isNpc: true, gold: 1000, hand: [], flight: [], ante: null }
      ],
      activePlayerIndex: 0,
      pendingInteraction: null
    };

    const html = renderToString(
      <HeaderHUD
        setShowRules={() => {}}
        isAiThinking={false}
        getPhaseInstruction={() => 'Your turn - Play a card to the table'}
        longTurn={false}
      />
    );

    expect(html).toContain('data-testid="hud-phase-badge"');
    expect(html).toContain('animate-turn-breathing-ring');
    expect(html).toContain('YOUR TURN');
  });

  it('omits turn breathing badge class in HeaderHUD during opponent turn', () => {
    mockStoreState = {
      playerGold: 1000,
      playerHand: [],
      fixGameState: () => {},
      phase: 'opponent-turn',
      players: [
        { id: 'player', name: 'You', isNpc: false, gold: 1000, hand: [], flight: [], ante: null },
        { id: 'opp-1', name: 'Kava', isNpc: true, gold: 1000, hand: [], flight: [], ante: null }
      ],
      activePlayerIndex: 1,
      pendingInteraction: null
    };

    const html = renderToString(
      <HeaderHUD
        setShowRules={() => {}}
        isAiThinking={true}
        getPhaseInstruction={() => "Kava is considering their move..."}
        longTurn={false}
      />
    );

    expect(html).not.toContain('animate-turn-breathing-ring');
    expect(html).toContain('KAVA&#x27;S TURN');
  });

  it('renders turn directive banner in PlayerHandArea during human turn', () => {
    mockStoreState = {
      pendingInteraction: null
    };

    const html = renderToString(
      <PlayerHandArea
        playerHand={[sampleCard]}
        playerFlight={[]}
        lastCardPlayed={null}
        phase="player-turn"
        isPlayerTurn={true}
        selectAnte={() => {}}
        playCard={() => {}}
      />
    );

    expect(html).toContain('data-testid="turn-directive-banner"');
    expect(html).toContain('animate-turn-breathing-ring');
    expect(html).toContain('Your Turn — Play Card');
  });

  it('omits turn directive banner in PlayerHandArea when it is not human player turn', () => {
    mockStoreState = {
      pendingInteraction: null
    };

    const html = renderToString(
      <PlayerHandArea
        playerHand={[sampleCard]}
        playerFlight={[]}
        lastCardPlayed={null}
        phase="opponent-turn"
        isPlayerTurn={false}
        selectAnte={() => {}}
        playCard={() => {}}
      />
    );

    expect(html).not.toContain('data-testid="turn-directive-banner"');
  });
});
