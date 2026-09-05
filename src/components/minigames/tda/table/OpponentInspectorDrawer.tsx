import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../../../assets/icons';
import Card from '../Card';
import NPC from '../../../NPC';
import { PlayerState, CardData, GamePhase } from '../../../../types';
import { NPC_LIST } from '../../../../utils/npcConstants';
import { fromCopper, Money } from '../../../../utils/currency';
import { playSound } from '../../../../services/soundService';

interface OpponentInspectorDrawerProps {
  isDrawerOpen: boolean;
  focusedOpponent: PlayerState | null;
  players: PlayerState[];
  activePlayer: string | null;
  phase: GamePhase;
  lastCardPlayed: CardData | null;
  direction: number;
  prevOpponent: () => void;
  nextOpponent: () => void;
  onClose: () => void;
}

export const OpponentInspectorDrawer: React.FC<OpponentInspectorDrawerProps> = ({
  isDrawerOpen,
  focusedOpponent,
  players,
  activePlayer,
  phase,
  lastCardPlayed,
  direction,
  prevOpponent,
  nextOpponent,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isDrawerOpen && focusedOpponent && (
        <>
          {/* Backdrop overlay for smaller screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-[125] pointer-events-auto"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-[420px] sm:w-[420px] h-full border-l border-stone-800 bg-stone-950/98 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.85)] z-[130] flex flex-col pointer-events-auto"
          >
            {/* Drawer Header with Navigation and Close Button */}
            <div className="p-4 sm:p-6 border-b border-stone-800 flex items-center justify-between bg-stone-900/40">
                <button
                  onClick={prevOpponent}
                  disabled={players.length <= 2}
                  className="p-2 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-stone-800 hover:border-stone-700 transition-colors text-amber-500"
                  title="Previous Opponent"
                >
                    <GameIcon name="chevron_left" size={18} />
                </button>

                <div className="text-center flex flex-col mx-2 min-w-0">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-0.5">Inspecting Opponent</span>
                    <span className="text-base sm:text-lg text-amber-100 font-serif font-bold uppercase tracking-widest truncate">{focusedOpponent.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                      onClick={nextOpponent}
                      disabled={players.length <= 2}
                      className="p-2 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-stone-800 hover:border-stone-700 transition-colors text-amber-500"
                      title="Next Opponent"
                    >
                        <GameIcon name="chevron_right" size={18} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-stone-800 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors text-stone-400 hover:text-white"
                      title="Close Inspector"
                    >
                        <GameIcon name="close" size={18} />
                    </button>
                </div>
            </div>

            {/* Drawer Body - Panning Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 relative overflow-x-hidden">

                {/* Panning Container */}
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={focusedOpponent.id}
                      custom={direction}
                      variants={{
                        enter: (dir: number) => ({
                          x: dir > 0 ? 150 : -150,
                          opacity: 0
                        }),
                        center: {
                          x: 0,
                          opacity: 1
                        },
                        exit: (dir: number) => ({
                          x: dir < 0 ? 150 : -150,
                          opacity: 0
                        })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'tween', duration: 0.2 }}
                      className="flex flex-col gap-6 w-full"
                    >
                        {/* Animated NPC Avatar */}
                        <div className="relative w-full aspect-[4/3] rounded-xl border-2 border-stone-800 bg-stone-900 overflow-hidden shadow-lg">
                            <NPC
                              npc={NPC_LIST.find(n => n.id === focusedOpponent.npcId) || NPC_LIST[0]}
                              emotion={focusedOpponent.emotion || 'neutral'}
                              width={400}
                              height={300}
                              className="w-full h-full object-cover"
                            />
                            {activePlayer === focusedOpponent.id && (
                                <div className="absolute top-3 right-3 bg-amber-600/90 rounded-full p-2 border border-amber-400 shadow-xl animate-pulse">
                                    <GameIcon name="thinking" size={16} className="text-stone-950" />
                                </div>
                            )}
                        </div>

                        {/* Coinage Purse */}
                        <div className="bg-stone-900/60 rounded-xl p-4 border border-stone-800">
                            <div className="flex items-center justify-between mb-2 border-b border-stone-800 pb-1">
                                 <span className="text-[9px] text-stone-500 uppercase font-bold tracking-widest">Enemy Purse</span>
                                 <GameIcon name="gold_coin" size={12} className="text-amber-500" />
                            </div>
                            {(() => {
                                const oppWealth: Money = fromCopper(focusedOpponent.gold, true);
                                return (
                                    <div className="grid grid-cols-5 gap-1 text-center">
                                        <div className={`flex flex-col ${oppWealth.pp > 0 ? '' : 'opacity-30'}`}>
                                            <span className="text-[8px] uppercase text-stone-500 font-bold">PP</span>
                                            <span className="font-gothic text-xs text-slate-200">{oppWealth.pp}</span>
                                        </div>
                                        <div className={`flex flex-col ${oppWealth.gp > 0 ? '' : 'opacity-30'}`}>
                                            <span className="text-[8px] uppercase text-stone-500 font-bold">GP</span>
                                            <span className="font-gothic text-xs text-amber-500">{oppWealth.gp}</span>
                                        </div>
                                        <div className={`flex flex-col ${oppWealth.ep > 0 ? '' : 'opacity-30'}`}>
                                            <span className="text-[8px] uppercase text-stone-500 font-bold">EP</span>
                                            <span className="font-gothic text-xs text-cyan-500">{oppWealth.ep}</span>
                                        </div>
                                        <div className={`flex flex-col ${oppWealth.sp > 0 ? '' : 'opacity-30'}`}>
                                            <span className="text-[8px] uppercase text-stone-500 font-bold">SP</span>
                                            <span className="font-gothic text-xs text-stone-400">{oppWealth.sp}</span>
                                        </div>
                                        <div className={`flex flex-col ${oppWealth.cp > 0 ? '' : 'opacity-30'}`}>
                                            <span className="text-[8px] uppercase text-stone-500 font-bold">CP</span>
                                            <span className="font-gothic text-xs text-amber-700">{oppWealth.cp}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Ante & Flight Section */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Ante Card */}
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold mb-2">Ante Card</span>
                                {focusedOpponent.ante ? (
                                    <Card card={focusedOpponent.ante} size="sm" isFaceUp={phase !== 'ante-selection'} />
                                ) : (
                                    <div className="w-24 h-32 border-2 border-dashed border-stone-800 rounded-lg flex items-center justify-center bg-stone-900/20">
                                        <span className="text-[8px] text-stone-600 uppercase font-bold tracking-widest">No Ante</span>
                                    </div>
                                )}
                            </div>

                            {/* Hand Count */}
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold mb-2">Hand Size</span>
                                <div className="flex flex-col items-center justify-center h-32 w-24 bg-stone-900/30 border border-stone-800 rounded-xl relative overflow-hidden">
                                    <span className="text-4xl font-gothic text-stone-300 mb-1">{focusedOpponent.hand.length}</span>
                                    <span className="text-[8px] text-stone-500 uppercase tracking-widest font-bold">Cards</span>
                                    {/* Face down cards overlay effect */}
                                    <div className="absolute -bottom-8 opacity-10 flex gap-1">
                                        <div className="w-8 h-12 bg-amber-900 rounded transform rotate-[-10deg]" />
                                        <div className="w-8 h-12 bg-amber-900 rounded transform rotate-[10deg]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flight Cards list */}
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold mb-3">Flight Played</span>
                            <div className="flex flex-wrap gap-2.5 justify-center py-2 bg-stone-900/20 rounded-xl border border-stone-800 min-h-[100px] items-center px-4">
                                {focusedOpponent.flight.map((c) => (
                                    <div key={c.id} className="transform hover:scale-105 transition-transform">
                                        <Card card={c} size="sm" glow={lastCardPlayed?.id === c.id ? 'red' : 'none'} />
                                    </div>
                                ))}
                                {focusedOpponent.flight.length === 0 && (
                                    <span className="text-[10px] text-stone-600 uppercase font-bold tracking-widest italic">Flight is empty</span>
                                )}
                            </div>
                        </div>

                    </motion.div>
                </AnimatePresence>

            </div>

            {/* Drawer Footer with close button */}
            <div className="p-4 border-t border-stone-800 flex justify-center bg-stone-900/20">
                <button
                  onClick={() => {
                      playSound('UI_CLICK');
                      onClose();
                  }}
                  className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg border border-stone-700 transition-all text-xs font-bold uppercase tracking-widest"
                >
                    Close Inspector
                </button>
            </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
