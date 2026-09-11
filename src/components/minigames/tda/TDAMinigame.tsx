import React, { useEffect } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import GameUI from './GameUI';
import TableTop from './TableTop';
import VFXLayer from '../../VFXLayer';

export interface TDAMinigameProps {
  /** Initial human player gold balance from host character sheet (in copper or GP) */
  playerGold?: number;
  /** Primary opponent patron ID injected from Artificer tavern node */
  opponentNpcId?: string;
  /** Callback fired when match finishes (victory or defeat) with final gold delta */
  onGameOver?: (result: { winnerId: string; finalGold: number; goldDelta: number }) => void;
  /** Callback fired when player clicks 'Exit Table' button */
  onExit?: () => void;
  /** Optional audio adapter callback */
  onPlaySound?: (soundName: string) => void;
}

export const TDAMinigame: React.FC<TDAMinigameProps> = ({
  playerGold,
  opponentNpcId,
  onGameOver,
  onExit,
}) => {
  const initMatch = useGameStore((state) => state.initMatch);
  const resetGame = useGameStore((state) => state.resetGame);

  useEffect(() => {
    // Initialize TDA match with player gold or opponent options if provided
    if (playerGold !== undefined || opponentNpcId) {
      initMatch({
        humanGold: playerGold,
        opponentId: opponentNpcId,
      });
    }

    return () => {
      resetGame();
    };
  }, [playerGold, opponentNpcId, initMatch, resetGame]);

  return (
    <div className="w-full h-full relative bg-stone-950 overflow-hidden wood-texture select-none">
      <VFXLayer />
      <GameUI onExit={onExit} onGameOver={onGameOver} />
      <div className="w-full h-full flex items-center justify-center">
        <TableTop />
      </div>
    </div>
  );
};

export default TDAMinigame;
