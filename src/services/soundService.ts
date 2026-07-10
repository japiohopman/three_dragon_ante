
import { useAudioStore } from '../store/useAudioStore';
import { playSFX } from '../components/AudioManager';

const RAW_GITHUB_URL = 'https://raw.githubusercontent.com/japiohopman/artificer/main/public/assets/sounds/';

export const SOUND_CONFIG = {
  // Music
  THE_MAGES_STUDY: { path: `${RAW_GITHUB_URL}music/the_Mages_study2.mp3`, category: 'music', volume: 0.6 },

  // Ambient
  TAVERN_AMBIENCE_01: { path: `${RAW_GITHUB_URL}ambient/tavern_ambience_01.mp3`, category: 'ambience', volume: 0.5 },
  TAVERN_AMBIENCE_OLD: { path: 'environment/tavern_ambience.mp3', category: 'ambience', volume: 0.4 },
  DRAFTY_CELLAR: { path: 'environment/drafty_cellar.mp3', category: 'ambience', volume: 0.3 },

  // UI
  UI_HOVER: { path: 'System/ui_menu_hover.mp3', category: 'sfx', volume: 0.5 },
  UI_CLICK: { path: 'System/ui_button_click.mp3', category: 'sfx', volume: 0.6 },
  UI_MODAL_OPEN: { path: 'System/ui_modal_open.mp3', category: 'sfx', volume: 0.6 },
  UI_MODAL_CLOSE: { path: 'System/ui_modal_close.mp3', category: 'sfx', volume: 0.5 },
  UI_BACK: { path: 'System/ui_back_exit.mp3', category: 'sfx', volume: 0.5 },
  PANEL_SLIDE: { path: 'System/panel_slide.mp3', category: 'sfx', volume: 0.5 },
  TAB_SWITCH: { path: 'System/tab_switch.mp3', category: 'sfx', volume: 0.4 },

  // Cards
  CARD_SHUFFLE: { path: 'environment/card_shuffle.mp3', category: 'sfx', volume: 0.7 },
  CARD_DEAL: { path: 'environment/card_deal.mp3', category: 'sfx', volume: 0.6 },
  CARD_FLIP: { path: 'environment/card_flip.mp3', category: 'sfx', volume: 0.6 },
  CARD_SLAM: { path: 'environment/card_slam.mp3', category: 'sfx', volume: 0.8 },
  CARD_SLIDE: { path: 'environment/card_slide.mp3', category: 'sfx', volume: 0.5 },

  // TDA Gameplay
  GOLD_GAIN_SMALL: { path: 'environment/gold_gain_small.mp3', category: 'sfx', volume: 0.6 },
  GOLD_GAIN_LARGE: { path: 'environment/gold_gain_large.mp3', category: 'sfx', volume: 0.8 },
  GOLD_LOSS: { path: 'environment/gold_loss.mp3', category: 'sfx', volume: 0.6 },
  COIN_JINGLE: { path: 'environment/coin_jingle_small.mp3', category: 'sfx', volume: 0.5 },
  COIN_SACK: { path: 'environment/coin_sack_heavy.mp3', category: 'sfx', volume: 0.7 },
  TURN_START_PLAYER: { path: 'System/tda_turn_player.mp3', category: 'sfx', volume: 0.7 },
  TURN_START_AI: { path: 'System/tda_turn_ai.mp3', category: 'sfx', volume: 0.5 },
  GAMBIT_WIN: { path: 'System/tda_gambit_win.mp3', category: 'sfx', volume: 0.8 },
  GAMBIT_LOSS: { path: 'System/tda_gambit_loss.mp3', category: 'sfx', volume: 0.7 },
  MATCH_VICTORY: { path: 'System/tda_match_victory.mp3', category: 'sfx', volume: 0.9 },
  MATCH_DEFEAT: { path: 'System/tda_match_defeat.mp3', category: 'sfx', volume: 0.8 },

  // Special VFX
  FIRE_BREATH: { path: 'environment/vfx_fire_breath.mp3', category: 'sfx', volume: 0.7 },
  LIGHTNING_STRIKE: { path: 'environment/vfx_lightning_strike.mp3', category: 'sfx', volume: 0.7 },
  POISON_CLOUD: { path: 'environment/vfx_poison_cloud.mp3', category: 'sfx', volume: 0.6 },
  DIVINE_RAY: { path: 'environment/vfx_divine_ray.mp3', category: 'sfx', volume: 0.7 },
  NECROTIC_PULSE: { path: 'environment/vfx_necrotic_pulse.mp3', category: 'sfx', volume: 0.6 },
  SWORD_SLASH: { path: 'environment/vfx_sword_slash.mp3', category: 'sfx', volume: 0.7 },
  CHROMATIC_SHIFT: { path: 'environment/vfx_chromatic_shift.mp3', category: 'sfx', volume: 0.7 },
  SCREEN_SHAKE: { path: 'environment/vfx_screen_shake.mp3', category: 'sfx', volume: 0.5 },
  ITEM_THUD: { path: 'environment/item_thud.mp3', category: 'sfx', volume: 0.6 },
  SUMMON_PORTRAIT: { path: 'environment/summon_portrait.mp3', category: 'sfx', volume: 0.7 },

  // Mini-Games
  MEMORY_MATCH: { path: 'System/game_memory_match.mp3', category: 'sfx', volume: 0.7 },
  MEMORY_MISMATCH: { path: 'System/game_memory_mismatch.mp3', category: 'sfx', volume: 0.5 },
  SOLITAIRE_STACK: { path: 'environment/game_solitaire_stack.mp3', category: 'sfx', volume: 0.6 },
  SOLITAIRE_WIN: { path: 'System/game_solitaire_win.mp3', category: 'sfx', volume: 0.8 },
  FEEDBACK_SUCCESS: { path: 'System/feedback_success.mp3', category: 'sfx', volume: 0.6 },
  FEEDBACK_FAIL: { path: 'System/feedback_fail.mp3', category: 'sfx', volume: 0.5 },

  // NPC Voice Archetype Placeholders (Future .wav integration)
  VOICE_SAGE: { path: 'voice/sage_generic.wav', category: 'sfx', volume: 0.8 },
  VOICE_WARRIOR: { path: 'voice/warrior_generic.wav', category: 'sfx', volume: 0.8 },
  VOICE_NOBLE: { path: 'voice/noble_generic.wav', category: 'sfx', volume: 0.8 },
  VOICE_SCOUNDREL: { path: 'voice/scoundrel_generic.wav', category: 'sfx', volume: 0.8 },
  VOICE_WORKER: { path: 'voice/worker_generic.wav', category: 'sfx', volume: 0.8 },
  VOICE_HOST: { path: 'voice/host_generic.wav', category: 'sfx', volume: 0.8 },
  VOICE_STALKER: { path: 'voice/stalker_generic.wav', category: 'sfx', volume: 0.8 },
  VOICE_ADEPT: { path: 'voice/adept_generic.wav', category: 'sfx', volume: 0.8 },
  VOICE_WILD: { path: 'voice/wild_generic.wav', category: 'sfx', volume: 0.8 },
} as const;

