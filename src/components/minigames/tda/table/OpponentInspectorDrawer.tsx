import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../../../assets/icons';
import Card from '../Card';
import NPC from '../../../NPC';
import { PlayerState, CardData, GamePhase } from '../../../../types';
import { NPC_LIST } from '../../../../utils/npcConstants';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import { playSound } from '../../../../services/soundService';

interface OpponentInspectorDrawerProps {
  isDrawerOpen: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  autoOpenDrawer?: boolean;
  onToggleAutoOpen?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
  autoOpenDrawer = false,
  onToggleAutoOpen,
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
          {/* Backdrop overlay for smaller screens (only when expanded) */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-[125] pointer-events-auto"
            />
          )}

          {isCollapsed ? (
            /* COLLAPSED DOCKED SIDEBAR */
            <motion.div
              key="docked-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-12 sm:w-14 h-full border-l border-stone-800 bg-stone-950/95 backdrop-blur-md shadow-[-10px_0_30px_rgba(0,0,0,0.85)] z-[130] flex flex-col items-center justify-between py-4 pointer-events-auto"
              role="region"
              aria-label="Docked Opponent Inspector"
            >
              {/* Top Expand / Un-dock Button */}
              <button
                onClick={() => {
                  playSound('UI_CLICK');
                  if (onToggleCollapse) onToggleCollapse();
                }}
                aria-label="Expand Inspector Drawer"
                aria-expanded={false}
                className="p-2.5 text-amber-500 hover:text-amber-400 hover:bg-stone-800/80 rounded-lg border border-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Expand Inspector Drawer"
              >
                <GameIcon name="chevron_left" size={20} />
              </button>

              {/* Center Opponent Info Badge */}
              <div className="flex flex-col items-center gap-3 my-auto py-4">
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-amber-600/50 bg-stone-900 overflow-hidden shadow-md">
                  <NPC
                    npc={NPC_LIST.find(n => n.id === focusedOpponent.npcId) || NPC_LIST[0]}
                    emotion={focusedOpponent.emotion || 'neutral'}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                  {activePlayer === focusedOpponent.id && (
                    <div className="absolute inset-0 bg-amber-500/20 animate-pulse border border-amber-400 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] text-amber-200 font-serif font-bold uppercase tracking-widest writing-mode-vertical rotate-180 max-h-32 truncate">
                  {focusedOpponent.name}
                </span>
              </div>

              {/* Bottom Close Button */}
              <button
                onClick={() => {
                  playSound('UI_CLICK');
                  onClose();
                }}
                aria-label="Close Inspector"
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-800/80 rounded-lg border border-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Close Inspector"
              >
                <GameIcon name="close" size={18} />
              </button>
            </motion.div>
          ) : (
            /* EXPANDED FULL DRAWER */
            <motion.div
              key="expanded-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-[420px] sm:w-[420px] h-full border-l border-stone-800 bg-stone-950/98 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.85)] z-[130] flex flex-col pointer-events-auto"
              role="dialog"
              aria-label={`Inspecting Opponent ${focusedOpponent.name}`}
            >
              {/* Drawer Header with Navigation, Dock, and Close Buttons */}
              <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/40">
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

                  {/* Dock / Collapse Button */}
                  {onToggleCollapse && (
                    <button
                      onClick={() => {
                        playSound('UI_CLICK');
                        onToggleCollapse();
                      }}
                      aria-label="Dock Inspector Drawer"
                      aria-expanded={true}
                      className="p-2.5 hover:bg-stone-800 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors text-amber-500 hover:text-amber-400 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
                      title="Dock / Collapse Drawer"
                    >
                      <GameIcon name="panel" size={18} />
                    </button>
                  )}

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

              {/* Subheader Options Bar: Auto-Open Settings Toggle */}
              {onToggleAutoOpen && (
                <div className="px-5 py-2.5 bg-stone-900/60 border-b border-stone-800/80 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Auto-open on AI turns
                  </span>
                  <button
                    onClick={() => {
                      playSound('UI_CLICK');
                      onToggleAutoOpen();
                    }}
                    role="switch"
                    aria-checked={autoOpenDrawer}
                    aria-label="Toggle auto-open on AI turns"
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors min-h-[36px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      autoOpenDrawer
                        ? 'bg-amber-950/80 text-amber-400 border-amber-600/60 shadow-sm'
                        : 'bg-stone-800/60 text-stone-400 border-stone-700/50 hover:text-stone-200'
                    }`}
                  >
                    <span>{autoOpenDrawer ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              )}

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
                  aria-label="Close Inspector Drawer"
                  className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg border border-stone-700 transition-all text-xs font-bold uppercase tracking-widest min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
