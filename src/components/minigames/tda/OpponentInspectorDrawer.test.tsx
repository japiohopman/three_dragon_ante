import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OpponentInspectorDrawer } from './table/OpponentInspectorDrawer';
import { PlayerState } from '../../../types';

const mockPlayers: PlayerState[] = [
  {
    id: 'player',
    name: 'You',
    gold: 500,
    hand: [],
    flight: [],
    ante: null,
    isNpc: false,
    emotion: 'neutral',
    npcLine: '',
    isTalking: false
  },
  {
    id: 'npc_1',
    name: 'Aris',
    npcId: 'aris',
    gold: 450,
    hand: [{ id: 'c1', name: 'Gold Dragon', type: 'good', color: 'gold', strength: 11, description: 'Test', spriteIndex: 0 }],
    flight: [],
    ante: null,
    isNpc: true,
    emotion: 'neutral',
    npcLine: '',
    isTalking: false
  }
];

describe('OpponentInspectorDrawer Component', () => {
  it('renders expanded inspector drawer with accessibility labels, header controls, and auto-open switch', () => {
    const html = renderToString(
      <OpponentInspectorDrawer
        isDrawerOpen={true}
        isCollapsed={false}
        onToggleCollapse={() => {}}
        autoOpenDrawer={false}
        onToggleAutoOpen={() => {}}
        focusedOpponent={mockPlayers[1]}
        players={mockPlayers}
        activePlayer="npc_1"
        phase="opponent-turn"
        lastCardPlayed={null}
        direction={0}
        prevOpponent={() => {}}
        nextOpponent={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Inspecting Opponent Aris"');
    expect(html).toContain('Inspecting Opponent');
    expect(html).toContain('Aris');
    expect(html).toContain('Auto-open on AI turns');
    expect(html).toContain('title="Dock / Collapse Drawer"');
    expect(html).toContain('title="Close Inspector"');
  });

  it('renders collapsed docked sidebar when isCollapsed is true without blocking table view', () => {
    const html = renderToString(
      <OpponentInspectorDrawer
        isDrawerOpen={true}
        isCollapsed={true}
        onToggleCollapse={() => {}}
        autoOpenDrawer={true}
        onToggleAutoOpen={() => {}}
        focusedOpponent={mockPlayers[1]}
        players={mockPlayers}
        activePlayer="npc_1"
        phase="opponent-turn"
        lastCardPlayed={null}
        direction={0}
        prevOpponent={() => {}}
        nextOpponent={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Docked Opponent Inspector"');
    expect(html).toContain('title="Expand Inspector Drawer"');
    expect(html).not.toContain('role="dialog"');
  });

  it('does not render anything when isDrawerOpen is false', () => {
    const html = renderToString(
      <OpponentInspectorDrawer
        isDrawerOpen={false}
        isCollapsed={false}
        focusedOpponent={mockPlayers[1]}
        players={mockPlayers}
        activePlayer={null}
        phase="player-turn"
        lastCardPlayed={null}
        direction={0}
        prevOpponent={() => {}}
        nextOpponent={() => {}}
        onClose={() => {}}
      />
    );

    expect(html).toBe('');
  });
});
