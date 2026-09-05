import React from 'react';
import Card from '../Card';
import { GameIcon, getIcon } from '../../../../assets/icons';
import { InteractionRequest, CardData } from '../../../../types';
import { playSound } from '../../../../services/soundService';
import { formatPrice } from '../../../../utils/currency';
import { useGameStore } from '../../../../store/useGameStore';

interface InteractionModalProps {
  pendingInteraction: InteractionRequest | null;
  playerGold: number;
  selectableCards: CardData[];
  respondToInteraction: (optionValue: string, selectedCardId?: string) => void;
}

export const InteractionModal: React.FC<InteractionModalProps> = ({
  pendingInteraction,
  playerGold,
  selectableCards,
  respondToInteraction
}) => {
  const players = useGameStore(s => s.players);
  const activePlayerIndex = useGameStore(s => s.activePlayerIndex);

  if (!pendingInteraction) return null;

  if (pendingInteraction.target !== 'player') {
      const targetPlayer = players.find(p => p.id === pendingInteraction.target);
      const targetName = targetPlayer ? targetPlayer.name : 'Opponent';

      return (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-stone-900/95 border-2 border-amber-600/80 text-amber-100 px-8 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-[180] animate-in slide-in-from-top duration-300">
              <div className="p-2 rounded-full bg-amber-900/50 text-amber-400">
                  {getIcon('ui', 'swords', { size: 24 })}
              </div>
              <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-amber-400">{pendingInteraction.sourceCardName} Power</div>
                  <div className="text-lg font-serif">{targetName} is making a choice...</div>
              </div>
          </div>
      );
  }

  const activeP = players[activePlayerIndex];
  const sourcePrefix = activeP && activeP.id !== 'player' ? `${activeP.name}'s ` : '';

  const renderFormattedMessage = (text: string) => {
      const regex = /(\d+\s*gold)|(gold)|(draw)|(discard)|(steal)|(pickup)|(dispell)|(magic)/gi;
      const parts = text.split(regex);

      return parts.filter(part => part !== undefined && part !== '').map((part, index) => {
          const lower = part.toLowerCase();

          if (lower.includes('gold')) {
              const numMatch = part.match(/\d+/);
              const num = numMatch ? numMatch[0] : '';

              return (
                  <span key={index} className="inline-flex items-baseline gap-1 mx-1.5 whitespace-nowrap">
                      {num && <span className="font-bold text-amber-400 font-gothic text-2xl relative top-[1px]">{num}</span>}
                      <GameIcon name="currency/gold_coin" size={22} className="text-amber-500 inline self-center filter drop-shadow-sm" />
                  </span>
              );
          }

          const iconMap: Record<string, { icon: string; color: string }> = {
            'draw': { icon: 'draw_card', color: 'text-blue-400' },
            'discard': { icon: 'discard', color: 'text-red-400' },
            'steal': { icon: 'steal', color: 'text-orange-400' },
            'pickup': { icon: 'pickup_card', color: 'text-green-400' },
            'dispell': { icon: 'dispell_card', color: 'text-purple-400' },
            'magic': { icon: 'magic', color: 'text-cyan-400' }
          };

          for (const [key, config] of Object.entries(iconMap)) {
            if (lower === key || lower.includes(key)) {
              return (
                <span key={index} className={`inline-flex items-center gap-1 mx-1 font-bold ${config.color}`}>
                  {getIcon('ui', config.icon, { size: 18, className: "inline" })}
                  {part}
                </span>
              );
            }
          }

          return <span key={index}>{part}</span>;
      });
  };

  return (
    <div className="absolute inset-0 top-20 flex flex-col items-center justify-center z-[200] pointer-events-auto animate-in fade-in duration-300">
          <div className="bg-stone-900 border-2 border-amber-600 p-8 rounded-xl max-w-2xl w-full mx-4 shadow-2xl relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-stone-900 px-4 py-2 border-2 border-amber-600 rounded-full">
                 {getIcon('ui', 'alert', { className: "text-amber-500 inline-block mr-2" })}
                 <span className="text-amber-100 font-bold uppercase">{sourcePrefix}{pendingInteraction.sourceCardName}</span>
              </div>

              <h3 className="text-center text-xl text-stone-300 mb-8 mt-4 font-serif">
                  You must make a choice:
              </h3>

              <div className="flex flex-col gap-4">
                  {pendingInteraction.options.map((opt, idx) => {
                      const isCardAction = opt.value === 'give-card' || opt.value === 'discard-card';
                      const isPayAction = opt.value === 'pay-gold';
                      const costCp = (opt.cost || 0) * 100;
                      const hasCards = isCardAction ? selectableCards.length > 0 : true;
                      const isDisabled = (isCardAction && !hasCards);

                      let label = opt.label;
                      if (isPayAction && playerGold < costCp) {
                          const debtAmountCp = costCp - Math.max(0, playerGold);
                          label = `${opt.label} (Debt: ${formatPrice(debtAmountCp)})`;
                      }

                      return (
                          <div key={idx} className="flex flex-col gap-2">
                              <button
                                 onClick={() => {
                                     playSound('UI_CLICK');
                                     if (!isCardAction) respondToInteraction(opt.value);
                                 }}
                                 disabled={isDisabled}
                                 className={`w-full py-4 border border-stone-600 rounded text-lg font-bold transition-all
                                     ${isDisabled
                                         ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                         : 'bg-stone-800 hover:bg-amber-900 text-amber-100 hover:border-amber-500 shadow-lg'}
                                 `}
                              >
                                  {renderFormattedMessage(label)}
                                  {!hasCards && isCardAction && <span className="text-xs ml-2 text-red-500">(No matching cards)</span>}
                              </button>

                              {isCardAction && hasCards && (
                                  <div className="flex justify-center gap-2 py-2 overflow-x-auto">
                                      {selectableCards.map(card => (
                                          <div key={card.id} className="transform scale-75 hover:scale-90 transition-transform origin-top">
                                              <Card
                                                 card={card}
                                                 onClick={() => {
                                                     playSound('UI_CLICK');
                                                     respondToInteraction(opt.value, card.id);
                                                 }}
                                                 className="hover:ring-4 hover:ring-green-500"
                                                 disableFocus={true}
                                              />
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
    </div>
  );
};
