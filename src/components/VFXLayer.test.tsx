import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import VFXLayer from './VFXLayer';
import { useAnimationStore } from '../store/useAnimationStore';

describe('VFXLayer Component', () => {
  beforeEach(() => {
    useAnimationStore.setState({
      showTurnBanner: false,
      activePlayer: null,
      activeCoins: [],
      floatingTexts: [],
      flashColor: null,
      specialEffect: null,
    });
  });

  it('does not render turn banner when showTurnBanner is false', () => {
    const html = renderToString(<VFXLayer showTurnBanner={false} activePlayer={null} />);
    expect(html).not.toContain('Initiative Gained');
    expect(html).not.toContain('Your Turn');
  });

  it('renders player turn banner with anticipation glow container when activePlayer is player', () => {
    const html = renderToString(<VFXLayer showTurnBanner={true} activePlayer="player" />);
    expect(html).toContain('Initiative Gained');
    expect(html).toContain('Your Turn');
    expect(html).toContain('bg-amber-400/30');
  });

  it('renders opponent turn banner with crimson glow container when activePlayer is an AI opponent', () => {
    const html = renderToString(<VFXLayer showTurnBanner={true} activePlayer="npc_1" />);
    expect(html).toContain('Opponent Action');
    expect(html).toContain("Opponent&#x27;s Turn");
    expect(html).toContain('bg-red-500/25');
  });
});
