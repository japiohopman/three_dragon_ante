import React from 'react';
import { GameIcon } from '../../../../assets/icons';
import Card from '../Card';
import { CardData } from '../../../../types';
import { playSound } from '../../../../services/soundService';

interface TavernRightAsideProps {
  gambitsPlayed: number;
  round: number;
  maxGambits: number;
  history: string[];
  showLog: boolean;
  setShowLog: (show: boolean) => void;
  onInspect: () => void;
  discardPile: CardData[];
  onOpenDiscard: () => void;
}

export const TavernRightAside: React.FC<TavernRightAsideProps> = ({
  gambitsPlayed,
  round,
  maxGambits,
  history,
  showLog,
  setShowLog,
  onInspect,
  discardPile,
  onOpenDiscard
}) => {
  return (
    <aside className="w-56 lg:w-64 xl:w-72 2xl:w-80 h-full border-l border-stone-800 bg-stone-900/40 flex flex-col z-20 backdrop-blur-md shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex-shrink-0 transition-all duration-300">
        {/* Stakes Header */}
        <div className="p-3 sm:p-4 lg:p-5 xl:p-6 border-b border-stone-800 bg-stone-950/40">
            <div className="flex flex-col">
                <span className="text-[9px] xl:text-[10px] uppercase tracking-[0.3em] xl:tracking-[0.4em] text-stone-500 font-bold mb-1 xl:mb-2">Round Info</span>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-lg lg:text-xl xl:text-2xl text-stone-200 font-gothic tracking-widest leading-none">Gambit {gambitsPlayed + 1}</span>
                        <span className="text-[9px] xl:text-[10px] text-stone-500 uppercase mt-0.5 xl:mt-1 font-bold">Round {round} of Match</span>
                    </div>
                    <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-lg border border-amber-900/30 bg-amber-950/20 flex flex-col items-center justify-center">
                        <span className="text-[7px] xl:text-[8px] text-amber-600 uppercase font-bold">Goals</span>
                        <span className="text-lg xl:text-xl text-amber-500 font-gothic">{maxGambits}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* History / Log Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-3 sm:px-4 lg:px-5 xl:px-6 py-2.5 xl:py-4 flex items-center justify-between bg-stone-950/20 border-b border-stone-800">
                 <div className="flex items-center gap-1.5 xl:gap-2">
                     <GameIcon name="scroll" size={12} className="text-amber-700" />
                     <span className="text-[9px] xl:text-[10px] uppercase font-bold tracking-widest text-stone-500 truncate">Tavern Records</span>
                 </div>
                 <div className="flex gap-1.5 xl:gap-2">
                     <button
                         onClick={onInspect}
                         className="text-[8px] xl:text-[9px] uppercase tracking-widest text-amber-500 hover:text-amber-400 font-bold px-2 py-1 border border-stone-800 hover:border-amber-500/50 bg-amber-950/20 rounded-md transition-colors flex items-center gap-1"
                     >
                         <GameIcon name="search" size={10} /> Inspect
                     </button>
                     <button onClick={() => setShowLog(!showLog)} className="text-[8px] xl:text-[9px] uppercase tracking-widest text-stone-500 hover:text-stone-400 font-bold px-1.5 xl:px-2 py-1 border border-stone-800 rounded-md transition-colors">
                         {showLog ? 'Hide' : 'Show'}
                     </button>
                 </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-3 sm:p-4 xl:p-6 space-y-3 xl:space-y-4 custom-scrollbar transition-opacity duration-300 ${showLog ? 'opacity-100' : 'opacity-0'}`}>
                {history.slice().reverse().map((entry, idx) => (
                    <div key={idx} className="flex gap-3 group">
                        <div className="w-1 h-auto bg-stone-800 rounded-full group-first:bg-amber-700/50" />
                        <p className="text-[11px] font-mono text-stone-400 leading-snug italic group-first:text-stone-300 group-first:not-italic">
                            {entry}
                        </p>
                    </div>
                ))}
            </div>
        </div>

        {/* DISCARD PILE (Bottom Right Corner of Aside) */}
        <div className="p-6 border-t border-stone-800 bg-stone-950/20">
            <div
              className="flex items-center justify-end gap-4 group cursor-pointer text-right"
              onClick={onOpenDiscard}
            >
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500">Discard Pile</span>
                    <span className="text-xs text-stone-400 font-serif italic">{discardPile.length} Burned Cards</span>
                </div>
                <div className="relative">
                    <div className="absolute -inset-1 bg-red-500/0 group-hover:bg-red-500/5 rounded-lg transition-all" />
                    <div className="transform rotate-[3deg] transition-transform group-hover:rotate-0">
                        {discardPile.length > 0 ? (
                            <Card card={discardPile[discardPile.length - 1]} size="sm" disabled brightness-50 shape="standard" className="shadow-xl" />
                        ) : (
                            <div className="w-20 h-28 border-2 border-dashed border-stone-800 rounded-lg flex items-center justify-center">
                                <GameIcon name="skull" size={16} className="text-stone-900" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </aside>
  );
};
