import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Battleground } from './Battleground';

describe('Battleground Component', () => {
  it('renders initial pot value, opponent ante, and player ante slots', () => {
    const html = renderToString(
      <Battleground
        opponentAnte={null}
        playerAnte={null}
        pot={500}
        phase="ante-selection"
      />
    );

    expect(html).toContain('Pot');
    expect(html).toContain('Opponent Ante');
    expect(html).toContain('Your Ante');
    expect(html).toContain('data-testid="pot-container"');
  });

  it('renders player ante card when provided', () => {
    const mockCard = {
      id: 'red_13',
      name: 'Red Dragon',
      type: 'dragon' as const,
      color: 'red' as const,
      strength: 13,
      description: 'Test Dragon'
    };

    const html = renderToString(
      <Battleground
        opponentAnte={null}
        playerAnte={mockCard}
        pot={1000}
        phase="gambit"
      />
    );

    expect(html).toContain('Red Dragon');
    expect(html).not.toContain('Your Ante');
  });

  it('renders opponent ante card when provided during reveal phase', () => {
    const mockOpponentCard = {
      id: 'gold_10',
      name: 'Gold Dragon',
      type: 'dragon' as const,
      color: 'gold' as const,
      strength: 10,
      description: 'Gold Dragon Test'
    };

    const html = renderToString(
      <Battleground
        opponentAnte={mockOpponentCard}
        playerAnte={null}
        pot={1200}
        phase="ante-reveal"
      />
    );

    expect(html).toContain('Gold Dragon');
    expect(html).not.toContain('Opponent Ante');
  });
});
