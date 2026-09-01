import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../Card';
import { CardData, GamePhase } from '../../../../types';

interface PlayerHandAreaProps {
  playerHand: CardData[];
  playerFlight: CardData[];
  lastCardPlayed: CardData | null;
  phase: GamePhase;
  isPlayerTurn: boolean;
  selectAnte: (id: string) => void;
  playCard: (id: string) => void;
}

export const PlayerHandArea: React.FC<PlayerHandAreaProps> = ({
  playerHand,
  playerFlight,
  lastCardPlayed,
  phase,
  isPlayerTurn,
  selectAnte,
  playCard
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isAntePhase = phase === 'ante-selection';

  const getFanStyle = (index: number, total: number) => {
    if (total === 0) return {};
    const center = (total - 1) / 2;
    const dist = index - center;

    const isHovered = index === hoveredIndex;
    let rotate = dist * 5;
    let yOffset = (Math.abs(dist) * Math.abs(dist) * 2.5) - 20;
    let scale = 1;
    let zIndex = index + 1;

    // Horizontal spread - increased to ensure visibility
    const xOffset = dist * 140;

    if (isHovered) {
        return {
            x: xOffset,
            y: -140,
            rotate: 0,
            scale: 1.6,
            zIndex: 100,
            filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 20.1px 40px rgba(0,0,0,0.8))',
        };
    } else if (hoveredIndex !== null) {
        const distFromHover = index - hoveredIndex;
        const absDist = Math.abs(distFromHover);
        if (absDist <= 2) {
            const shiftX = distFromHover * (absDist === 1 ? 100 : 50);
            const rOffset = distFromHover * (absDist === 1 ? 15 : 8);
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
          <div className="flex justify-center gap-4 h-32 mb-6">
              {playerFlight.map((card) => (
                  <motion.div key={card.id} layoutId={card.id} className="transform scale-[0.9] origin-bottom hover:scale-100 transition-transform cursor-pointer">
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
          <AnimatePresence>
              {playerHand.map((card, i) => (
                  <motion.div
                      key={card.id}
                      layoutId={card.id}
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, ...getFanStyle(i, playerHand.length) }}
                      transition={{
                          type: 'spring',
                          damping: 25,
                          stiffness: 120,
                          zIndex: { delay: 0 }
                      }}
                      className="absolute origin-bottom will-change-transform"
                      onMouseEnter={() => setHoveredIndex(i)}
                      data-testid={`player-card-${i}`}
                  >
                      <Card
                          card={card}
                          onClick={() => { if (isAntePhase) selectAnte(card.id); else if (isPlayerTurn) playCard(card.id); }}
                          disabled={(!isPlayerTurn && !isAntePhase)}
                          glow={(isPlayerTurn && lastCardPlayed && card.strength <= lastCardPlayed.strength) ? 'gold' : 'none'}
                          size="sm"
                      />
                  </motion.div>
              ))}
          </AnimatePresence>
      </div>
    </>
  );
};
