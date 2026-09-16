import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { EndGameModal } from './ui/EndGameModal';
import { GambitResult } from '../../../types';
import { addBreakdownItem } from '../../../store/slices/helpers';
import { formatPrice } from '../../../utils/currency';

const mockGambitResult: GambitResult = {
  winnerId: 'player',
  winnerName: 'You',
  scores: [
    { playerId: 'player', name: 'You', strength: 22 },
    { playerId: 'npc_1', name: 'Aris', strength: 18 }
  ],
  potWon: 3500,
  reason: 'Strongest flight wins.',
  potBreakdown: [
    { source: 'Ante Stakes', amount: 2000 },
    { source: 'Card Powers & Bets', amount: 1000 },
    { source: 'Card Purchases', amount: 500 }
  ]
};

describe('EndGameModal & Pot Breakdown System', () => {
  describe('addBreakdownItem helper', () => {
    it('adds new breakdown sources correctly', () => {
      const items = addBreakdownItem([], 'Ante Stakes', 2000);
      expect(items).toEqual([{ source: 'Ante Stakes', amount: 2000 }]);
    });

    it('accumulates amounts for existing sources', () => {
      const step1 = addBreakdownItem([], 'Card Powers & Bets', 500);
      const step2 = addBreakdownItem(step1, 'Card Powers & Bets', 300);
      expect(step2).toEqual([{ source: 'Card Powers & Bets', amount: 800 }]);
    });

    it('removes item if amount reduces to 0', () => {
      const step1 = addBreakdownItem([], 'Card Powers & Bets', 500);
      const step2 = addBreakdownItem(step1, 'Card Powers & Bets', -500);
      expect(step2).toEqual([]);
    });
  });

  describe('EndGameModal Component', () => {
    it('renders gambit won header, reason, flight strengths, and total pot', () => {
      const html = renderToString(
        <EndGameModal
          isGambitEnd={true}
          isGameOver={false}
          gambitResult={mockGambitResult}
          playerGold={5000}
          opponentGold={3000}
          npcName="Aris"
          startNextGambit={() => {}}
          resetGame={() => {}}
        />
      );

      expect(html).toContain('Gambit Won!');
      expect(html).toContain('Strongest flight wins.');
      expect(html).toContain('You');
      expect(html).toContain('22');
      expect(html).toContain('Aris');
      expect(html).toContain('18');
      expect(html).toContain(formatPrice(mockGambitResult.potWon));
      expect(html).toContain('View Pot Breakdown Summary ▼');
    });

    it('renders breakdown toggle button with explicit accessibility attributes', () => {
      const html = renderToString(
        <EndGameModal
          isGambitEnd={true}
          isGameOver={false}
          gambitResult={mockGambitResult}
          playerGold={5000}
          opponentGold={3000}
          npcName="Aris"
          startNextGambit={() => {}}
          resetGame={() => {}}
        />
      );

      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-label="Toggle Pot Breakdown Details"');
    });

    it('renders fallback breakdown when potBreakdown is missing from gambitResult', () => {
      const simpleResult: GambitResult = {
        winnerId: 'npc_1',
        winnerName: 'Aris',
        scores: [{ playerId: 'npc_1', name: 'Aris', strength: 20 }],
        potWon: 2000,
        reason: 'Strongest flight wins.'
      };

      const html = renderToString(
        <EndGameModal
          isGambitEnd={true}
          isGameOver={false}
          gambitResult={simpleResult}
          playerGold={3000}
          opponentGold={5000}
          npcName="Aris"
          startNextGambit={() => {}}
          resetGame={() => {}}
        />
      );

      expect(html).toContain('Aris Won');
      expect(html).toContain(`-${formatPrice(2000)}`);
      expect(html).toContain('View Pot Breakdown Summary ▼');
    });

    it('renders match victory view when isGameOver is true and player has more gold', () => {
      const html = renderToString(
        <EndGameModal
          isGambitEnd={false}
          isGameOver={true}
          gambitResult={null}
          playerGold={8000}
          opponentGold={2000}
          npcName="Aris"
          startNextGambit={() => {}}
          resetGame={() => {}}
        />
      );

      expect(html).toContain('VICTORY');
      expect(html).toContain('You have bested');
      expect(html).toContain('Aris');
      expect(html).toContain(formatPrice(8000));
      expect(html).toContain('Return to Lobby');
    });
  });
});
