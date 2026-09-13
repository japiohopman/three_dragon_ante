import React from 'react';
import { motion } from 'motion/react';
import Card from '../Card';
import { CardData, GamePhase } from '../../../../types';
import CurrencyDisplay from '../ui/CurrencyDisplay';

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

  const isAnteReveal = phase === 'ante-reveal';

  return (
    <div className="flex-1 w-full flex items-center justify-center gap-3 sm:gap-8 md:gap-12 lg:gap-16 py-1 sm:py-2 px-2">
        <div className={`w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36 border-2 rounded-tl-[25px] sm:rounded-tl-[35px] rounded-br-[25px] sm:rounded-br-[35px] flex items-center justify-center transition-all duration-300 bg-black/30 flex-shrink-0 ${opponentAnte ? 'border-amber-600/60 shadow-[0_0_30px_rgba(0,0,0,0.8)]' : 'border-stone-800/40'} ${isAntePhase ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : ''}`}>
            {opponentAnte ? (
              <motion.div
                key={opponentAnte.id}
                initial={{ opacity: 0, scale: 0.5, y: -30 }}
                animate={{ opacity: 1, scale: 0.85, y: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 140 }}
              >
                <Card card={opponentAnte} isFaceUp={phase !== 'ante-selection'} size="sm" />
              </motion.div>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-stone-700 uppercase font-bold tracking-widest opacity-40 text-center px-1">Opponent Ante</span>
            )}
        </div>

        <motion.div
            key={pot}
            initial={{ scale: 0.95 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`relative bg-stone-950 border-2 p-3 sm:p-4 md:p-5 rounded-full flex flex-col items-center justify-center min-w-[110px] sm:min-w-[140px] transform hover:scale-105 transition-all duration-500 group flex-shrink-0 z-10 ${
                isAnteReveal
                  ? 'border-amber-400 ring-4 ring-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.6),0_20px_50px_rgba(0,0,0,0.9)] scale-105'
                  : 'border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.2),0_20px_50px_rgba(0,0,0,0.9)]'
            }`}
        >
            <div className="absolute -top-3 bg-stone-900 border border-amber-500/80 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full shadow-lg">
                <span className="text-[9px] sm:text-[10px] text-amber-400 font-bold uppercase tracking-[0.3em]">Pot</span>
            </div>
            <CurrencyDisplay copper={pot} variant="pot" />
        </motion.div>

        <div className={`w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36 border-2 rounded-tl-[25px] sm:rounded-tl-[35px] rounded-br-[25px] sm:rounded-br-[35px] flex items-center justify-center transition-all duration-300 bg-black/30 flex-shrink-0 ${playerAnte ? 'border-amber-500/80 shadow-[0_0_30px_rgba(0,0,0,0.8)]' : 'border-stone-800/40'} ${isAntePhase ? 'ring-2 ring-amber-400 border-amber-500/90 shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-offset-2 ring-offset-stone-950 animate-pulse' : ''}`}>
            {playerAnte ? (
              <motion.div
                key={playerAnte.id}
                initial={{ opacity: 0, scale: 0.5, y: 30 }}
                animate={{ opacity: 1, scale: 0.85, y: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 140 }}
              >
                <Card card={playerAnte} size="sm" />
              </motion.div>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-stone-700 uppercase font-bold tracking-widest opacity-40 text-center px-1">Your Ante</span>
            )}
        </div>
    </div>
  );
};
