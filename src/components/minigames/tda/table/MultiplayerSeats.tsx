import React from 'react';
import { GameIcon } from '../../../../assets/icons';
import Card from '../Card';
import { PlayerState, CardData } from '../../../../types';

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
  return (
    <div className="w-full flex justify-center gap-4 px-6 mb-4 min-h-[140px] pointer-events-auto">
        {players.slice(1).map((opp, index) => {
            const actualIdx = index + 1;
            const isFocused = actualIdx === focusedOpponentIndex;
            const isTurn = activePlayer === opp.id;

            return (
               <div
                  key={opp.id}
                  onClick={() => onSelectOpponent(actualIdx)}
                  className={`cursor-pointer transition-all p-2.5 rounded-xl flex flex-col items-center gap-1.5 w-32 sm:w-36 border-2 relative
                      ${isFocused ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'}
                      ${isTurn ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-stone-900 animate-pulse animate-duration-1000' : ''}
                  `}
               >
                   {isTurn && (
                       <div className="absolute -top-2.5 bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider shadow-md animate-pulse">
                           Turn
                       </div>
                   )}

                   <div className="flex items-center gap-1">
                       <span className={`text-[11px] font-serif truncate max-w-[80px] ${isFocused ? 'text-amber-400 font-bold' : 'text-stone-300'}`}>
                           {opp.name}
                       </span>
                       {currentLeader === opp.id && (
                           <span title="Round Leader" className="flex items-center gap-0.5 text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40">
                               <GameIcon name="crown" size={9} className="text-amber-400" /> LEADER
                           </span>
                       )}
                   </div>

                   <div className="flex items-center gap-1 bg-stone-950/60 px-1.5 py-0.5 rounded border border-stone-850">
                       <GameIcon name="hand" size={9} className="text-stone-500" />
                       <span className="text-[9px] font-mono text-stone-400 font-bold">{opp.hand.length}</span>
                   </div>

                   <div className="flex justify-center gap-0.5 min-h-[40px] items-center">
                       {opp.flight.map((c) => (
                           <div key={c.id} className="transform scale-[0.4] w-6 h-8 flex items-center justify-center -mx-1.5">
                               <Card card={c} size="sm" glow={lastCardPlayed?.id === c.id ? 'red' : 'none'} disabled />
                           </div>
                       ))}
                       {opp.flight.length === 0 && (
                           <span className="text-[8px] text-stone-600 uppercase font-bold tracking-widest italic opacity-40">No Flight</span>
                       )}
                   </div>

                   {opp.isTalking && (
                       <div className="absolute -bottom-2 bg-stone-100 text-stone-950 px-1.5 py-0.5 rounded text-[8px] border border-stone-800 shadow-md max-w-[100px] truncate">
                           "{opp.npcLine}"
                       </div>
                   )}
               </div>
            );
        })}
    </div>
  );
};
