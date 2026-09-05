import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../../../assets/icons';
import NPC from '../../../NPC';
import Card from '../Card';
import { SPRITE_MAP } from '../../../../utils/constants';
import { NPC_LIST } from '../../../../utils/npcConstants';
import CurrencyDisplay from '../ui/CurrencyDisplay';
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
    <aside className="w-64 lg:w-72 xl:w-80 2xl:w-96 h-full border-r border-stone-800 bg-stone-900/40 flex flex-col z-20 backdrop-blur-md shadow-2xl flex-shrink-0 transition-all duration-300">
        {/* Tavern Header */}
        <div className="p-3 sm:p-4 lg:p-5 xl:p-6 border-b border-stone-800 bg-stone-950/40">
            <div className="flex flex-col">
                <span className="text-[9px] xl:text-[10px] uppercase tracking-[0.3em] xl:tracking-[0.4em] text-amber-500/60 font-bold mb-0.5 xl:mb-1">The Dragon's Flagon</span>
                <span className="text-base lg:text-lg xl:text-xl text-stone-200 font-serif leading-tight truncate">Emerald Enclave</span>
                <div className="flex items-center gap-2 mt-1 xl:mt-2 opacity-60">
                    <GameIcon name="place" size={10} className="text-stone-500" />
                    <span className="text-[9px] xl:text-[10px] uppercase font-bold tracking-widest text-stone-500">Baldur's Gate</span>
                </div>
            </div>
        </div>

        {/* NPC Detail Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 xl:p-8 flex flex-col gap-4 xl:gap-6 custom-scrollbar">
            <div className="flex flex-col items-center">
                <div className="relative w-full aspect-[3/2] rounded-xl xl:rounded-2xl border-2 xl:border-4 border-amber-900/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-stone-950 group">
                    <div className="absolute inset-0 overflow-hidden rounded-lg xl:rounded-xl">
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
                          initial={{ opacity: 0, scale: 0.8, x: -10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: -10 }}
                          className="absolute -right-12 xl:-right-24 top-1/4 z-50 bg-stone-100 text-stone-900 px-3 py-1.5 xl:px-4 xl:py-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[140px] xl:min-w-[180px] max-w-[180px] xl:max-w-[240px] border-2 border-stone-800"
                        >
                          <p className="font-serif italic text-[10px] xl:text-[11px] leading-tight">"{npcLine}"</p>
                          {/* Bubble Tail */}
                          <div className="absolute -left-2 top-4 w-3 h-3 xl:w-4 xl:h-4 bg-stone-100 rotate-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {activePlayer === 'opponent' && (
                      <div className="absolute top-2 right-2 xl:top-3 xl:right-3 bg-stone-900/90 rounded-full p-1.5 xl:p-2 border border-amber-500/50 shadow-xl animate-pulse">
                          <GameIcon name="thinking" size={14} className="text-amber-500" />
                      </div>
                    )}
                </div>

                <div className="mt-2 xl:mt-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-0.5 xl:mb-1">
                        <h3 className="text-lg lg:text-xl xl:text-2xl text-amber-500 font-serif tracking-tight truncate">{getNPCName()}</h3>
                        {currentLeader === 'opponent' && <GameIcon name="crown" size={14} className="text-amber-400" />}
                    </div>
                    <p className="text-[10px] xl:text-xs text-stone-500 italic px-1 xl:px-2 leading-relaxed line-clamp-2">
                        "A seasoned traveler from the Underdark, known for a quick hand and a sharper tongue."
                    </p>
                </div>
            </div>

            {/* NPC Currency Display */}
            <CurrencyDisplay
              copper={opponentGold}
              variant="purse"
              title={`${getNPCName()}'s Purse`}
            />
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
