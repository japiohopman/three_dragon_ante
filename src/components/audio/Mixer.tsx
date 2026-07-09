
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getIcon } from '../../assets/icons';
import { playSound } from '../../services/soundService';
import { useAudioStore, AudioCategory } from '../../store/useAudioStore';

interface MixerProps {
  onClose: () => void;
}

const Mixer: React.FC<MixerProps> = ({ onClose }) => {
  const {
    categoryVolumes,
    setCategoryVolume,
    masterVolume,
    setMasterVolume,
    autoDuckingEnabled,
    setAutoDucking
  } = useAudioStore();

  const handleVolumeChange = (category: AudioCategory, value: number) => {
    setCategoryVolume(category, value);

    // Play a test sound for SFX when adjusting
    if (category === 'sfx') {
      playSound('UI_HOVER');
    }
  };

  const categories: { id: AudioCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'music', label: 'Music', icon: getIcon('minigames', 'music', { size: 16 }) },
    { id: 'ambience', label: 'Ambience', icon: getIcon('minigames', 'flame', { size: 16 }) },
    { id: 'sfx', label: 'Effects', icon: getIcon('minigames', 'dices', { size: 16 }) },
    { id: 'voice', label: 'Voice', icon: getIcon('minigames', 'mic', { size: 16 }) },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 20 }}
        className="fixed top-20 right-6 z-[100] w-72 bg-stone-950/90 border border-amber-900/40 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] p-8 backdrop-blur-xl border-t-amber-500/20"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h3 className="text-amber-200 font-gothic text-xl tracking-widest uppercase leading-none">Audio Mixer</h3>
            <span className="text-[10px] text-stone-500 font-mono tracking-tighter uppercase mt-1">Real-time balancing</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-stone-900/50 rounded-full border border-stone-800 text-stone-500 hover:text-amber-400 hover:border-amber-500/50 transition-all group"
          >
            {getIcon('minigames', 'x', { size: 16, className: 'group-hover:rotate-90 transition-transform' })}
          </button>
        </div>

        <div className="space-y-8">
          {/* Master Volume */}
          <div className="space-y-3 pb-6 border-b border-white/5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-amber-500/60">
              <span className="flex items-center gap-2">
                {getIcon('minigames', 'volume', { size: 14 })}
                Master Gain
              </span>
              <span className="font-mono text-amber-200">{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-900 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all border border-stone-800 shadow-inner"
            />
          </div>

          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-3 group">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-stone-500 group-hover:text-stone-300 transition-colors">
                  <span className="flex items-center gap-2">
                    <span className="text-amber-500/40 group-hover:text-amber-500/70 transition-colors">{cat.icon}</span>
                    {cat.label}
                  </span>
                  <span className="text-stone-600 font-mono group-hover:text-amber-500/80 transition-colors">{Math.round(categoryVolumes[cat.id] * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={categoryVolumes[cat.id]}
                  onChange={(e) => handleVolumeChange(cat.id, parseFloat(e.target.value))}
                  className="w-full h-1 bg-stone-900 rounded-full appearance-none cursor-pointer accent-stone-600 hover:accent-amber-600 transition-all"
                />
              </div>
            ))}
          </div>

          {/* Ducking Toggle */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Background Ducking</span>
              <span className="text-[8px] text-stone-600 leading-none mt-1">Lower music when narrating</span>
            </div>
            <button
              onClick={() => setAutoDucking(!autoDuckingEnabled)}
              className={`w-12 h-6 rounded-full transition-all p-1 ${autoDuckingEnabled ? 'bg-amber-600/40 border border-amber-500/50' : 'bg-stone-900 border border-stone-800'}`}
            >
              <motion.div
                animate={{ x: autoDuckingEnabled ? 24 : 0 }}
                className={`w-4 h-4 rounded-full shadow-lg ${autoDuckingEnabled ? 'bg-amber-100' : 'bg-stone-700'}`}
              />
            </button>
          </div>
        </div>

        <div className="mt-10 pt-4 border-t border-amber-900/10 text-[9px] text-stone-700 text-center uppercase tracking-[0.3em] font-mono">
          Antigravity Sound Engine v2.0
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Mixer;
