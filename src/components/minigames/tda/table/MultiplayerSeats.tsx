import React from 'react';
import { GameIcon } from '../../../../assets/icons';
import Card from '../Card';
import { PlayerState, CardData } from '../../../../types';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import { useGameStore } from '../../../../store/useGameStore';

interface MultiplayerSeatsProps {
  players: PlayerState[];
  focusedOpponentIndex: number;
  activePlayer: string | null;
  currentLeader: string | null;
  lastCardPlayed: CardData | null;
  onSelectOpponent: (index: number) => void;
}

export const MultiplayerSeats: React.FC<MultiplayerSeatsProps> = ({
  players,
  focusedOpponentIndex,
  activePlayer,
  currentLeader,
  lastCardPlayed,
  onSelectOpponent
}) => {
  const isMultiplayer = players.length > 2;
  const { pendingInteraction, phase } = useGameStore();

  return (
    <div className={`w-full flex justify-center ${isMultiplayer ? 'gap-1.5 sm:gap-2.5 md:gap-4' : 'gap-4'} px-2 sm:px-6 mb-2 sm:mb-4 min-h-[110px] sm:min-h-[140px] pointer-events-auto flex-wrap md:flex-nowrap`}>
        {players.slice(1).map((opp, index) => {
            const actualIdx = index + 1;
            const isFocused = actualIdx === focusedOpponentIndex;
            const isTurn = activePlayer === opp.id;
            const isTargeted = pendingInteraction?.target === opp.id;

            return (
               <div
                  key={opp.id}
                  onClick={() => onSelectOpponent(actualIdx)}
                  className={`cursor-pointer transition-all duration-300 p-1.5 sm:p-2.5 rounded-xl flex flex-col items-center gap-1 ${isMultiplayer ? 'w-24 sm:w-28 md:w-32 xl:w-36' : 'w-32 sm:w-36'} flex-shrink border-2 relative
                      ${isTurn || isTargeted ? 'scale-105 opacity-100 z-20' : isFocused ? 'scale-100 opacity-100 z-10' : 'scale-95 opacity-75 hover:opacity-100 hover:scale-100 z-0'}
                      ${isTargeted ? 'bg-purple-950/50 border-purple-400 ring-2 ring-purple-500 ring-offset-2 ring-offset-stone-900 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : ''}
                      ${isTurn && !isTargeted ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-500 ring-offset-2 ring-offset-stone-900 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : ''}
                      ${!isTurn && !isTargeted && isFocused ? 'bg-amber-950/25 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : ''}
                      ${!isTurn && !isTargeted && !isFocused ? 'bg-stone-900/50 border-stone-800/80 hover:border-stone-700' : ''}
                  `}
               >
                   {isTargeted && (
                       <div className="absolute -top-2.5 bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider shadow-md animate-bounce flex items-center gap-1">
                           <span>🎯 Choice</span>
                       </div>
                   )}
                   {isTurn && !isTargeted && (
                       <div className="absolute -top-2.5 bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider shadow-md animate-pulse flex items-center gap-1">
                           {phase === 'opponent-turn' ? <span>🧠 Thinking...</span> : <span>Turn</span>}
                       </div>
                   )}

                   <div className="flex items-center gap-1 max-w-full">
                       <span className={`text-[10px] sm:text-[11px] font-serif truncate ${isMultiplayer ? 'max-w-[55px] sm:max-w-[70px] md:max-w-[80px]' : 'max-w-[80px]'} ${isFocused ? 'text-amber-400 font-bold' : 'text-stone-300'}`}>
                           {opp.name}
                       </span>
                       {currentLeader === opp.id && (
                           <span title="Round Leader" className="flex items-center gap-0.5 text-[7px] sm:text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40 flex-shrink-0">
                               <GameIcon name="crown" size={9} className="text-amber-400" /> LDR
                           </span>
                       )}
                   </div>

                   <div className="flex items-center gap-1.5">
                       <div className="flex items-center gap-1 bg-stone-950/60 px-1.5 py-0.5 rounded border border-stone-850">
                           <GameIcon name="hand" size={9} className="text-stone-500" />
                           <span className="text-[9px] font-mono text-stone-400 font-bold">{opp.hand.length}</span>
                       </div>
                       <CurrencyDisplay copper={opp.gold} variant="badge" title={`${opp.name}'s Purse`} />
                   </div>

                   <div className="flex justify-center gap-0.5 min-h-[35px] sm:min-h-[40px] items-center max-w-full overflow-hidden">
                       {opp.flight.map((c) => (
                           <div key={c.id} className="transform scale-[0.35] sm:scale-[0.4] w-5 sm:w-6 h-7 sm:h-8 flex items-center justify-center -mx-2 sm:-mx-1.5">
                               <Card card={c} size="sm" glow={lastCardPlayed?.id === c.id ? 'red' : 'none'} disabled />
                           </div>
                       ))}
                       {opp.flight.length === 0 && (
                           <span className="text-[7px] sm:text-[8px] text-stone-600 uppercase font-bold tracking-widest italic opacity-40">No Flight</span>
                       )}
                   </div>

                   {opp.isTalking && (
                       <div className="absolute -bottom-2 bg-stone-100 text-stone-950 px-1.5 py-0.5 rounded text-[8px] border border-stone-800 shadow-md max-w-[90px] sm:max-w-[100px] truncate z-20">
                           "{opp.npcLine}"
                       </div>
                   )}
               </div>
            );
        })}
    </div>
  );
};
