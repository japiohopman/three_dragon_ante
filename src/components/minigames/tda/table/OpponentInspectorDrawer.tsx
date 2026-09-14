import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../../../assets/icons';
import Card from '../Card';
import NPC from '../../../NPC';
import { PlayerState, CardData, GamePhase } from '../../../../types';
import { NPC_LIST } from '../../../../utils/npcConstants';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import { playSound } from '../../../../services/soundService';
import { useAnimationStore } from '../../../../store/useAnimationStore';
import { FlightCardTooltip } from '../ui/FlightCardTooltip';

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
  autoOpenInspector?: boolean;
  toggleAutoOpenInspector?: () => void;
  onClose: () => void;
  isDimmed?: boolean;
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
  autoOpenInspector = false,
  toggleAutoOpenInspector,
  onClose,
  isDimmed = false
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const { hoveredCardId, setHoveredCard } = useAnimationStore();

  React.useEffect(() => {
    if (isDrawerOpen) {
      setIsCollapsed(false);
    }
  }, [isDrawerOpen]);

  return (
    <AnimatePresence>
      {isDrawerOpen && focusedOpponent && (
        <>
          {/* Docked trigger tab when drawer is collapsed */}
          {isCollapsed ? (
            <motion.button
              key="docked-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => {
                playSound('UI_CLICK');
                setIsCollapsed(false);
              }}
              aria-label="Expand Inspector Drawer"
              title="Expand Inspector Drawer"
              className="fixed top-1/2 -translate-y-1/2 right-0 z-[130] bg-stone-900/95 hover:bg-stone-800 text-amber-400 border-l-2 border-y border-amber-600/50 rounded-l-xl p-3 shadow-2xl flex flex-col items-center gap-2 cursor-pointer transition-all pointer-events-auto group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <GameIcon name="chevron_left" size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200 [writing-mode:vertical-lr] rotate-180">
                Inspect ({focusedOpponent.name})
              </span>
            </motion.button>
          ) : (
            <>
              {/* Dimming backdrop overlay during human decision prompts */}
              {isDimmed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[135] pointer-events-none transition-opacity duration-300"
                />
              )}
              {/* Backdrop overlay for smaller screens */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-[125] ${isDimmed ? 'pointer-events-none' : 'pointer-events-auto'}`}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-0 right-0 w-full max-w-[420px] sm:w-[420px] h-full border-l border-stone-800 bg-stone-950/98 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.85)] z-[130] flex flex-col transition-all duration-300 ${
                  isDimmed ? 'opacity-30 blur-[1px] pointer-events-none' : 'pointer-events-auto'
                }`}
              >
                {/* Drawer Header with Navigation, Collapse, and Close Buttons */}
                <div className="p-4 sm:p-6 border-b border-stone-800 flex items-center justify-between bg-stone-900/40">
                    <button
                      onClick={prevOpponent}
                      disabled={players.length <= 2}
                      aria-label="Inspect Previous Opponent"
                      className="p-2.5 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-stone-800 hover:border-stone-700 transition-colors text-amber-500 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
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
                          aria-label="Inspect Next Opponent"
                          className="p-2.5 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-stone-800 hover:border-stone-700 transition-colors text-amber-500 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
                          title="Next Opponent"
                        >
                            <GameIcon name="chevron_right" size={18} />
                        </button>
                        <button
                          onClick={() => {
                              playSound('UI_CLICK');
                              setIsCollapsed(true);
                          }}
                          aria-label="Collapse to Dock"
                          className="p-2.5 hover:bg-stone-800 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors text-amber-500 hover:text-amber-400 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
                          title="Collapse to Dock"
                        >
                            <GameIcon name="chevron_right" size={18} />
                        </button>
                        <button
                          onClick={onClose}
                          aria-label="Close Inspector"
                          className="p-2.5 hover:bg-stone-800 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors text-stone-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
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
                        <CurrencyDisplay
                          copper={focusedOpponent.gold}
                          variant="purse"
                          title={`${focusedOpponent.name}'s Purse`}
                        />

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
                            <div className="flex flex-wrap gap-2.5 justify-center py-2 bg-stone-900/20 rounded-xl border border-stone-800 min-h-[100px] items-center px-4 relative overflow-visible">
                                {focusedOpponent.flight.map((c) => (
                                    <div
                                        key={c.id}
                                        className="transform hover:scale-105 transition-transform relative cursor-pointer"
                                        onMouseEnter={() => setHoveredCard(c.id)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                    >
                                        <Card card={c} size="sm" glow={lastCardPlayed?.id === c.id ? 'red' : 'none'} />
                                        {hoveredCardId === c.id && (
                                            <FlightCardTooltip card={c} position="top" ownerName={focusedOpponent.name} />
                                        )}
                                    </div>
                                ))}
                                {focusedOpponent.flight.length === 0 && (
                                    <span className="text-[10px] text-stone-600 uppercase font-bold tracking-widest italic">Flight is empty</span>
                                )}
                            </div>
                        </div>

                        {/* Dialogue History log */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                                    <GameIcon name="thinking" size={12} className="text-amber-500" />
                                    Dialogue History
                                </span>
                                {focusedOpponent.speechHistory && focusedOpponent.speechHistory.length > 0 && (
                                    <span className="text-[9px] text-stone-500 font-mono">
                                        {focusedOpponent.speechHistory.length} lines
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 p-3 bg-stone-900/40 rounded-xl border border-stone-800/80 max-h-48 overflow-y-auto custom-scrollbar">
                                {focusedOpponent.speechHistory && focusedOpponent.speechHistory.length > 0 ? (
                                    focusedOpponent.speechHistory.map((entry) => (
                                        <div key={entry.id} className="flex flex-col gap-1 p-2 bg-stone-950/60 rounded-lg border border-stone-800/50">
                                            <p className="text-xs text-amber-100/90 font-serif italic leading-snug">
                                                "{entry.line}"
                                            </p>
                                            <span className="text-[9px] text-stone-500 font-sans tracking-wide self-end">
                                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                    ))
                                ) : focusedOpponent.npcLine ? (
                                    <div className="p-2 bg-stone-950/60 rounded-lg border border-stone-800/50">
                                        <p className="text-xs text-amber-100/90 font-serif italic leading-snug">
                                            "{focusedOpponent.npcLine}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="py-3 text-center">
                                        <span className="text-[10px] text-stone-600 uppercase font-bold tracking-widest italic">No dialogue history recorded</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                </AnimatePresence>

            </div>

            {/* Drawer Footer with auto-open setting toggle and close button */}
            <div className="p-4 border-t border-stone-800 flex flex-col gap-2.5 justify-center bg-stone-900/20">
                {toggleAutoOpenInspector && (
                    <button
                      onClick={() => {
                          playSound('UI_CLICK');
                          toggleAutoOpenInspector();
                      }}
                      className={`w-full py-2.5 px-3 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-widest min-h-[40px] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 ${
                        autoOpenInspector
                          ? 'bg-amber-950/40 border-amber-600/50 text-amber-300 hover:bg-amber-900/50'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-300 hover:bg-stone-800/60'
                      }`}
                      title="Toggle auto-opening inspector during opponent turn"
                    >
                        <GameIcon name="thinking" size={14} />
                        <span>Auto-Open on AI Turn: {autoOpenInspector ? 'ON' : 'OFF'}</span>
                    </button>
                )}
                <button
                  onClick={() => {
                      playSound('UI_CLICK');
                      onClose();
                  }}
                  aria-label="Close Inspector Drawer"
                  className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg border border-stone-700 transition-all text-xs font-bold uppercase tracking-widest min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
                >
                    Close Inspector
                </button>
            </div>
        </motion.div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
