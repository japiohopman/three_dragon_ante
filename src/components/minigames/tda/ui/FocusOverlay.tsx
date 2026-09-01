import React from 'react';
import Card from '../Card';
import { getIcon } from '../../../../assets/icons';
import { CardData } from '../../../../types';

interface FocusOverlayProps {
  focusedCard?: CardData;
  canPlayFocused: boolean;
  canAnteFocused: boolean;
  onPlayFocused: () => void;
  onSelectAnteFocused: () => void;
  onClose: () => void;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = ({
  focusedCard,
  canPlayFocused,
  canAnteFocused,
  onPlayFocused,
  onSelectAnteFocused,
  onClose
}) => {
  if (!focusedCard) return null;

  return (
    <div
      className="absolute inset-0 bg-black/90 z-[200] pointer-events-auto flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200"
      onClick={onClose}
    >
        <div className="relative" onClick={(e) => e.stopPropagation()}>
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
            >
                {getIcon('ui', 'close', { size: 24 })}
            </button>
            <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex gap-4 w-max">
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
        <p className="mt-24 text-stone-500 font-serif italic">Tap anywhere to close</p>
    </div>
  );
};
