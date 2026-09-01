import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { syncCompatibility } from './helpers';
import { getNPCPersona } from '../../constants/npcLines';
import { NPCEmotion } from '../../types';

export interface UISlice {
  speak: (line: string, duration?: number, dynamic?: boolean) => void;
  addNotification: (message: string, type?: 'info' | 'gold-gain' | 'gold-loss' | 'power' | 'alert') => void;
  fixGameState: () => void;
}

export const createUISlice: StateCreator<GameStore, [], [], UISlice> = (set, get) => ({
  speak: (line: string, duration: number = 3000, dynamic: boolean = false) => {
    const state = get();
    const focusedIdx = state.focusedOpponentIndex;
    const op = state.players[focusedIdx];
    if (!op) return;

    let finalLine = line;
    let emotion: NPCEmotion = 'neutral';

    if (dynamic && op.npcId) {
        const persona = getNPCPersona(op.npcId);
        let seedType: 'start' | 'power' | 'victory' | 'defeat' | 'thinking' = 'thinking';
        const lowerLine = line.toLowerCase();

        if (lowerLine.includes('power')) { seedType = 'power'; emotion = 'surprised'; }
        else if (lowerLine.includes('win') || lowerLine.includes('victory') || lowerLine.includes('triumph')) { seedType = 'victory'; emotion = 'happy'; }
        else if (lowerLine.includes('loss') || lowerLine.includes('lost') || lowerLine.includes('defeat')) { seedType = 'defeat'; emotion = 'sad'; }
        else if (lowerLine.includes('start') || lowerLine.includes('ante')) { seedType = 'start'; emotion = 'curious'; }
        else if (lowerLine.includes('thinking')) { seedType = 'thinking'; emotion = 'skeptical'; }

        const options = persona.seeds[seedType];
        finalLine = options[Math.floor(Math.random() * options.length)];
    }

    const updatedPlayers = state.players.map((p, idx) => {
       if (idx === focusedIdx) {
          return { ...p, npcLine: finalLine, isTalking: true, emotion };
       }
       return p;
    });

    set(syncCompatibility({ players: updatedPlayers }, get()));

    setTimeout(() => {
      const currentState = get();
      const currentOp = currentState.players[focusedIdx];
      if (currentOp && currentOp.npcLine === finalLine) {
         const resetPlayers = currentState.players.map((p, idx) => {
           if (idx === focusedIdx) {
              return { ...p, isTalking: false };
           }
           return p;
         });
         set(syncCompatibility({ players: resetPlayers }, get()));
      }
    }, duration);
  },

  addNotification: (message, type = 'info') => {
    const duration = type === 'power' ? 4000 : 3000;
    set({ notification: { message, type } });
    setTimeout(() => {
      const current = get().notification;
      if (current && current.message === message) {
        set({ notification: null });
      }
    }, duration);
  },

  fixGameState: () => {
      const state = get();
      let msg = "State Checked.";
      if (state.pendingInteraction) {
          set({ pendingInteraction: null });
          msg = "Forced Interaction clear.";
      }
      if (state.phase === 'player-turn' || state.phase === 'round-start') {
          const activeP = state.players[state.activePlayerIndex];
          if (activeP && activeP.isNpc) {
              get().aiTurn();
              msg = "Forced AI Turn.";
          }
      }
      if (state.phase === 'ante-reveal') {
          get().resolveAnte();
          msg = "Forced Ante Resolution.";
      }
      get().addNotification(msg, 'alert');
  }
});
