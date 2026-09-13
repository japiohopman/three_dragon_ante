import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { InteractionModal } from './ui/InteractionModal';
import { InteractionRequest, CardData } from '../../../types';

vi.mock('../../../store/useGameStore', () => ({
  useGameStore: (selector: any) => selector({
    players: [
      { id: 'player', name: 'You' },
      { id: 'npc_1', name: 'Aris' }
    ],
    activePlayerIndex: 0
  })
}));

const mockCard: CardData = {
  id: 'c1',
  name: 'Red Dragon',
  type: 'evil',
  color: 'red',
  strength: 6,
  description: 'Test dragon',
  spriteIndex: 0
};

const mockGreenInteraction: InteractionRequest = {
  type: 'choice',
  sourceCardName: 'Green Dragon',
  target: 'player',
  options: [
    { label: 'Give Weaker Evil Dragon', value: 'give-card' },
    { label: 'Pay 5 Gold', value: 'pay-gold', cost: 5 }
  ]
};

const mockThiefInteraction: InteractionRequest = {
  type: 'choice',
  sourceCardName: 'The Thief',
  target: 'player',
  options: [
    { label: 'Discard a Card', value: 'discard-card' }
  ]
};

describe('InteractionModal Component', () => {
  it('renders context header and option consequence descriptions for Green Dragon', () => {
    const html = renderToString(
      <InteractionModal
        pendingInteraction={mockGreenInteraction}
        playerGold={1000}
        selectableCards={[mockCard]}
        respondToInteraction={() => {}}
      />
    );

    expect(html).toContain('DECISION REQUIRED:');
    expect(html).toContain('Green Dragon');
    expect(html).toContain('Green Dragon demands tribute!');
    expect(html).toContain('Consequence: Deducts 5 gold from your purse and adds it to the pot.');
    expect(html).toContain('Consequence: Transfers the selected card from your hand to the active opponent.');
  });

  it('renders selectable card with accessibility attributes role="button" and tabindex="0"', () => {
    const html = renderToString(
      <InteractionModal
        pendingInteraction={mockGreenInteraction}
        playerGold={1000}
        selectableCards={[mockCard]}
        respondToInteraction={() => {}}
      />
    );

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Select Red Dragon, strength 6"');
  });

  it('renders no-trap fallback when no matching cards are available for card-only requirement', () => {
    const html = renderToString(
      <InteractionModal
        pendingInteraction={mockThiefInteraction}
        playerGold={1000}
        selectableCards={[]}
        respondToInteraction={() => {}}
      />
    );

    expect(html).toContain('No eligible cards available in hand to fulfill card requirement.');
    expect(html).toContain('Skip Action (No Matching Cards Available)');
  });

  it('renders AI resolving indicator when target is an opponent', () => {
    const aiInteraction: InteractionRequest = {
      ...mockGreenInteraction,
      target: 'npc_1'
    };

    const html = renderToString(
      <InteractionModal
        pendingInteraction={aiInteraction}
        playerGold={1000}
        selectableCards={[]}
        respondToInteraction={() => {}}
      />
    );

    expect(html).toContain('⏳ AI RESOLVING CHOICE');
    expect(html).toContain('Aris');
    expect(html).toContain('is evaluating decision options...');
  });
});
