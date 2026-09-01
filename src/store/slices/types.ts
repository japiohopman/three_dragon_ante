import { GameState, PlayerSkill, PlayerId, GameEffect } from '../../types';

export interface GameStore extends GameState {
  startGame: (duration: number, skill: PlayerSkill, opponentCount?: number) => void;
  startNextGambit: () => void;
  selectAnte: (cardId: string) => void;
  resolveAnte: () => void;
  playCard: (cardId: string) => void;
  aiTurn: () => void;
  nextRound: () => void;
  endGambit: () => void;
  buyCard: (player: PlayerId) => void;
  addNotification: (message: string, type?: 'info' | 'gold-gain' | 'gold-loss' | 'power' | 'alert') => void;
  applyGameEffect: (effect: GameEffect) => void;
  respondToInteraction: (optionValue: string, selectedCardId?: string) => void;
  resolveAiInteraction: () => void;
  finishTurn: (playerId: PlayerId) => void;
  ensureDeckSupply: (minNeeded?: number) => void;
  fixGameState: () => void;
  resetGame: () => void;
  setNPC: (npcId: string) => void;
  speak: (line: string, duration?: number, dynamic?: boolean) => void;
  setFocusedOpponentIndex: (index: number) => void;
}
