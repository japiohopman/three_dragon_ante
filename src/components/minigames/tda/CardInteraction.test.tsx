import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Card from './Card';
import { PlayerHandArea } from './table/PlayerHandArea';
import { CardData } from '../../../types';

const mockCard: CardData = {
  id: 'c1',
  name: 'Red Dragon',
  type: 'evil',
  color: 'red',
  strength: 10,
  description: 'Deal damage and take gold.',
  spriteIndex: 0
};

describe('Card Component Interaction & Accessibility', () => {
  it('renders role="button" and tabIndex=0 when onClick is provided and card is enabled', () => {
    const html = renderToString(
      <Card
        card={mockCard}
        onClick={() => {}}
        disabled={false}
      />
    );

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Red Dragon, strength 10"');
  });

  it('renders tabIndex=-1 and aria-disabled when disabled', () => {
    const html = renderToString(
      <Card
        card={mockCard}
        onClick={() => {}}
        disabled={true}
      />
    );

    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-label="Red Dragon, strength 10 (disabled)"');
  });
});

describe('PlayerHandArea Component Affordances', () => {
  it('renders Ante badge during ante selection phase', () => {
    const html = renderToString(
      <PlayerHandArea
        playerHand={[mockCard]}
        playerFlight={[]}
        lastCardPlayed={null}
        phase="ante-selection"
        isPlayerTurn={false}
        selectAnte={() => {}}
        playCard={() => {}}
      />
    );

    expect(html).toContain('✨ Ante');
    expect(html).toContain('Ante Phase — Choose Card to Ante');
  });

  it('renders Power badge during player turn when card power is triggered', () => {
    const html = renderToString(
      <PlayerHandArea
        playerHand={[mockCard]}
        playerFlight={[]}
        lastCardPlayed={{ ...mockCard, strength: 12 }}
        phase="player-turn"
        isPlayerTurn={true}
        selectAnte={() => {}}
        playCard={() => {}}
      />
    );

    expect(html).toContain('⚡ Power');
    expect(html).toContain('Your Turn — Play Card');
  });

  it('renders Str badge when card strength exceeds last card played strength', () => {
    const html = renderToString(
      <PlayerHandArea
        playerHand={[{ ...mockCard, strength: 12 }]}
        playerFlight={[]}
        lastCardPlayed={{ ...mockCard, strength: 8 }}
        phase="player-turn"
        isPlayerTurn={true}
        selectAnte={() => {}}
        playCard={() => {}}
      />
    );

    expect(html).toContain('⚔️ Str');
  });
});
