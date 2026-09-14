import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OpponentInspectorDrawer } from './table/OpponentInspectorDrawer';
import { PlayerState } from '../../../types';

const mockOpponent: PlayerState = {
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
};

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
  mockOpponent
];

describe('OpponentInspectorDrawer Component', () => {
  it('renders opponent details when drawer is open', () => {
    const html = renderToString(
      <OpponentInspectorDrawer
        isDrawerOpen={true}
        focusedOpponent={mockOpponent}
        players={mockPlayers}
        activePlayer="npc_1"
        phase="opponent-turn"
        lastCardPlayed={null}
        direction={0}
        prevOpponent={() => {}}
        nextOpponent={() => {}}
        autoOpenInspector={false}
        toggleAutoOpenInspector={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Inspecting Opponent');
    expect(html).toContain('Kava');
    expect(html).toContain('Collapse to Dock');
    expect(html).toContain('Auto-Open on AI Turn:');
    expect(html).toContain('OFF');
  });

  it('renders ON status when autoOpenInspector is true', () => {
    const html = renderToString(
      <OpponentInspectorDrawer
        isDrawerOpen={true}
        focusedOpponent={mockOpponent}
        players={mockPlayers}
        activePlayer="npc_1"
        phase="opponent-turn"
        lastCardPlayed={null}
        direction={0}
        prevOpponent={() => {}}
        nextOpponent={() => {}}
        autoOpenInspector={true}
        toggleAutoOpenInspector={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Auto-Open on AI Turn:');
    expect(html).toContain('ON');
  });

  it('renders speech history lines when speechHistory is provided', () => {
    const opponentWithHistory: PlayerState = {
      ...mockOpponent,
      speechHistory: [
        {
          id: 'entry_1',
          line: 'A dragon rises from the flames!',
          timestamp: 1700000000000,
          emotion: 'happy'
        },
        {
          id: 'entry_2',
          line: 'You dare challenge my strength?',
          timestamp: 1699999900000,
          emotion: 'angry'
        }
      ]
    };

    const html = renderToString(
      <OpponentInspectorDrawer
        isDrawerOpen={true}
        focusedOpponent={opponentWithHistory}
        players={mockPlayers}
        activePlayer="npc_1"
        phase="opponent-turn"
        lastCardPlayed={null}
        direction={0}
        prevOpponent={() => {}}
        nextOpponent={() => {}}
        autoOpenInspector={false}
        toggleAutoOpenInspector={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Dialogue History');
    expect(html).toContain('2');
    expect(html).toContain('lines');
    expect(html).toContain('A dragon rises from the flames!');
    expect(html).toContain('You dare challenge my strength?');
  });

  it('renders fallback state when no dialogue history exists', () => {
    const html = renderToString(
      <OpponentInspectorDrawer
        isDrawerOpen={true}
        focusedOpponent={mockOpponent}
        players={mockPlayers}
        activePlayer="npc_1"
        phase="opponent-turn"
        lastCardPlayed={null}
        direction={0}
        prevOpponent={() => {}}
        nextOpponent={() => {}}
        autoOpenInspector={false}
        toggleAutoOpenInspector={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Dialogue History');
    expect(html).toContain('No dialogue history recorded');
  });
});
