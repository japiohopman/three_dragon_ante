
import React, { useState } from 'react';
import { NPC_LIST } from '../utils/npcConstants';
import NPC from './NPC';
import { AppMode, NPCEmotion, NPCData } from '../types';
import { getIcon } from '../assets/icons';
import { playSound } from '../services/soundService';
import { getNPCPersona } from '../constants/npcLines';
import { useEffect } from 'react';

const EMOTIONS: NPCEmotion[] = [
  'neutral', 'curious', 'skeptical', 'happy', 'greedy', 'angry', 'sad', 'surprised', 'proud'
];

interface NPCShowcaseProps {
  onSelectGame: (mode: AppMode, npc: NPCData) => void;
}

const NPCShowcase: React.FC<NPCShowcaseProps> = ({ onSelectGame }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState<NPCEmotion>('neutral');
  const [introduction, setIntroduction] = useState<string>("Reading the scroll...");
  const [isLoading, setIsLoading] = useState(false);

  const currentNPC = NPC_LIST[currentIndex];

  useEffect(() => {
    const fetchIntro = () => {
        setIsLoading(true);
        const persona = getNPCPersona(currentNPC.id);
        const intro = persona.seeds.start[Math.floor(Math.random() * persona.seeds.start.length)];
        setIntroduction(intro);
        setIsLoading(false);
    };
    fetchIntro();
  }, [currentIndex, currentEmotion, currentNPC]);

  const nextNPC = () => {
    playSound('UI_CLICK');
    setCurrentIndex((prev) => (prev + 1) % NPC_LIST.length);
  };

  const prevNPC = () => {
    playSound('UI_CLICK');
    setCurrentIndex((prev) => (prev - 1 + NPC_LIST.length) % NPC_LIST.length);
  };

  const StatDot = ({ label, value }: { label: string, value: number }) => (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-mono text-stone-500 uppercase">{label}</span>
      <span className="text-sm font-bold text-amber-200">{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-8 p-8 bg-stone-950/50 rounded-2xl border border-stone-800 backdrop-blur-md max-w-4xl w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-900/20 rounded-full border border-amber-500/30">
            {getIcon('ui', 'user', { className: "text-amber-500", size: 24 })}
          </div>
          <div>
            <h2 className="text-3xl font-gothic text-stone-100 tracking-wider">Meet the Patrons</h2>
            <p className="text-stone-400 font-serif italic text-sm">"Every flagon has a story, and every face a secret."</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { playSound('UI_CLICK'); onSelectGame('forge', currentNPC); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/30 rounded-lg text-amber-200 transition-all font-gothic tracking-widest text-sm mr-4"
          >
            {getIcon('ui', 'hammer', { size: 16 })}
            FORGE NPC
          </button>
          <button
            onClick={prevNPC}
            className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-stone-300 transition-colors"
          >
            {getIcon('ui', 'chevron-left', { size: 20 })}
          </button>
          <button
            onClick={nextNPC}
            className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-stone-300 transition-colors"
          >
            {getIcon('ui', 'chevron-right', { size: 20 })}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full items-center">
        {/* NPC Display */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <NPC
              npc={currentNPC}
              emotion={currentEmotion}
              width={480}
              height={320}
              className="shadow-[0_0_40px_rgba(0,0,0,0.5)] border-amber-900/50"
            />
            {/* Stats Overlay on hover/display */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-stone-900 border border-stone-700 rounded-lg px-6 py-2 shadow-xl flex gap-6 z-30">
              <StatDot label="STR" value={currentNPC.stats.strength} />
              <StatDot label="DEX" value={currentNPC.stats.dexterity} />
              <StatDot label="INT" value={currentNPC.stats.intelligence} />
              <StatDot label="WIS" value={currentNPC.stats.wisdom} />
              <StatDot label="CHA" value={currentNPC.stats.charisma} />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {EMOTIONS.map((emo) => (
              <button
                key={emo}
                onClick={() => { playSound('UI_HOVER'); setCurrentEmotion(emo); }}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest rounded border transition-all duration-200 ${
                  currentEmotion === emo
                    ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]'
                    : 'bg-stone-900 border-stone-700 text-stone-400 hover:border-stone-500'
                }`}
              >
                {emo}
              </button>
            ))}
          </div>
        </div>

        {/* NPC Info */}
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-900/30 text-amber-500 text-[10px] font-mono uppercase rounded border border-amber-500/20">
                {currentNPC.race}
              </span>
              <span className="px-2 py-0.5 bg-stone-800 text-stone-400 text-[10px] font-mono uppercase rounded border border-stone-700">
                {currentNPC.role}
              </span>
              {currentNPC.isGambler && (
                <span className="px-2 py-0.5 bg-green-900/20 text-green-500 text-[10px] font-mono uppercase rounded border border-green-500/20 ml-auto">
                  Gambler
                </span>
              )}
            </div>
            <h3 className="text-5xl font-gothic text-amber-100">{currentNPC.name}</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-600 to-transparent rounded-full" />
            <p className="text-stone-500 text-xs font-serif italic">{currentNPC.personality}</p>
          </div>

          <div className="bg-stone-900/80 p-6 rounded-xl border border-stone-800 relative min-h-[120px] flex items-center shadow-inner">
            {getIcon('ui', 'message-square', { className: "absolute -top-3 -left-3 text-stone-700", size: 24 })}
            {isLoading ? (
                <div className="w-full flex justify-center py-4">
                    {getIcon('ui', 'refresh', { className: "animate-spin text-amber-900/50" })}
                </div>
            ) : (
                <p className="text-stone-300 font-serif italic leading-relaxed">
                "{introduction}"
                </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentNPC.willingToPlay ? (
              <button
                onClick={() => { playSound('UI_CLICK'); onSelectGame('tda', currentNPC); }}
                className="w-full py-4 bg-gradient-to-r from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 text-amber-100 font-gothic text-xl rounded-xl border border-amber-600/50 transition-all duration-300 shadow-lg hover:shadow-amber-900/20 flex items-center justify-center gap-3 group"
              >
                {getIcon('ui', 'roll_dice', { size: 20 })}
                Challenge to Three-Dragon Ante
                {getIcon('ui', 'chevron-right', { size: 20, className: "group-hover:translate-x-1 transition-transform" })}
              </button>
            ) : (
              <div className="w-full py-4 bg-stone-900/50 text-stone-500 font-gothic text-xl rounded-xl border border-stone-800 flex items-center justify-center gap-3 opacity-50 cursor-not-allowed">
                {getIcon('ui', 'alert', { size: 16 })}
                Not willing to play TDA
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { playSound('UI_CLICK'); onSelectGame('memory', currentNPC); }}
                className="py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 font-serif text-sm rounded-lg border border-stone-700 transition-all flex items-center justify-center gap-2"
              >
                {getIcon('ui', 'brain', { size: 16 })}
                Memory Game
              </button>
              <button
                onClick={() => { playSound('UI_CLICK'); onSelectGame('solitaire', currentNPC); }}
                className="py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 font-serif text-sm rounded-lg border border-stone-700 transition-all flex items-center justify-center gap-2"
              >
                {getIcon('ui', 'book-open', { size: 16 })}
                Solitaire
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center gap-1 mt-4">
        {NPC_LIST.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-amber-500' : 'w-2 bg-stone-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default NPCShowcase;
