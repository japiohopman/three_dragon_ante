import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FlightCardTooltip } from './ui/FlightCardTooltip';
import { PlayerHandArea } from './table/PlayerHandArea';
import { MultiplayerSeats } from './table/MultiplayerSeats';
import { BoardCard, PlayerState } from '../../../types';
import { useAnimationStore } from '../../../store/useAnimationStore';

const sampleCard: BoardCard = {
  id: 'gold-dragon-13',
  name: 'Gold Dragon',
  strength: 13,
  type: 'good',
  color: 'gold',
  spriteIndex: 5,
  description: 'The opponent with the strongest flight pays you 1 gold. Take a random card from that player\'s hand.',
  owner: 'player',
  playedAtRound: 1,
};

const sampleOpponent: PlayerState = {
  id: 'opp-1',
  name: 'Aris',
  isNpc: true,
  gold: 1500,
  hand: [sampleCard],
  flight: [sampleCard],
  ante: null,
  emotion: 'neutral',
  npcLine: '',
  isTalking: false,
  speechHistory: []
};

describe('FlightCardTooltip Component', () => {
  beforeEach(() => {
    useAnimationStore.getState().setHoveredCard(null);
  });

  it('renders card strength, name, round, owner, and description', () => {
    const html = renderToString(
      <FlightCardTooltip card={sampleCard} ownerName="You" position="top" />
    );

    expect(html).toContain('13');
    expect(html).toContain('Gold Dragon');
    expect(html).toContain('Round');
    expect(html).toContain('You');
    expect(html).toContain('strongest flight pays you');
    expect(html).toContain('role="tooltip"');
  });

  it('supports bottom position class', () => {
    const html = renderToString(
      <FlightCardTooltip card={sampleCard} ownerName="Aris" position="bottom" />
    );

    expect(html).toContain('top-full mt-2 left-1/2 -translate-x-1/2');
    expect(html).toContain('Aris');
  });

  it('renders accessible keyboard focus attributes for flight cards in PlayerHandArea', () => {
    const html = renderToString(
      <PlayerHandArea
        playerHand={[]}
        playerFlight={[sampleCard]}
        lastCardPlayed={null}
        phase="gambit-turn"
        isPlayerTurn={true}
        selectAnte={() => {}}
        playCard={() => {}}
      />
    );

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Gold Dragon, strength 13 played in flight"');
    expect(html).toContain('focus-visible:ring-2');
  });

  it('renders accessible keyboard focus attributes for flight cards in MultiplayerSeats', () => {
    const html = renderToString(
      <MultiplayerSeats
        players={[{ id: 'player', name: 'You', isNpc: false, gold: 1000, hand: [], flight: [], ante: null }, sampleOpponent]}
        focusedOpponentIndex={1}
        activePlayer={null}
        currentLeader={null}
        lastCardPlayed={null}
        onSelectOpponent={() => {}}
      />
    );

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Gold Dragon, strength 13 played by Aris"');
    expect(html).toContain('focus-visible:ring-2');
  });

  it('renders FlightCardTooltip directly with expected metadata and accessibility attributes', () => {
    const html = renderToString(
      <FlightCardTooltip card={sampleCard} ownerName="You" position="top" />
    );

    expect(html).toContain('role="tooltip"');
    expect(html).toContain('Gold Dragon card power details');
    expect(html).toContain('Gold Dragon');
    expect(html).toContain('13');
  });
});
