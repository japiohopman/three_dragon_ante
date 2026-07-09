import { create } from 'zustand';

export type AudioCategory = 'music' | 'ambience' | 'sfx' | 'voice';

interface AudioState {
  masterVolume: number;
  categoryVolumes: Record<AudioCategory, number>;
  isMuted: boolean;
  isDucking: boolean; // Transient state (active when speaking)
  autoDuckingEnabled: boolean; // User setting

  // Settings
  setMasterVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioCategory, volume: number) => void;
  toggleMute: () => void;
  setDucking: (isDucking: boolean) => void;
  setAutoDucking: (enabled: boolean) => void;

  // Playback state
  currentMusic: string | null;
  currentAmbient: string | null;

  playMusic: (url: string) => void;
  playAmbient: (url: string) => void;
  stopMusic: () => void;
  stopAmbient: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  masterVolume: 1.0,
  categoryVolumes: {
    music: 0.37,
    ambience: 0.13,
    sfx: 0.7,
    voice: 0.8
  },
  isMuted: false,
  isDucking: false,
  autoDuckingEnabled: true,

  setMasterVolume: (volume) => set({ masterVolume: volume }),
  setCategoryVolume: (category, volume) => set((state) => ({
    categoryVolumes: { ...state.categoryVolumes, [category]: volume }
  })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setDucking: (isDucking) => set({ isDucking }),
  setAutoDucking: (enabled) => set({ autoDuckingEnabled: enabled }),

  currentMusic: null,
  currentAmbient: null,

  playMusic: (url) => set({ currentMusic: url }),
  playAmbient: (url) => set({ currentAmbient: url }),
  stopMusic: () => set({ currentMusic: null }),
  stopAmbient: () => set({ currentAmbient: null }),
}));
