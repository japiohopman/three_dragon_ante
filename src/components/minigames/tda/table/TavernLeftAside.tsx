import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../../../assets/icons';
import NPC from '../../../NPC';
import Card from '../Card';
import { SPRITE_MAP } from '../../../../utils/constants';
import { NPC_LIST } from '../../../../utils/npcConstants';
import { fromCopper, Money } from '../../../../utils/currency';
import { NPCEmotion } from '../../../../types';

interface TavernLeftAsideProps {
  npcId: string;
  opponentEmotion: NPCEmotion;
  isTalking: boolean;
  npcLine: string;
  activePlayer: string | null;
  getNPCName: () => string;
  currentLeader: string | null;
  opponentGold: number;
  deckLength: number;
  onOpenDeck: () => void;
}

export const TavernLeftAside: React.FC<TavernLeftAsideProps> = ({
  npcId,
  opponentEmotion,
  isTalking,
  npcLine,
  activePlayer,
  getNPCName,
  currentLeader,
  opponentGold,
  deckLength,
  onOpenDeck
}) => {
  const deckBackCard = {
    id: 'deck-back',
    name: 'Deck',
    strength: 0,
    type: 'mortal' as const,
    color: 'none' as const,
    spriteIndex: SPRITE_MAP.CardBack,
    description: ''
  };

  return (
    <aside className="w-96 h-full border-r border-stone-800 bg-stone-900/40 flex flex-col z-20 backdrop-blur-md shadow-2xl">
        {/* Tavern Header */}
        <div className="p-6 border-b border-stone-800 bg-stone-950/40">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.4em] text-amber-500/60 font-bold mb-1">The Dragon's Flagon</span>
                <span className="text-xl text-stone-200 font-serif leading-tight">Emerald Enclave</span>
                <div className="flex items-center gap-2 mt-2 opacity-60">
                    <GameIcon name="place" size={10} className="text-stone-500" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Baldur's Gate</span>
                </div>
            </div>
        </div>

        {/* NPC Detail Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
            <div className="flex flex-col items-center">
                <div className="relative w-full aspect-[3/2] rounded-2xl border-4 border-amber-900/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-stone-950 group">
                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                      <NPC
                        npc={NPC_LIST.find(n => n.id === npcId) || NPC_LIST[0]}
                        emotion={opponentEmotion}
                        width={480}
                        height={320}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    {/* Speech Bubble */}
                    <AnimatePresence>
                      {isTalking && npcLine && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, x: -20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: -20 }}
                          className="absolute -right-24 top-1/4 z-50 bg-stone-100 text-stone-900 px-4 py-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[180px] max-w-[240px] border-2 border-stone-800"
                        >
                          <p className="font-serif italic text-[11px] leading-tight">"{npcLine}"</p>
                          {/* Bubble Tail */}
                          <div className="absolute -left-2 top-4 w-4 h-4 bg-stone-100 rotate-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {activePlayer === 'opponent' && (
                      <div className="absolute top-3 right-3 bg-stone-900/90 rounded-full p-2 border border-amber-500/50 shadow-xl animate-pulse">
                          <GameIcon name="thinking" size={16} className="text-amber-500" />
                      </div>
                    )}
                </div>

                <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <h3 className="text-2xl text-amber-500 font-serif tracking-tight">{getNPCName()}</h3>
                        {currentLeader === 'opponent' && <GameIcon name="crown" size={16} className="text-amber-400" />}
                    </div>
                    <p className="text-xs text-stone-500 italic px-2 leading-relaxed">
                        "A seasoned traveler from the Underdark, known for a quick hand and a sharper tongue."
                    </p>
                </div>
            </div>

            {/* NPC Currency Display */}
            <div className="bg-stone-950/60 rounded-xl p-4 border border-stone-800">
                <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
                     <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Enemy Purse</span>
                     <GameIcon name="gold_coin" size={14} className="text-amber-600" />
                </div>
                {(() => {
                    const oppWealth: Money = fromCopper(opponentGold, true);
                    return (
                        <div className="grid grid-cols-5 gap-1 text-center">
                            <div className={`flex flex-col ${oppWealth.pp > 0 ? '' : 'opacity-30'}`}>
                                <span className="text-[8px] uppercase text-stone-500 font-bold">PP</span>
                                <span className="font-gothic text-sm text-slate-200">{oppWealth.pp}</span>
                            </div>
                            <div className={`flex flex-col ${oppWealth.gp > 0 ? '' : 'opacity-30'}`}>
                                <span className="text-[8px] uppercase text-stone-500 font-bold">GP</span>
                                <span className="font-gothic text-sm text-amber-500">{oppWealth.gp}</span>
                            </div>
                            <div className={`flex flex-col ${oppWealth.ep > 0 ? '' : 'opacity-30'}`}>
                                <span className="text-[8px] uppercase text-stone-500 font-bold">EP</span>
                                <span className="font-gothic text-sm text-cyan-500">{oppWealth.ep}</span>
                            </div>
                            <div className={`flex flex-col ${oppWealth.sp > 0 ? '' : 'opacity-30'}`}>
                                <span className="text-[8px] uppercase text-stone-500 font-bold">SP</span>
                                <span className="font-gothic text-sm text-stone-400">{oppWealth.sp}</span>
                            </div>
                            <div className={`flex flex-col ${oppWealth.cp > 0 ? '' : 'opacity-30'}`}>
                                <span className="text-[8px] uppercase text-stone-500 font-bold">CP</span>
                                <span className="font-gothic text-sm text-amber-700">{oppWealth.cp}</span>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>

        {/* DECK (Bottom Left Corner of Aside) */}
        <div className="p-6 border-t border-stone-800 bg-stone-950/20">
            <div
              className="flex items-center gap-4 group cursor-pointer"
              onClick={onOpenDeck}
            >
                <div className="relative">
                    <div className="absolute -inset-1 bg-amber-500/0 group-hover:bg-amber-500/10 rounded-lg transition-all" />
                    <div className="transform rotate-[-3deg] transition-transform group-hover:rotate-0">
                        <Card card={deckBackCard} size="sm" isFaceUp={false} disabled shape="mirrored" className="shadow-xl" />
                    </div>
                    <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 bg-stone-900 border border-stone-700 rounded-full w-8 h-8 flex items-center justify-center shadow-lg ring-2 ring-stone-950">
                        <span className="text-[11px] font-mono font-bold text-amber-500">{deckLength}</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500">Tavern Deck</span>
                    <span className="text-xs text-stone-400 font-serif italic">Shuffle & Draw</span>
                </div>
            </div>
        </div>
    </aside>
  );
};
