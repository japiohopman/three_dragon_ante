import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../Card';
import { CardData, GamePhase } from '../../../../types';
import { GameIcon } from '../../../../assets/icons';

interface PlayerHandAreaProps {
  playerHand: CardData[];
  playerFlight: CardData[];
  lastCardPlayed: CardData | null;
  phase: GamePhase;
  isPlayerTurn: boolean;
  selectAnte: (id: string) => void;
  playCard: (id: string) => void;
  isLeader?: boolean;
}

export const PlayerHandArea: React.FC<PlayerHandAreaProps> = ({
  playerHand,
  playerFlight,
  lastCardPlayed,
  phase,
  isPlayerTurn,
  selectAnte,
  playCard,
  isLeader = false
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isAntePhase = phase === 'ante-selection';

  const getFanStyle = (index: number, total: number) => {
    if (total === 0) return {};
    const center = (total - 1) / 2;
    const dist = index - center;

    const isHovered = index === hoveredIndex;
    let rotate = dist * (total > 6 ? 3.5 : 5);
    let yOffset = (Math.abs(dist) * Math.abs(dist) * 2.2) - 20;
    let scale = 1;
    let zIndex = index + 1;

    // Dynamic horizontal step scaling based on total cards in hand (max 10 cards)
    // Ensures full 10-card hand fits inside table container without clipping
    const step = total > 6 ? Math.max(35, Math.min(90, 520 / total)) : 110;
    const xOffset = dist * step;

    if (isHovered) {
        return {
            x: xOffset,
            y: -120,
            rotate: 0,
            scale: total > 6 ? 1.4 : 1.55,
            zIndex: 100,
            filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 20.1px 40px rgba(0,0,0,0.8))',
        };
    } else if (hoveredIndex !== null) {
        const distFromHover = index - hoveredIndex;
        const absDist = Math.abs(distFromHover);
        if (absDist <= 2) {
            const shiftX = distFromHover * (absDist === 1 ? (total > 6 ? 50 : 80) : (total > 6 ? 25 : 40));
            const rOffset = distFromHover * (absDist === 1 ? 12 : 8);
            return {
                x: xOffset + shiftX,
                y: yOffset,
                rotate: rotate + rOffset,
                scale: scale * 1.05,
                zIndex: zIndex,
                filter: 'brightness(1.05) drop-shadow(0 10.1px 20px rgba(0,0,0,0.5))',
            };
        }
    }

    return {
        x: xOffset,
        y: yOffset,
        rotate: rotate,
        scale: scale,
        zIndex: zIndex,
        filter: 'none',
    };
  };

  return (
    <>
      {/* PLAYER FLIGHT */}
      <div className="w-full h-1/3 flex flex-col items-center justify-end relative">
          <div className="flex justify-center gap-2 sm:gap-4 h-24 sm:h-32 mb-2 sm:mb-6">
              {playerFlight.map((card) => (
                  <motion.div key={card.id} layoutId={card.id} className="transform scale-[0.75] sm:scale-[0.9] origin-bottom hover:scale-100 transition-transform cursor-pointer">
                       <Card card={card} size="sm" glow={lastCardPlayed?.id === card.id ? 'gold' : 'none'} />
                  </motion.div>
              ))}
          </div>
      </div>

      {/* PLAYER HAND */}
      <div
        data-testid="player-hand"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full flex justify-center items-end h-64 pointer-events-auto"
        onMouseLeave={() => setHoveredIndex(null)}
      >
          {/* HAND LIMIT WARNING BANNER */}
          {playerHand.length >= 10 && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500/80 text-red-200 px-3 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 animate-bounce z-50 pointer-events-none backdrop-blur-md">
                  <GameIcon name="skull" size={12} className="text-red-400" />
                  <span>Hand Limit Reached (10/10) — Cannot draw or buy cards</span>
              </div>
          )}

          {/* TURN & LEADER INDICATOR BANNER */}
          {(isPlayerTurn || phase === 'ante-selection') && playerHand.length < 10 && (
              <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl flex items-center gap-1.5 z-40 pointer-events-none backdrop-blur-md border ${
                  phase === 'ante-selection'
                      ? 'bg-amber-900/90 border-amber-500/80 text-amber-200 animate-pulse'
                      : isLeader
                      ? 'bg-amber-500 border-amber-300 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
              }`}>
                  {phase === 'ante-selection' ? (
                      <>
                          <GameIcon name="sparkles" size={12} className="text-amber-400" />
                          <span>Ante Phase — Choose Card to Ante</span>
                      </>
                  ) : isLeader ? (
                      <>
                          <GameIcon name="crown" size={12} className="text-stone-950" />
                          <span>Your Turn — Round Leader</span>
                      </>
                  ) : (
                      <>
                          <GameIcon name="sparkles" size={12} className="text-emerald-400" />
                          <span>Your Turn — Play Card</span>
                      </>
                  )}
              </div>
          )}
          <AnimatePresence>
              {playerHand.map((card, i) => (
                  <motion.div
                      key={card.id}
                      layoutId={card.id}
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, ...getFanStyle(i, playerHand.length) }}
                      transition={{
                          type: 'spring',
                          damping: 22,
                          stiffness: 160,
                          mass: 0.8,
                          zIndex: { delay: 0 }
                      }}
                      className="absolute origin-bottom will-change-transform"
                      onMouseEnter={() => setHoveredIndex(i)}
                      data-testid={`player-card-${i}`}
                  >
                      {isPlayerTurn && (
                          <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shadow-md pointer-events-none border whitespace-nowrap z-20 ${
                              (!lastCardPlayed || card.strength <= lastCardPlayed.strength)
                                  ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                  : 'bg-stone-900/90 border-stone-700 text-stone-400'
                          }`}>
                              {(!lastCardPlayed || card.strength <= lastCardPlayed.strength) ? '⚡ Power' : '⚔️ Str'}
                          </div>
                      )}
                      <Card
                          card={card}
                          onClick={() => { if (isAntePhase) selectAnte(card.id); else if (isPlayerTurn) playCard(card.id); }}
                          disabled={(!isPlayerTurn && !isAntePhase)}
                          glow={(isPlayerTurn && (!lastCardPlayed || card.strength <= lastCardPlayed.strength)) ? 'gold' : 'none'}
                          size="sm"
                      />
                  </motion.div>
              ))}
          </AnimatePresence>
      </div>
    </>
  );
};
