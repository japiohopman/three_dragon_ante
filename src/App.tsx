
import React, { useState, useEffect } from 'react';
import TableTop from './components/minigames/tda/TableTop';
import GameUI from './components/minigames/tda/GameUI';
import VFXLayer from './components/VFXLayer';
import NPCShowcase from './components/NPCShowcase';
import MemoryGame from './components/minigames/MemoryGame';
import SolitaireGame from './components/minigames/SolitaireGame';
import { useAnimationStore } from './store/useAnimationStore';
import { AppMode, NPCData } from './types';
import { playSound, stopSound, resumeAudio, playMusic, playAmbience } from './services/soundService';
import Mixer from './components/audio/Mixer';
import { AudioManager } from './components/AudioManager';
import { NPC_LIST } from './utils/npcConstants';

import ArtificerForge from './components/ArtificerForge';
import { useGameStore } from './store/useGameStore';

function App() {
  const { shakeIntensity } = useAnimationStore();
  const setNPC = useGameStore(state => state.setNPC);
  const [appMode, setAppMode] = useState<AppMode>('showcase');
  const [activeNPC, setActiveNPC] = useState<NPCData>(NPC_LIST[0]);
  const [isStarted, setIsStarted] = useState(false);
  const [showMixer, setShowMixer] = useState(false);

  useEffect(() => {
    if (!isStarted) return;

    // Handle Ambient Sounds and Music
    if (appMode === 'showcase') {
      playAmbience('TAVERN_AMBIENCE_01');
      playMusic('THE_MAGES_STUDY');
    } else if (appMode === 'tda') {
      playAmbience('DRAFTY_CELLAR');
      playMusic('THE_MAGES_STUDY');
    } else {
      // For other games, keep tavern ambience
      playAmbience('TAVERN_AMBIENCE_01');
      playMusic('THE_MAGES_STUDY');
    }

    return () => {
      // We don't necessarily want to stop music on every mode change if it's the same track
    };
  }, [appMode, isStarted]);

  const handleGameSelect = (mode: AppMode, npc: NPCData) => {
    setAppMode(mode);
    setActiveNPC(npc);
    if (mode === 'tda') {
      setNPC(npc.id);
    }
  };

  // Global click listener to resume audio context if suspended
  useEffect(() => {
    const handleGlobalClick = () => {
      resumeAudio();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleStart = () => {
    console.log('[App] Starting game and resuming audio context...');
    resumeAudio();
    setIsStarted(true);
    playSound('UI_CLICK');
  };

  // Render the active game
  const renderGame = () => {
    if (!isStarted) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-900/30 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center px-6">
                    <h1 className="text-7xl md:text-8xl font-gothic text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-800 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                        THE DRAGON'S FLAGON
                    </h1>
                    <p className="text-stone-400 font-serif italic text-xl mb-12 tracking-widest uppercase">
                        Three-Dragon Ante & Tavern Games
                    </p>

                    <button
                        onClick={handleStart}
                        className="group relative px-12 py-5 bg-stone-900 border-2 border-amber-900/50 hover:border-amber-500 transition-all duration-500 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors duration-500"></div>
                        <span className="relative z-10 text-amber-100 font-gothic text-3xl tracking-widest group-hover:text-amber-400 transition-colors">
                            ENTER THE TAVERN
                        </span>
                    </button>

                    <div className="mt-16 flex gap-8 text-stone-600">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border border-stone-800 rounded-full flex items-center justify-center mb-2">
                                <span className="text-xs">SFX</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-tighter">Enabled</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border border-stone-800 rounded-full flex items-center justify-center mb-2">
                                <span className="text-xs">BGM</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-tighter">Enabled</span>
                        </div>
                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-amber-900/20"></div>
                <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-amber-900/20"></div>
                <div className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-amber-900/20"></div>
                <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-amber-900/20"></div>
            </div>
        );
    }

    switch(appMode) {
        case 'tda':
            return (
                <div className="w-full h-full relative">
                    <GameUI onExit={() => setAppMode('showcase')} />
                    <div className="w-full h-full flex items-center justify-center">
                        <TableTop />
                    </div>
                </div>
            );
        case 'memory':
            return <MemoryGame onBack={() => setAppMode('showcase')} opponent={activeNPC} />;
        case 'solitaire':
            return <SolitaireGame onBack={() => setAppMode('showcase')} />;
        case 'forge':
            return (
                <div className="w-full h-full flex items-center justify-center p-8">
                    <div className="relative">
                        <button
                            onClick={() => setAppMode('showcase')}
                            className="absolute -top-12 left-0 text-amber-500 hover:text-amber-400 flex items-center gap-2 font-gothic tracking-widest text-xl transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            BACK TO PATRONS
                        </button>
                        <ArtificerForge />
                    </div>
                </div>
            );
        case 'showcase':
        default:
            return <NPCShowcase onSelectGame={handleGameSelect} />;
    }
  };

  return (
    <div className={`w-screen h-screen bg-stone-900 overflow-hidden relative wood-texture select-none ${shakeIntensity > 0 ? 'animate-shake' : ''}`}>

      {/* Ambient Lighting Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60 z-30"></div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-30"></div>

      <VFXLayer />
      <AudioManager />

      {/* Audio Mixer Toggle */}
      {isStarted && (
        <button
          onClick={() => setShowMixer(!showMixer)}
          className="absolute bottom-4 left-4 z-50 p-2 bg-stone-900/80 border border-amber-900/30 rounded-full hover:border-amber-500/50 transition-all group"
          title="Audio Mixer"
        >
          <div className="w-6 h-6 flex items-center justify-center text-amber-200/50 group-hover:text-amber-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </div>
        </button>
      )}

      {showMixer && <Mixer onClose={() => setShowMixer(false)} />}

      <main className="w-full h-full relative z-40">
          {renderGame()}
      </main>

    </div>
  );
}

export default App;
