import React from 'react';
import { BoardCard, CardData } from '../../../../types';
import { GameIcon } from '../../../../assets/icons';

interface FlightCardTooltipProps {
  card: BoardCard | CardData;
  position?: 'top' | 'bottom' | 'left' | 'right';
  ownerName?: string;
}

export const FlightCardTooltip: React.FC<FlightCardTooltipProps> = ({
  card,
  position = 'top',
  ownerName
}) => {
  const boardCard = card as BoardCard;
  const playedAtRound = boardCard.playedAtRound;

  const renderDescription = (text: string) => {
    const parts = text.split(/(gold)/gi);
    return (
      <span>
        {parts.map((part, i) => {
          if (part.toLowerCase() === 'gold') {
            return (
              <span key={i} className="inline-flex align-middle mx-0.5">
                <GameIcon name="currency/gold_coin" size={12} className="inline align-middle text-amber-400" />
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  const getTypeBadgeColor = () => {
    if (card.type === 'mortal') return 'bg-stone-800 text-stone-300 border-stone-600';
    if (card.type === 'good') return 'bg-blue-950 text-blue-300 border-blue-600';
    return 'bg-red-950 text-red-300 border-red-600';
  };

  return (
    <div
      role="tooltip"
      aria-label={`${card.name} card power details`}
      className={`absolute ${getPositionClasses()} w-64 p-3 bg-stone-950/98 text-stone-100 rounded-xl border-2 border-amber-600/80 shadow-[0_10px_30px_rgba(0,0,0,0.9)] backdrop-blur-md pointer-events-none z-50 flex flex-col gap-1.5 transition-all animate-in fade-in zoom-in-95 duration-150`}
    >
      {/* Header: Name, Strength, Type */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-amber-950 border border-amber-500/80 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xs font-bold font-gothic text-amber-300">{card.strength}</span>
          </div>
          <span className="font-serif font-bold text-amber-200 text-xs sm:text-sm uppercase tracking-wider truncate">
            {card.name}
          </span>
        </div>
        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${getTypeBadgeColor()}`}>
          {card.color && card.color !== 'none' ? `${card.color} ${card.type}` : card.type}
        </span>
      </div>

      {/* Round & Owner Metadata */}
      {(playedAtRound !== undefined || ownerName) && (
        <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono tracking-wide">
          {playedAtRound !== undefined && (
            <span>Round {playedAtRound}</span>
          )}
          {ownerName && (
            <span className="text-amber-400/90 font-semibold truncate max-w-[120px]">
              {ownerName}
            </span>
          )}
        </div>
      )}

      {/* Full Description */}
      <p className="text-[10px] sm:text-[11px] text-stone-300 font-serif leading-snug">
        {renderDescription(card.description)}
      </p>
    </div>
  );
};
