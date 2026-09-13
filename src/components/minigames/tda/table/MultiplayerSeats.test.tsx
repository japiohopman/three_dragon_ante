import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MultiplayerSeats } from './MultiplayerSeats';
import { PlayerState } from '../../../../types';

let mockStoreState: any = {
  pendingInteraction: null,
  phase: 'opponent-turn'
};

vi.mock('../../../../store/useGameStore', () => ({
  useGameStore: () => mockStoreState
}));

const mockPlayers: PlayerState[] = [
  {
    id: 'player',
    name: 'Player One',
    isNpc: false,
    gold: 2000,
    hand: [],
    flight: [],
    ante: null,
    emotion: 'neutral',
    npcLine: '',
    isTalking: false
  },
  {
    id: 'npc_1',
    name: 'Kava',
    isNpc: true,
    npcId: 'kava',
    gold: 1500,
    hand: [],
    flight: [],
    ante: null,
    emotion: 'neutral',
    npcLine: '',
    isTalking: false
  },
  {
    id: 'npc_2',
    name: 'Obaya',
    isNpc: true,
    npcId: 'obaya',
    gold: 1800,
    hand: [],
    flight: [],
    ante: null,
    emotion: 'neutral',
    npcLine: '',
    isTalking: false
  }
];

describe('MultiplayerSeats Component', () => {
  it('renders "Resolving Power..." badge when an AI opponent is targeted by pendingInteraction', () => {
    mockStoreState = {
      pendingInteraction: {
        type: 'choice',
        sourceCardName: 'Green Dragon',
        target: 'npc_1',
        options: [
          { label: 'Pay 5 Gold', value: 'pay-gold', cost: 5 }
        ]
      },
      phase: 'opponent-turn'
    };

    const html = renderToString(
      <MultiplayerSeats
        players={mockPlayers}
        focusedOpponentIndex={1}
        activePlayer="npc_2"
        currentLeader="npc_2"
        lastCardPlayed={null}
        onSelectOpponent={() => {}}
      />
    );

    expect(html).toContain('Resolving Power...');
    expect(html).toContain('Kava');
  });

  it('renders "Thinking..." indicator on active AI player seat chip when not targeted', () => {
    mockStoreState = {
      pendingInteraction: null,
      phase: 'opponent-turn'
    };

    const html = renderToString(
      <MultiplayerSeats
        players={mockPlayers}
        focusedOpponentIndex={1}
        activePlayer="npc_1"
        currentLeader="npc_1"
        lastCardPlayed={null}
        onSelectOpponent={() => {}}
      />
    );

    expect(html).toContain('Thinking...');
    expect(html).not.toContain('Resolving Power...');
  });
});
