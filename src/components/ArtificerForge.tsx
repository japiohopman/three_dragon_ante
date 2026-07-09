
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getIcon } from '../assets/icons';
import { GeminiService } from '../services/geminiService';
import { playSound } from '../services/soundService';
import { NPCData } from '../types';

const ArtificerForge: React.FC = () => {
  const [theme, setTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNPC, setGeneratedNPC] = useState<NPCData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleGenerate = async () => {
    if (!theme.trim()) return;

    setIsGenerating(true);
    setSaveStatus('idle');
    playSound('UI_CLICK');

    const npc = await GeminiService.generateNPC(theme);
    if (npc) {
        // Add missing fields if any (fallback for older model responses)
        const enrichedNpc: NPCData = {
            ...npc,
            isGambler: npc.isGambler ?? true,
            stats: npc.stats ?? { strength: 10, dexterity: 10, intelligence: 10, wisdom: 10, charisma: 10 },
            matrixUrl: npc.matrixUrl ?? `https://raw.githubusercontent.com/japiohopman/artificer/main/public/assets/images/npcs/images/${npc.id}_matrix.png`,
            personality: npc.personality ?? "A mysterious stranger who appeared in the Forge."
        };
      setGeneratedNPC(enrichedNpc);
      playSound('SUMMON_PORTRAIT');
    }

    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!generatedNPC) return;

    setIsSaving(true);
    playSound('UI_CLICK');

    const result = await GeminiService.pushToVault(generatedNPC);

    if (result.success) {
      playSound('FEEDBACK_SUCCESS');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } else {
      playSound('FEEDBACK_FAIL');
      setSaveStatus('error');
    }

    setIsSaving(false);
  };

  const StatIcon = ({ type, value }: { type: string, value: number }) => {
    const icons: Record<string, React.ReactNode> = {
        strength: getIcon('minigames', 'sword', { size: 14, className: "text-red-400" }),
        dexterity: getIcon('minigames', 'zap', { size: 14, className: "text-yellow-400" }),
        intelligence: getIcon('minigames', 'brain', { size: 14, className: "text-blue-400" }),
        wisdom: getIcon('minigames', 'shield', { size: 14, className: "text-green-400" }),
        charisma: getIcon('minigames', 'message_square', { size: 14, className: "text-purple-400" })
    };

    return (
        <div className="flex items-center gap-2 bg-stone-900/50 px-2 py-1 rounded border border-stone-800">
            {icons[type]}
            <span className="text-[10px] font-mono text-stone-300 uppercase">{type.slice(0, 3)}</span>
            <span className="text-xs font-bold text-amber-100">{value}</span>
        </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 bg-stone-900/95 rounded-2xl border-2 border-stone-800 backdrop-blur-xl max-w-2xl w-full shadow-2xl relative overflow-hidden">
      {/* Decorative Forge Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#f59e0b_0%,transparent_50%)]"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="text-center relative z-10">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-4 mb-4"
        >
          <div className="p-3 bg-amber-900/20 rounded-full border border-amber-500/20">
            {getIcon('minigames', 'hammer', { size: 32, className: "text-amber-500" })}
          </div>
          <h2 className="text-4xl font-sans font-bold text-amber-50 text-shadow-sm tracking-tight">Artificer Forge</h2>
        </motion.div>
        <p className="text-stone-400 font-serif italic text-sm max-w-sm mx-auto">
            "Crafting living legends from the whispers of the multiverse. Every soul needs a story."
        </p>
      </div>

      <div className="w-full space-y-4 relative z-10">
        <div className="relative group">
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Theme (e.g. 'Shadow Thief', 'Ancient Druid')..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-6 py-4 text-amber-100 placeholder:text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all shadow-inner"
          />
          {getIcon('ui', 'magic', { className: "absolute right-4 top-1/2 -translate-y-1/2 text-stone-700 group-focus-within:text-amber-500/50 transition-colors", size: 20 })}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !theme.trim()}
          className={`w-full py-4 rounded-xl font-sans font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden ${
            isGenerating
              ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
              : 'bg-amber-600 text-stone-950 hover:bg-amber-500 active:scale-[0.98] shadow-[0_4px_20px_rgba(245,158,11,0.2)]'
          }`}
        >
          {isGenerating ? (
            <>
              {getIcon('minigames', 'refresh', { size: 20, className: "animate-spin" })}
              Forging Identity...
            </>
          ) : (
            <>
              {getIcon('minigames', 'user_plus', { size: 20 })}
              Summon Entity
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
      {generatedNPC && (
        <motion.div
            key={generatedNPC.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-6 shadow-xl relative z-10"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold text-amber-400 leading-none tracking-tight">{generatedNPC.name}</h3>
                {generatedNPC.isGambler && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                        {getIcon('ui', 'roll_dice', { size: 10 })} Gambler
                    </div>
                )}
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-stone-900 rounded border border-stone-800 text-stone-500">
                  {generatedNPC.race}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-stone-900 rounded border border-stone-800 text-stone-500">
                  {generatedNPC.role}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-xl border border-stone-800 flex items-center justify-center bg-stone-900 shadow-inner">
               <span className="text-amber-500 font-sans font-bold text-2xl">{generatedNPC.name[0]}</span>
            </div>
          </div>

          <div className="bg-stone-900/30 rounded-xl p-4 border border-stone-800/50">
            <p className="text-stone-300 font-serif italic text-sm leading-relaxed">
                "{generatedNPC.personality}"
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <StatIcon type="strength" value={generatedNPC.stats.strength} />
            <StatIcon type="dexterity" value={generatedNPC.stats.dexterity} />
            <StatIcon type="intelligence" value={generatedNPC.stats.intelligence} />
            <StatIcon type="wisdom" value={generatedNPC.stats.wisdom} />
            <StatIcon type="charisma" value={generatedNPC.stats.charisma} />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || saveStatus === 'success'}
              className={`flex-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                saveStatus === 'success'
                   ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                   : 'bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300'
              }`}
            >
              {isSaving ? getIcon('minigames', 'refresh', { size: 14, className: "animate-spin" }) : (
                  saveStatus === 'success' ? getIcon('minigames', 'check_circle', { size: 14 }) : getIcon('minigames', 'save', { size: 14 })
              )}
              {saveStatus === 'success' ? 'Added to Registry' : 'Commit to Vault'}
            </button>
            <button
              className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-600 transition-all hover:text-stone-300 flex items-center justify-center gap-2 group"
              title="Push to GitHub"
            >
              {getIcon('minigames', 'github', { size: 16, className: "group-hover:scale-110 transition-transform" })}
              <span className="text-[10px] font-bold uppercase tracking-tighter">Repo</span>
            </button>
          </div>

          {saveStatus === 'error' && (
              <div className="text-[10px] text-red-500 flex items-center gap-1 justify-center animate-pulse">
                  {getIcon('minigames', 'alert', { size: 10 })} Vault Connection Failed. Is GITHUB_TOKEN set?
              </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default ArtificerForge;