export type SoundName = keyof typeof SOUND_CONFIG;

const getFinalUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  // Manually encode only the parts that need it, preserving slashes for GitHub Raw
  const encodedPath = path.split('/').map(part => encodeURIComponent(part)).join('/');
  return `${RAW_GITHUB_URL}${encodedPath}`;
};

export const playSound = (soundName: SoundName) => {
  const config = SOUND_CONFIG[soundName];
  if (!config) return;

  const url = getFinalUrl(config.path);
  playSFX(url, config.volume);
};

export const stopSound = (_soundName: SoundName) => {
  // Global SFX stopping is harder with one-shot plays, but we can implement it if needed
};

export const playMusic = (soundName: SoundName) => {
  const config = SOUND_CONFIG[soundName];
  if (!config) return;
  const url = getFinalUrl(config.path);
  useAudioStore.getState().playMusic(url);
};

export const playAmbience = (soundName: SoundName) => {
  const config = SOUND_CONFIG[soundName];
  if (!config) return;
  const url = getFinalUrl(config.path);
  useAudioStore.getState().playAmbient(url);
};

export const resumeAudio = () => {
    // Howler auto-unlocks on click, but we can nudge it
    if (typeof window !== 'undefined' && (window as any).Howler) {
        (window as any).Howler.ctx?.resume();
    }
};
