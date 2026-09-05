import React from 'react';
import { GameIcon } from '../../../../assets/icons';
import { GambitResult } from '../../../../types';
import { playSound } from '../../../../services/soundService';
import { formatPrice, fromCopper, calculateCurrencyWeight, formatMoney } from '../../../../utils/currency';

interface EndGameModalProps {
  isGambitEnd: boolean;
  isGameOver: boolean;
  gambitResult: GambitResult | null;
  playerGold: number;
  opponentGold: number;
  npcName: string;
  startNextGambit: () => void;
  resetGame: () => void;
  onExit?: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  isGambitEnd,
  isGameOver,
  gambitResult,
  playerGold,
  opponentGold,
  npcName,
  startNextGambit,
  resetGame,
  onExit
}) => {
  if (isGambitEnd && gambitResult) {
    return (
      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[200] pointer-events-auto animate-in fade-in duration-700">
           <div className={`p-6 rounded-full border-4 mb-6 ${gambitResult.winnerId === 'player' ? 'border-blue-500 bg-blue-900/30' : 'border-red-500 bg-red-900/30'}`}>
               {gambitResult.winnerId === 'player' ? <GameIcon name="trophy" size={64} className="text-blue-400" /> : <GameIcon name="skull" size={64} className="text-red-500" />}
           </div>

           <h2 className="text-4xl font-gothic text-stone-100 mb-2">
               {gambitResult.winnerId === 'player' ? 'Gambit Won!' : `${gambitResult.winnerName} Won`}
           </h2>

           <p className="text-lg text-stone-400 italic mb-8">{gambitResult.reason}</p>

           <div className="flex flex-col gap-2 mb-8 w-full max-w-lg bg-stone-900/50 border border-stone-800 p-6 rounded-xl text-center">
               <h4 className="text-xs uppercase tracking-widest text-stone-500 mb-4 font-bold">Flight Strengths</h4>
               {gambitResult.scores.map((score) => (
                   <div key={score.playerId} className="flex justify-between items-center py-1 border-b border-stone-800/40 last:border-0">
                       <span className={`text-base font-serif ${score.playerId === 'player' ? 'text-blue-400 font-bold' : 'text-stone-300'}`}>
                           {score.name} {score.playerId === 'player' && '(You)'}
                       </span>
                       <span className="font-gothic text-xl text-stone-100">{score.strength}</span>
                   </div>
               ))}
           </div>

           <div
             className="flex items-center gap-2 text-amber-400 font-gothic text-2xl mb-8 cursor-help"
             title={`Pot Won: ${formatPrice(gambitResult.potWon)} (${formatMoney(fromCopper(gambitResult.potWon, true))}) — Weight: ${calculateCurrencyWeight(fromCopper(gambitResult.potWon, true)).toFixed(2)} lbs`}
           >
               <GameIcon name="currency/coins" size={28} className="text-amber-400" />
               <span>{gambitResult.winnerId === 'player' ? `+${formatPrice(gambitResult.potWon)}` : `-${formatPrice(gambitResult.potWon)}`}</span>
           </div>

           <button
            onClick={() => {
                playSound('UI_CLICK');
                startNextGambit();
            }}
            className="px-8 py-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-100 rounded shadow-lg flex items-center gap-3 transition-colors text-lg"
           >
               <GameIcon name="refresh" size={24} /> Start Next Gambit
           </button>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-[200] pointer-events-auto animate-in zoom-in duration-500">
           {playerGold > opponentGold ? (
               <>
                   <GameIcon name="crown" size={80} className="text-yellow-400 mb-6 drop-shadow-lg animate-pulse" />
                   <h2 className="text-6xl font-gothic text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 to-yellow-200 mb-4">VICTORY</h2>
                   <p className="text-2xl text-stone-300 mb-2">Match Complete!</p>
                   <p className="text-lg text-stone-400 mb-8">You have bested {npcName} with {formatPrice(playerGold)}.</p>
               </>
           ) : (
               <>
                   <GameIcon name="skull" size={80} className="text-stone-500 mb-6 drop-shadow-lg" />
                   <h2 className="text-6xl font-gothic text-stone-600 mb-4">DEFEAT</h2>
                   <p className="text-2xl text-stone-400 mb-2">Match Complete.</p>
                   <p className="text-lg text-stone-500 mb-8">{npcName} wins with {formatPrice(opponentGold)}.</p>
               </>
           )}

           <button
            onClick={() => {
                playSound('UI_CLICK');
                resetGame();
                if (onExit) onExit();
            }}
            className="px-8 py-4 bg-stone-800 border border-stone-600 hover:bg-stone-700 text-stone-200 rounded text-xl shadow-lg transition-all"
           >
               Return to Lobby
           </button>
      </div>
    );
  }

  return null;
};
