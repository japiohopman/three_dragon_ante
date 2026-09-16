import React, { useEffect, useState } from 'react';
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
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (isGameOver) {
      if (playerGold > opponentGold) {
        playSound('MATCH_VICTORY');
      } else {
        playSound('MATCH_DEFEAT');
      }
    }
  }, [isGameOver, playerGold, opponentGold]);

  if (isGambitEnd && gambitResult) {
    const breakdownItems = gambitResult.potBreakdown && gambitResult.potBreakdown.length > 0
      ? gambitResult.potBreakdown
      : [{ source: 'Ante Stakes', amount: gambitResult.potWon }];

    const weightLbs = calculateCurrencyWeight(fromCopper(gambitResult.potWon, true)).toFixed(2);
    const moneyFormatted = formatMoney(fromCopper(gambitResult.potWon, true));

    return (
      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[200] pointer-events-auto animate-in fade-in duration-700 p-4">
           <div className={`p-6 rounded-full border-4 mb-4 ${gambitResult.winnerId === 'player' ? 'border-blue-500 bg-blue-900/30' : 'border-red-500 bg-red-900/30'}`}>
               {gambitResult.winnerId === 'player' ? <GameIcon name="trophy" size={64} className="text-blue-400" /> : <GameIcon name="skull" size={64} className="text-red-500" />}
           </div>

           <h2 className="text-4xl font-gothic text-stone-100 mb-1">
               {gambitResult.winnerId === 'player' ? 'Gambit Won!' : `${gambitResult.winnerName} Won`}
           </h2>

           <p className="text-lg text-stone-400 italic mb-6">{gambitResult.reason}</p>

           <div className="flex flex-col gap-2 mb-6 w-full max-w-lg bg-stone-900/50 border border-stone-800 p-5 rounded-xl text-center">
               <h4 className="text-xs uppercase tracking-widest text-stone-500 mb-3 font-bold">Flight Strengths</h4>
               {gambitResult.scores.map((score) => (
                   <div key={score.playerId} className="flex justify-between items-center py-1 border-b border-stone-800/40 last:border-0">
                       <span className={`text-base font-serif ${score.playerId === 'player' ? 'text-blue-400 font-bold' : 'text-stone-300'}`}>
                           {score.name} {score.playerId === 'player' && '(You)'}
                       </span>
                       <span className="font-gothic text-xl text-stone-100">{score.strength}</span>
                   </div>
               ))}
           </div>

           {/* Total Pot display with Breakdown toggle */}
           <div className="flex flex-col items-center mb-6 w-full max-w-lg">
               <div
                 className="flex items-center gap-2 text-amber-400 font-gothic text-2xl cursor-help mb-2"
                 title={`Pot Won: ${formatPrice(gambitResult.potWon)} (${moneyFormatted}) — Weight: ${weightLbs} lbs`}
               >
                   <GameIcon name="currency/coins" size={28} className="text-amber-400" />
                   <span>{gambitResult.winnerId === 'player' ? `+${formatPrice(gambitResult.potWon)}` : `-${formatPrice(gambitResult.potWon)}`}</span>
               </div>

               <button
                 onClick={() => {
                   playSound('UI_CLICK');
                   setShowBreakdown(!showBreakdown);
                 }}
                 aria-expanded={showBreakdown}
                 aria-label="Toggle Pot Breakdown Details"
                 className="text-xs text-amber-400/90 hover:text-amber-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-2 py-1 flex items-center gap-1.5 transition-colors"
               >
                 <GameIcon name="currency/coins" size={14} />
                 <span>{showBreakdown ? 'Hide Pot Breakdown ▲' : 'View Pot Breakdown Summary ▼'}</span>
               </button>

               {showBreakdown && (
                 <div
                   id="pot-breakdown-details"
                   className="mt-3 w-full bg-stone-950/80 border border-amber-900/50 rounded-lg p-4 text-left shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
                 >
                   <div className="flex justify-between items-center pb-2 mb-2 border-b border-stone-800 text-xs font-bold text-amber-400/90 uppercase tracking-wider">
                     <span className="flex items-center gap-1.5">
                       <GameIcon name="currency/coins" size={14} />
                       Pot Breakdown by Source
                     </span>
                     <span className="text-stone-400 text-[11px] font-mono lowercase">
                       {weightLbs} lbs ({moneyFormatted})
                     </span>
                   </div>

                   <div className="space-y-1.5">
                     {breakdownItems.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm">
                         <span className="text-stone-300 font-serif flex items-center gap-2">
                           <span className="text-amber-500/70">•</span>
                           {item.source}
                         </span>
                         <span className={`font-mono font-semibold ${item.amount >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                           {item.amount >= 0 ? `+${formatPrice(item.amount)}` : formatPrice(item.amount)}
                         </span>
                       </div>
                     ))}
                   </div>

                   <div className="mt-3 pt-2 border-t border-stone-800 flex justify-between items-center text-xs text-stone-400 font-serif italic">
                     <span>Total Pot Awarded</span>
                     <span className="font-gothic text-amber-400 font-bold text-sm">
                       {formatPrice(gambitResult.potWon)}
                     </span>
                   </div>
                 </div>
               )}
           </div>

           <button
            onClick={() => {
                playSound('UI_CLICK');
                startNextGambit();
            }}
            aria-label="Start Next Gambit"
            className="px-8 py-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-100 rounded shadow-lg flex items-center gap-3 transition-colors text-lg min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
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
            aria-label="Return to Lobby"
            className="px-8 py-4 bg-stone-800 border border-stone-600 hover:bg-stone-700 text-stone-200 rounded text-xl shadow-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
           >
               Return to Lobby
           </button>
      </div>
    );
  }

  return null;
};
