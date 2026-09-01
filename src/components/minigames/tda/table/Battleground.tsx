import React from 'react';
import { motion } from 'motion/react';
import { getIcon } from '../../../../assets/icons';
import Card from '../Card';
import { CardData, GamePhase } from '../../../../types';
import { formatPrice } from '../../../../utils/currency';

interface BattlegroundProps {
  opponentAnte: CardData | null;
  playerAnte: CardData | null;
  pot: number;
  phase: GamePhase;
}

export const Battleground: React.FC<BattlegroundProps> = ({
  opponentAnte,
  playerAnte,
  pot,
  phase
}) => {
  const isAntePhase = phase === 'ante-selection';

  return (
    <div className="flex-1 w-full flex items-center justify-center gap-16 py-2">
        <div className={`w-28 h-36 border-2 rounded-tl-[35px] rounded-br-[35px] flex items-center justify-center transition-all bg-black/30 ${opponentAnte ? 'border-amber-600/60 shadow-[0_0_30px_rgba(0,0,0,0.8)]' : 'border-stone-800/40'}`}>
            {opponentAnte ? <motion.div key={opponentAnte.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 0.85 }}><Card card={opponentAnte} isFaceUp={phase !== 'ante-selection'} size="sm" /></motion.div> : <span className="text-[10px] text-stone-700 uppercase font-bold tracking-widest opacity-40">Opponent Ante</span>}
        </div>

        <div className="relative bg-stone-950/98 border-2 border-amber-700/40 p-5 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center min-w-[140px] transform hover:scale-105 transition-transform group">
            <div className="absolute -top-3 bg-stone-900 border border-amber-700/50 px-4 py-1 rounded-full shadow-lg">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em]">Pot</span>
            </div>
            <div className="flex items-center gap-3">
                {getIcon('ui', 'gold-coin', { size: 24, className: "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" })}
                <span className="font-gothic text-3xl text-amber-100 drop-shadow-xl">{formatPrice(pot)}</span>
            </div>
        </div>

        <div className={`w-28 h-36 border-2 rounded-tl-[35px] rounded-br-[35px] flex items-center justify-center transition-all bg-black/30 ${playerAnte ? 'border-amber-500/80 shadow-[0_0_30px_rgba(0,0,0,0.8)]' : 'border-stone-800/40'} ${isAntePhase ? 'ring-2 ring-amber-500/30 ring-offset-4 ring-offset-stone-900' : ''}`}>
            {playerAnte ? <motion.div key={playerAnte.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 0.85 }}><Card card={playerAnte} size="sm" /></motion.div> : <span className="text-[10px] text-stone-700 uppercase font-bold tracking-widest opacity-40">Your Ante</span>}
        </div>
    </div>
  );
};
