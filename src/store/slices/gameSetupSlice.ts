import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { getInitialState, syncCompatibility } from './helpers';
import { generateDeck } from '../../utils/constants';
import { playSound } from '../../services/soundService';
import { NPC_LIST } from '../../utils/npcConstants';
import { PlayerState, PlayerSkill } from '../../types';

export interface GameSetupSlice {
  resetGame: () => void;
  setNPC: (npcId: string) => void;
  setFocusedOpponentIndex: (index: number) => void;
  startGame: (duration: number, skill: PlayerSkill, opponentCount?: number) => void;
}

export const createGameSetupSlice: StateCreator<GameStore, [], [], GameSetupSlice> = (set, get) => ({
  resetGame: () => {
    set(getInitialState());
  },

  setNPC: (npcId: string) => {
    set({ npcId });
  },

  setFocusedOpponentIndex: (index: number) => {
    const { players } = get();
    if (index >= 1 && index < players.length) {
      set(syncCompatibility({ focusedOpponentIndex: index }, get()));
    }
  },

  startGame: (duration: number, skill: PlayerSkill, opponentCount: number = 1) => {
    const deck = generateDeck();

    // Choose unique NPCs from NPC_LIST
    const shuffledNPCs = [...NPC_LIST].sort(() => Math.random() - 0.5);
    const activeNPCs = shuffledNPCs.slice(0, Math.max(1, Math.min(5, opponentCount)));

    const players: PlayerState[] = [
      {
        id: 'player',
        name: 'You',
        isNpc: false,
        gold: 5000,
        hand: deck.splice(0, 6),
        flight: [],
        ante: null,
        emotion: 'neutral',
        npcLine: '',
        isTalking: false
      }
    ];

    activeNPCs.forEach((npc, idx) => {
      players.push({
        id: `npc_${idx + 1}`,
        name: npc.name,
        isNpc: true,
        npcId: npc.id,
        gold: 5000,
        hand: deck.splice(0, 6),
        flight: [],
        ante: null,
        emotion: 'neutral',
        npcLine: '',
        isTalking: false
      });
    });

    playSound('CARD_SHUFFLE');

    set(syncCompatibility({
      ...getInitialState(),
      players,
      activePlayerIndex: 0,
      currentLeaderIndex: 0,
      focusedOpponentIndex: 1,
      maxGambits: duration,
      gambitsPlayed: 0,
      playerSkill: skill,
      phase: 'ante-selection',
      deck,
      history: [`Match started! Duration: ${duration} Gambits. Skill: ${skill}. Select a card to Ante.`]
    }, get()));
  }
});
