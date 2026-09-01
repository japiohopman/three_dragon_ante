import React from 'react';
import Card from '../Card';
import { getIcon } from '../../../../assets/icons';
import { CardData } from '../../../../types';

interface FocusOverlayProps {
  focusedCard?: CardData;
  canPlayFocused: boolean;
  canAnteFocused: boolean;
  lastCardPlayed?: CardData | null;
  onPlayFocused: () => void;
  onSelectAnteFocused: () => void;
  onClose: () => void;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = ({
  focusedCard,
  canPlayFocused,
  canAnteFocused,
  lastCardPlayed,
  onPlayFocused,
  onSelectAnteFocused,
  onClose
}) => {
  if (!focusedCard) return null;

  const isPowerActive = canPlayFocused && (!lastCardPlayed || focusedCard.strength <= lastCardPlayed.strength);

  return (
    <div
      className="absolute inset-0 bg-black/90 z-[200] pointer-events-auto flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200"
      onClick={onClose}
    >
        <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <Card
              card={focusedCard}
              className="w-64 h-[26.88rem] sm:w-80 sm:h-[33.6rem] shadow-2xl"
              disableFocus={true}
              radius={50}
              size="lg"
            />
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 bg-stone-800 text-stone-400 p-2 rounded-full hover:bg-red-900 hover:text-white transition-colors border border-stone-600"
              title="Close Inspection"
            >
                {getIcon('ui', 'close', { size: 24 })}
            </button>

            {/* ACTION & POWER STATUS HINT */}
            {canPlayFocused && (
                <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-md flex items-center gap-2 ${
                    isPowerActive
                        ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                        : 'bg-stone-900/90 border-stone-700 text-stone-400'
                }`}>
                    {isPowerActive ? (
                        <>
                            {getIcon('ui', 'sparkles', { size: 14, className: "text-amber-400" })}
                            <span>⚡ Special Power Active {!lastCardPlayed ? '(Round Leader)' : `(Str ${focusedCard.strength} ≤ ${lastCardPlayed.strength})`}</span>
                        </>
                    ) : (
                        <>
                            {getIcon('ui', 'shield', { size: 14, className: "text-stone-500" })}
                            <span>⚔️ Strength Only — Power Inactive (Str {focusedCard.strength} &gt; {lastCardPlayed?.strength})</span>
                        </>
                    )}
                </div>
            )}

            {canAnteFocused && (
                <div className="mt-4 px-4 py-1.5 bg-blue-950/90 border border-blue-500 text-blue-200 rounded-full text-xs font-bold shadow-md flex items-center gap-2">
                    {getIcon('ui', 'target', { size: 14, className: "text-blue-400" })}
                    <span>Ante Card — Determines initial round leader and stake</span>
                </div>
            )}

            <div className="mt-6 flex gap-4 w-max">
                {canPlayFocused && (
                    <button
                      onClick={onPlayFocused}
                      className="bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 text-xl animate-bounce"
                    >
                        {getIcon('ui', 'play', { size: 24 })} Play Card
                    </button>
                )}
                {canAnteFocused && (
                    <button
                      onClick={onSelectAnteFocused}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 text-xl animate-bounce"
                    >
                        {getIcon('ui', 'target', { size: 24 })} Select Ante
                    </button>
                )}
            </div>
        </div>
        <p className="mt-8 text-stone-500 font-serif italic text-sm">Tap anywhere to close</p>
    </div>
  );
};
