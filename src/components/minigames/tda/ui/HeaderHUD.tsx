import React from 'react';
import { useGameStore } from '../../../../store/useGameStore';
import { GameIcon } from '../../../../assets/icons';
import { CardData } from '../../../../types';
import { playSound } from '../../../../services/soundService';
import CurrencyDisplay from './CurrencyDisplay';

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
  const { playerGold, playerHand, fixGameState, phase, players, activePlayerIndex, pendingInteraction } = useGameStore();

  const activeP = players[activePlayerIndex];

  const getPhaseBadge = () => {
    if (pendingInteraction) {
      if (pendingInteraction.target === 'player') {
        return { label: 'ACTION REQUIRED', color: 'bg-purple-950/90 border-purple-400 text-purple-200 animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.4)]', icon: '⚡' };
      }
      return { label: 'AI RESOLVING', color: 'bg-purple-950/70 border-purple-500/60 text-purple-300', icon: '⏳' };
    }
    if (phase === 'ante-selection') {
      return { label: 'ANTE PHASE', color: 'bg-amber-950/80 border-amber-500/80 text-amber-200', icon: '✨' };
    }
    if (phase === 'ante-reveal') {
      return { label: 'ANTE REVEAL', color: 'bg-amber-900/60 border-amber-600/60 text-amber-300', icon: '👁️' };
    }
    if (phase === 'player-turn' || (phase === 'round-start' && activeP?.id === 'player')) {
      return { label: 'YOUR TURN', color: 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]', icon: '⚔️' };
    }
    if (phase === 'opponent-turn' || (phase === 'round-start' && activeP?.isNpc)) {
      const name = activeP?.name ? activeP.name.toUpperCase() : 'AI';
      return { label: `${name}'S TURN`, color: 'bg-blue-950/80 border-blue-500/70 text-blue-200', icon: '🤖' };
    }
    if (phase === 'round-resolution') {
      return { label: 'RESOLVING ROUND', color: 'bg-amber-950/60 border-amber-600/60 text-amber-300', icon: '📜' };
    }
    if (phase === 'gambit-end') {
      return { label: 'GAMBIT COMPLETE', color: 'bg-amber-900/80 border-amber-400 text-amber-100', icon: '🏆' };
    }
    return { label: 'IN MATCH', color: 'bg-stone-900 border-stone-700 text-stone-300', icon: '🎮' };
  };

  const badge = getPhaseBadge();

  return (
    <div className="w-full h-14 sm:h-16 bg-stone-950/95 border-b border-amber-900/30 shadow-2xl backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 pointer-events-auto relative z-[100]">

      {/* LEFT: SESSION INFO & UTILITIES */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold mb-0.5">Session Purse</span>
              <div className="flex items-center gap-3">
                   <CurrencyDisplay copper={playerGold} variant="compact" title="Session Purse" />
                   <div className="h-4 w-px bg-stone-800" />
                   <div className="flex items-center gap-2">
                       <button
                          onClick={fixGameState}
                          aria-label="Fix Game State"
                          className={`p-1.5 bg-stone-900 rounded border border-stone-800 text-stone-500 hover:text-amber-500 hover:border-amber-900/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 ${longTurn ? 'animate-pulse ring-1 ring-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : ''}`}
                          title="Fix Game State"
                       >
                               <GameIcon name="wrench" size={14} />
                       </button>
                       <button
                          onClick={() => {
                              playSound('UI_CLICK');
                              onExit?.();
                          }}
                          aria-label="Give up and exit match"
                          className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/40 text-red-500/70 hover:text-red-400 text-[9px] uppercase tracking-widest border border-red-900/30 hover:border-red-500/50 rounded transition-all font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 min-h-[32px]"
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
                  <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 ${badge.color}`}>
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                      </span>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className={`text-xs sm:text-sm font-serif italic ${isAiThinking ? 'text-amber-400 animate-pulse' : pendingInteraction?.target === 'player' ? 'text-purple-200 font-semibold' : 'text-stone-300'}`}>
                          {getPhaseInstruction()}
                      </span>
                      {isAiThinking && <GameIcon name="thinking" size={14} className="text-amber-500 animate-spin" />}
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
                       <div className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                           playerHand.length >= 10
                             ? 'bg-red-950/80 border-red-500/80 text-red-300 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                             : playerHand.length >= 8
                             ? 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                             : 'bg-stone-900 border-stone-800 text-stone-400'
                       }`} title={playerHand.length >= 10 ? "Hand Limit Reached (10/10)" : `Hand Cards: ${playerHand.length}/10`}>
                           <GameIcon name="hand" size={10} className={playerHand.length >= 10 ? 'text-red-400' : playerHand.length >= 8 ? 'text-amber-400' : 'text-stone-500'} />
                           <span className="text-[10px] font-mono font-bold">
                             {playerHand.length}/10
                           </span>
                           {playerHand.length >= 10 && (
                             <span className="text-[8px] font-bold uppercase tracking-wider bg-red-900/80 text-red-200 px-1 rounded ml-0.5">FULL</span>
                           )}
                       </div>
                       <span className="text-sm font-serif font-bold text-blue-400 uppercase tracking-widest">Player</span>
                   </div>
                   <button
                      onClick={() => setShowRules(true)}
                      aria-label="Open Rulebook (Shortcut: ? or H)"
                      className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 border border-amber-800/60 hover:border-amber-500/80 rounded-md transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 min-h-[32px]"
                      title="Open Rulebook (Shortcut: ? or H)"
                   >
                       <GameIcon name="scroll" size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
                       <span>Rules</span>
                       <span className="text-[10px] opacity-60 font-mono bg-stone-900/80 px-1 py-0.2 rounded border border-stone-800 ml-0.5">?</span>
                   </button>
              </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-900/40 border border-blue-500/50 flex items-center justify-center shadow-lg">
              <GameIcon name="user" size={20} className="text-blue-300" />
          </div>
      </div>
    </div>
  );
};
