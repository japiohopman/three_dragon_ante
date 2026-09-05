import { describe, it, expect } from 'vitest';
import React from 'react';
import {
  ALL_ICON_DEFS,
  UI_ICONS,
  MINIGAME_ICONS,
  CURRENCY_ICONS,
  DICE_ICONS,
  getIconDefinition,
} from './index';
import { GameIcon } from '../../game_icons';

describe('Solo SVG Icon System Registry', () => {
  it('autodiscovers and registers SVG files into ALL_ICON_DEFS', () => {
    expect(Object.keys(ALL_ICON_DEFS).length).toBeGreaterThan(0);
    expect(ALL_ICON_DEFS['close']).toBeDefined();
    expect(ALL_ICON_DEFS['gold_coin']).toBeDefined();
    expect(ALL_ICON_DEFS['play_card']).toBeDefined();
    expect(ALL_ICON_DEFS['d20']).toBeDefined();
  });

  it('populates categorized icon maps correctly', () => {
    expect(UI_ICONS['close']).toBeDefined();
    expect(MINIGAME_ICONS['play_card']).toBeDefined();
    expect(CURRENCY_ICONS['gold_coin']).toBeDefined();
    expect(DICE_ICONS['d20']).toBeDefined();
  });

  it('retrieves icon definitions by canonical or normalized name', () => {
    const closeDef = getIconDefinition('close');
    expect(closeDef).toBeDefined();
    expect(closeDef?.category).toBe('ui');

    const chevronLeftDef = getIconDefinition('chevron-left');
    expect(chevronLeftDef).toBeDefined();
    expect(chevronLeftDef?.name).toBe('chevron_left');
  });

  it('returns undefined for non-existent icons', () => {
    expect(getIconDefinition('non_existent_fake_icon_xyz')).toBeUndefined();
  });

  it('prevents duplicate filename collisions across categories (e.g. move)', () => {
    const actionMove = getIconDefinition('action/move');
    const editorMove = getIconDefinition('editor/move');

    expect(actionMove).toBeDefined();
    expect(editorMove).toBeDefined();
    expect(actionMove?.category).toBe('action');
    expect(editorMove?.category).toBe('editor');
    expect(actionMove?.fullPath).not.toBe(editorMove?.fullPath);

    // Ambiguous bare name 'move' must NOT resolve to an arbitrary category
    const ambiguousMove = getIconDefinition('move');
    expect(ambiguousMove).toBeUndefined();
  });

  it('allows category-qualified lookups with slashes or colons', () => {
    const minigamePaper = getIconDefinition('minigame:paper');
    expect(minigamePaper).toBeDefined();
    expect(minigamePaper?.category).toBe('minigame');
  });
});

describe('GameIcon Component', () => {
  it('creates React element for canonical icon name', () => {
    const element = React.createElement(GameIcon, { name: 'close', size: 24, color: '#ff0000' });
    expect(element).toBeDefined();
    expect(element.type).toBe(GameIcon);
    expect(element.props.name).toBe('close');
  });

  it('renders SVG for canonical icon name', () => {
    const element = GameIcon({ name: 'close', size: 24 });
    expect(element).not.toBeNull();
    expect(element?.type).toBe('svg');
    expect(element?.props.width).toBe(24);
  });

  it('handles empty icon name gracefully', () => {
    const element = GameIcon({ name: '' });
    expect(element).toBeNull();
  });

  it('handles unknown icon name gracefully', () => {
    const element = GameIcon({ name: 'unknown_icon_xyz_123' });
    expect(element).toBeNull();
  });

  it('does NOT resolve fuzzy or partial icon names', () => {
    const partialElement = GameIcon({ name: 'clo' });
    expect(partialElement).toBeNull();

    const draElement = GameIcon({ name: 'dra' });
    expect(draElement).toBeNull();
  });

  it('resolves normalized dash and underscore names identically', () => {
    const dashElement = GameIcon({ name: 'chevron-left' });
    const underscoreElement = GameIcon({ name: 'chevron_left' });

    expect(dashElement).not.toBeNull();
    expect(underscoreElement).not.toBeNull();
  });

  it('resolves category-qualified names in GameIcon', () => {
    const actionMove = GameIcon({ name: 'action/move' });
    const editorMove = GameIcon({ name: 'editor/move' });

    expect(actionMove).not.toBeNull();
    expect(editorMove).not.toBeNull();

    // Ambiguous bare move returns null
    const bareMove = GameIcon({ name: 'move' });
    expect(bareMove).toBeNull();
  });

  it('resolves defined legacy aliases correctly', () => {
    const thinking = GameIcon({ name: 'thinking' });
    expect(thinking).not.toBeNull();

    const gold = GameIcon({ name: 'gold' });
    expect(gold).not.toBeNull();
  });
});
