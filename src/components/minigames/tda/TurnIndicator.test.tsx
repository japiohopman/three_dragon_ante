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
  it('renders breathing pulse ring and badge keyframe classes in HeaderHUD during human turn', () => {
    mockStoreState = {
      playerGold: 1000,
      playerHand: [sampleCard],
      lastCardPlayed: null,
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

    expect(html).toContain('data-testid="hud-turn-radial-ring"');
    expect(html).toContain('animate-turn-radial-ring');
    expect(html).toContain('data-testid="hud-phase-badge"');
    expect(html).toContain('animate-turn-breathing-ring');
    expect(html).toContain('YOUR TURN');
  });

  it('renders amber/gold breathing ring shift in HeaderHUD and PlayerHandArea when power triggers exist', () => {
    // sampleCard strength is 8, lastCardPlayed strength is 10 -> 8 <= 10 -> power triggers
    const highCard: CardData = { ...sampleCard, id: 'high-1', strength: 10 };
    mockStoreState = {
      playerGold: 1000,
      playerHand: [sampleCard],
      lastCardPlayed: highCard,
      fixGameState: () => {},
      phase: 'player-turn',
      players: [
        { id: 'player', name: 'You', isNpc: false, gold: 1000, hand: [sampleCard], flight: [], ante: null },
        { id: 'opp-1', name: 'Kava', isNpc: true, gold: 1000, hand: [], flight: [], ante: null }
      ],
      activePlayerIndex: 0,
      pendingInteraction: null
    };

    const hudHtml = renderToString(
      <HeaderHUD
        setShowRules={() => {}}
        isAiThinking={false}
        getPhaseInstruction={() => 'Your turn - Play a card to the table'}
        longTurn={false}
      />
    );

    expect(hudHtml).toContain('border-amber-400/60');
    expect(hudHtml).toContain('bg-amber-500/10');
    expect(hudHtml).toContain('bg-amber-950/90');

    const handHtml = renderToString(
      <PlayerHandArea
        playerHand={[sampleCard]}
        playerFlight={[]}
        lastCardPlayed={highCard}
        phase="player-turn"
        isPlayerTurn={true}
        selectAnte={() => {}}
        playCard={() => {}}
      />
    );

    expect(handHtml).toContain('border-amber-400/60');
    expect(handHtml).toContain('bg-amber-500/10');
    expect(handHtml).toContain('bg-amber-950/90');
  });

  it('renders emerald breathing ring in HeaderHUD and PlayerHandArea when no power triggers exist', () => {
    // sampleCard strength is 8, lastCardPlayed strength is 5 -> 8 > 5 -> power does NOT trigger
    const lowCard: CardData = { ...sampleCard, id: 'low-1', strength: 5 };
    mockStoreState = {
      playerGold: 1000,
      playerHand: [sampleCard],
      lastCardPlayed: lowCard,
      fixGameState: () => {},
      phase: 'player-turn',
      players: [
        { id: 'player', name: 'You', isNpc: false, gold: 1000, hand: [sampleCard], flight: [], ante: null },
        { id: 'opp-1', name: 'Kava', isNpc: true, gold: 1000, hand: [], flight: [], ante: null }
      ],
      activePlayerIndex: 0,
      pendingInteraction: null
    };

    const hudHtml = renderToString(
      <HeaderHUD
        setShowRules={() => {}}
        isAiThinking={false}
        getPhaseInstruction={() => 'Your turn - Play a card to the table'}
        longTurn={false}
      />
    );

    expect(hudHtml).toContain('border-emerald-400/60');
    expect(hudHtml).toContain('bg-emerald-500/10');
    expect(hudHtml).toContain('bg-emerald-950/90');

    const handHtml = renderToString(
      <PlayerHandArea
        playerHand={[sampleCard]}
        playerFlight={[]}
        lastCardPlayed={lowCard}
        phase="player-turn"
        isPlayerTurn={true}
        selectAnte={() => {}}
        playCard={() => {}}
      />
    );

    expect(handHtml).toContain('border-emerald-400/60');
    expect(handHtml).toContain('bg-emerald-500/10');
    expect(handHtml).toContain('bg-emerald-950/90');
  });

  it('omits turn radial ring in HeaderHUD during opponent turn', () => {
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

    expect(html).not.toContain('data-testid="hud-turn-radial-ring"');
    expect(html).not.toContain('animate-turn-breathing-ring');
    expect(html).toContain('KAVA&#x27;S TURN');
  });

  it('renders breathing pulse ring and banner keyframe classes in PlayerHandArea during human turn', () => {
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

    expect(html).toContain('data-testid="turn-radial-breathing-ring"');
    expect(html).toContain('animate-turn-radial-ring');
    expect(html).toContain('data-testid="turn-directive-banner"');
    expect(html).toContain('animate-turn-breathing-ring');
    expect(html).toContain('Your Turn — Play Card');
  });

  it('omits turn radial ring in PlayerHandArea when it is not human player turn', () => {
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

    expect(html).not.toContain('data-testid="turn-radial-breathing-ring"');
    expect(html).not.toContain('data-testid="turn-directive-banner"');
  });
});
