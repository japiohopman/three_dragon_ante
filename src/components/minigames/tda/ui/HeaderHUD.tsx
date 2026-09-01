import React from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { getIcon } from '../../../../assets/icons';
import { CardData } from '../../../../types';
import { playSound } from '../../../../services/soundService';
import { fromCopper, Money } from '../../../../utils/currency';

interface HeaderHUDProps {
  onExit?: () => void;
  setShowRules: (show: boolean) => void;
  infoCard?: CardData;
  isAiThinking: boolean;
  getPhaseInstruction: () => string;
  longTurn: boolean;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  onExit,
  setShowRules,
  infoCard,
  isAiThinking,
  getPhaseInstruction,
  longTurn
}) => {
  const { playerGold, playerHand, fixGameState } = useGameStore();

  return (
    <div className="w-full h-16 bg-stone-950/95 border-b border-amber-900/30 shadow-2xl backdrop-blur-xl flex items-center justify-between px-6 pointer-events-auto relative z-[100]">

      {/* LEFT: SESSION INFO & UTILITIES */}
      <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-0.5">Session Purse</span>
              <div className="flex items-center gap-3">
                   {(() => {
                       const w: Money = fromCopper(playerGold, true);
                       return (
                           <div className="flex items-center gap-2.5">
                               {w.pp > 0 && (
                                   <div className="flex items-center gap-1 text-slate-100" title="Platinum Pieces">
                                       {getIcon('ui', 'gold-coin', { size: 14, className: "text-slate-300" })}
                                       <span className="font-gothic text-lg">{w.pp}</span>
                                       <span className="text-[10px] text-slate-400 font-bold">pp</span>
                                   </div>
                               )}
                               {w.gp > 0 && (
                                   <div className="flex items-center gap-1 text-amber-500" title="Gold Pieces">
                                       {getIcon('ui', 'gold-coin', { size: 14, className: "text-amber-500" })}
                                       <span className="font-gothic text-lg">{w.gp}</span>
                                       <span className="text-[10px] text-amber-600 font-bold">gp</span>
                                   </div>
                               )}
                               {w.ep > 0 && (
                                   <div className="flex items-center gap-1 text-cyan-500" title="Electrum Pieces">
                                       {getIcon('ui', 'gold-coin', { size: 14, className: "text-cyan-600" })}
                                       <span className="font-gothic text-lg">{w.ep}</span>
                                       <span className="text-[10px] text-cyan-600 font-bold">ep</span>
                                   </div>
                               )}
                               {w.sp > 0 && (
                                   <div className="flex items-center gap-1 text-stone-400" title="Silver Pieces">
                                       {getIcon('ui', 'gold-coin', { size: 14, className: "text-stone-400" })}
                                       <span className="font-gothic text-lg">{w.sp}</span>
                                       <span className="text-[10px] text-stone-500 font-bold">sp</span>
                                   </div>
                               )}
                               {w.cp > 0 && (
                                   <div className="flex items-center gap-1 text-amber-700" title="Copper Pieces">
                                       {getIcon('ui', 'gold-coin', { size: 14, className: "text-amber-700" })}
                                       <span className="font-gothic text-lg">{w.cp}</span>
                                       <span className="text-[10px] text-amber-800 font-bold">cp</span>
                                   </div>
                               )}
                               {playerGold === 0 && (
                                   <div className="flex items-center gap-1 text-stone-600">
                                       {getIcon('ui', 'gold-coin', { size: 14, className: "text-stone-600" })}
                                       <span className="font-gothic text-lg">0</span>
                                       <span className="text-[10px] text-stone-600 font-bold">cp</span>
                                   </div>
                               )}
                           </div>
                       );
                   })()}
                   <div className="h-4 w-px bg-stone-800" />
                   <div className="flex items-center gap-2">
                       <button
                          onClick={fixGameState}
                          className={`p-1.5 bg-stone-900 rounded border border-stone-800 text-stone-500 hover:text-amber-500 hover:border-amber-900/50 transition-all ${longTurn ? 'animate-pulse ring-1 ring-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : ''}`}
                          title="Fix Game State"
                       >
                           {getIcon('ui', 'wrench', { size: 14 })}
                       </button>
                       <button
                          onClick={() => {
                              playSound('UI_CLICK');
                              onExit?.();
                          }}
                          className="px-3 py-1 bg-red-950/20 hover:bg-red-900/40 text-red-500/70 hover:text-red-400 text-[9px] uppercase tracking-widest border border-red-900/30 hover:border-red-500/50 rounded transition-all font-bold"
                       >
                          Give up
                       </button>
                   </div>
              </div>
          </div>
      </div>

      {/* CENTER: CARD INFORMATION (Multi-functional) */}
      <div className="flex-[2] h-full flex flex-col items-center justify-center border-x border-stone-800/40 px-8 relative overflow-hidden">
          {infoCard ? (
              <div className="flex items-center gap-4 w-full justify-center">
                  <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-widest text-amber-500 font-bold mb-1">Inspecting</span>
                      <div className="flex items-center gap-3">
                          <span className="text-lg text-amber-100 font-serif font-bold uppercase tracking-widest">{infoCard.name}</span>
                          <div className="w-6 h-6 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center">
                              <span className="text-xs font-bold text-amber-400">{infoCard.strength}</span>
                          </div>
                      </div>
                  </div>
                  <div className="h-8 w-px bg-stone-800/60" />
                  <p className="text-[11px] text-stone-400 italic max-w-xs leading-tight line-clamp-2">
                      {infoCard.description || "A mysterious artifact of Draconic power."}
                  </p>
              </div>
          ) : (
              <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-stone-600 font-bold mb-1">Current Directive</span>
                  <div className="flex items-center gap-4">
                      <span className={`text-sm font-serif italic ${isAiThinking ? 'text-amber-500 animate-pulse' : 'text-stone-300'}`}>
                          {getPhaseInstruction()}
                      </span>
                      {isAiThinking && getIcon('ui', 'thinking', { size: 14, className: "text-amber-500" })}
                  </div>
              </div>
          )}
      </div>

      {/* RIGHT: PLAYER PROFILE & MENU */}
      <div className="flex items-center justify-end gap-6 flex-1">
          <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-0.5">Character</span>
              <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5">
                       <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800">
                           {getIcon('ui', 'hand', { size: 10, className: "text-stone-500" })}
                           <span className="text-[10px] font-mono text-stone-400 font-bold">{playerHand.length}</span>
                       </div>
                       <span className="text-sm font-serif font-bold text-blue-400 uppercase tracking-widest">Player</span>
                   </div>
                   <button
                      onClick={() => setShowRules(true)}
                      className="p-1.5 text-stone-500 hover:text-amber-500 transition-colors"
                      title="Rulebook"
                   >
                       {getIcon('ui', 'scroll', { size: 18 })}
                   </button>
              </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-900/40 border border-blue-500/50 flex items-center justify-center shadow-lg">
              {getIcon('ui', 'user', { size: 20, className: "text-blue-300" })}
          </div>
      </div>
    </div>
  );
};
