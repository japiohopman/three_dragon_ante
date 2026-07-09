import React, { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useAudioStore } from '../store/useAudioStore';

// Helper to convert GitHub URLs to raw URLs
const getRawUrl = (url: string) => {
  if (url.includes('github.com') && url.includes('/blob/')) {
    return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }
  return url;
};

export const AudioManager: React.FC = () => {
  const {
    currentMusic,
    currentAmbient,
    masterVolume,
    categoryVolumes,
    isMuted,
    isDucking
  } = useAudioStore();

  const musicRef = useRef<Howl | null>(null);
  const ambientRef = useRef<Howl | null>(null);
  const currentMusicUrl = useRef<string | null>(null);
  const currentAmbientUrl = useRef<string | null>(null);

  const DUCK_MULTIPLIER = 0.3; // Reduce volume to 30% when ducking

  // Handle Music
  useEffect(() => {
    if (currentMusic) {
      const rawUrl = getRawUrl(currentMusic);

      // Stop previous music if it's different
      if (musicRef.current && currentMusicUrl.current !== rawUrl) {
        musicRef.current.fade(musicRef.current.volume(), 0, 1000);
        const oldMusic = musicRef.current;
        setTimeout(() => oldMusic.stop().unload(), 1000);
        musicRef.current = null;
        currentMusicUrl.current = null;
      }

      if (!musicRef.current) {
        currentMusicUrl.current = rawUrl;
        musicRef.current = new Howl({
          src: [rawUrl],
          loop: true,
          html5: true, // Better for large files
          volume: isMuted ? 0 : masterVolume * categoryVolumes.music * (isDucking ? DUCK_MULTIPLIER : 1),
          autoplay: true,
        });
      }
    } else if (musicRef.current) {
      musicRef.current.fade(musicRef.current.volume(), 0, 1000);
      const oldMusic = musicRef.current;
      setTimeout(() => oldMusic.stop().unload(), 1000);
      musicRef.current = null;
      currentMusicUrl.current = null;
    }
  }, [currentMusic]);

  // Handle Ambient
  useEffect(() => {
    if (currentAmbient) {
      const rawUrl = getRawUrl(currentAmbient);

      if (ambientRef.current && currentAmbientUrl.current !== rawUrl) {
        ambientRef.current.fade(ambientRef.current.volume(), 0, 1000);
        const oldAmbient = ambientRef.current;
        setTimeout(() => oldAmbient.stop().unload(), 1000);
        ambientRef.current = null;
        currentAmbientUrl.current = null;
      }

      if (!ambientRef.current) {
        currentAmbientUrl.current = rawUrl;
        ambientRef.current = new Howl({
          src: [rawUrl],
          loop: true,
          html5: true,
          volume: isMuted ? 0 : masterVolume * categoryVolumes.ambience * (isDucking ? DUCK_MULTIPLIER : 1),
          autoplay: true,
        });
      }
    } else if (ambientRef.current) {
      ambientRef.current.fade(ambientRef.current.volume(), 0, 1000);
      const oldAmbient = ambientRef.current;
      setTimeout(() => oldAmbient.stop().unload(), 1000);
      ambientRef.current = null;
      currentAmbientUrl.current = null;
    }
  }, [currentAmbient]);

  // Update volumes
  useEffect(() => {
    if (musicRef.current) {
      const targetVolume = isMuted ? 0 : masterVolume * categoryVolumes.music * (isDucking ? DUCK_MULTIPLIER : 1);
      musicRef.current.fade(musicRef.current.volume(), targetVolume, 500);
    }
  }, [masterVolume, categoryVolumes.music, isMuted, isDucking]);

  useEffect(() => {
    if (ambientRef.current) {
      const targetVolume = isMuted ? 0 : masterVolume * categoryVolumes.ambience * (isDucking ? DUCK_MULTIPLIER : 1);
      ambientRef.current.fade(ambientRef.current.volume(), targetVolume, 500);
    }
  }, [masterVolume, categoryVolumes.ambience, isMuted, isDucking]);

  return null; // This component doesn't render anything
};

// Global SFX player
export const playSFX = (url: string, volumeScale: number = 1) => {
  const { masterVolume, categoryVolumes, isMuted } = useAudioStore.getState();
  if (isMuted) return;

  const rawUrl = getRawUrl(url);
  const sound = new Howl({
    src: [rawUrl],
    volume: masterVolume * categoryVolumes.sfx * volumeScale,
    onend: () => sound.unload(),
  });
  sound.play();
};

// Global Voice player (can include ducking logic later)
export const playVoice = (url: string, volumeScale: number = 1) => {
  const { masterVolume, categoryVolumes, isMuted, setDucking } = useAudioStore.getState();
  if (isMuted) return;

  const rawUrl = getRawUrl(url);
  const sound = new Howl({
    src: [rawUrl],
    volume: masterVolume * categoryVolumes.voice * volumeScale,
    onplay: () => setDucking(true),
    onend: () => {
      setDucking(false);
      sound.unload();
    },
    onstop: () => {
      setDucking(false);
      sound.unload();
    }
  });
  sound.play();
};
