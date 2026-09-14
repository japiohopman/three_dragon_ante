import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FlightCardTooltip } from './ui/FlightCardTooltip';
import { PlayerHandArea } from './table/PlayerHandArea';
import { BoardCard } from '../../../types';

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

describe('FlightCardTooltip Component', () => {
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
});
