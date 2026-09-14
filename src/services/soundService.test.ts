import { describe, it, expect, vi } from 'vitest';
import { SOUND_CONFIG, playSound } from './soundService';
import * as AudioManager from '../components/AudioManager';

describe('soundService', () => {
  it('defines PHASE_TRANSITION and DECISION_PROMPT in SOUND_CONFIG', () => {
    expect(SOUND_CONFIG.PHASE_TRANSITION).toBeDefined();
    expect(SOUND_CONFIG.PHASE_TRANSITION.path).toContain('tda_phase_transition.mp3');
    expect(SOUND_CONFIG.PHASE_TRANSITION.volume).toBeGreaterThan(0);

    expect(SOUND_CONFIG.DECISION_PROMPT).toBeDefined();
    expect(SOUND_CONFIG.DECISION_PROMPT.path).toContain('tda_decision_prompt.mp3');
    expect(SOUND_CONFIG.DECISION_PROMPT.volume).toBeGreaterThan(0);
  });

  it('triggers playSFX when playSound is called', () => {
    const playSFXSpy = vi.spyOn(AudioManager, 'playSFX').mockImplementation(() => {});

    playSound('PHASE_TRANSITION');
    expect(playSFXSpy).toHaveBeenCalled();
    expect(playSFXSpy.mock.calls[0][0]).toContain('tda_phase_transition.mp3');

    playSound('DECISION_PROMPT');
    expect(playSFXSpy).toHaveBeenCalledTimes(2);
    expect(playSFXSpy.mock.calls[1][0]).toContain('tda_decision_prompt.mp3');

    playSFXSpy.mockRestore();
  });
});
