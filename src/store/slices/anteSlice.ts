import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { syncCompatibility, getPos } from './helpers';
import { playSound } from '../../services/soundService';
import { useAnimationStore } from '../useAnimationStore';
import { formatPrice } from '../../utils/currency';
import { CardData, NPCEmotion } from '../../types';

export interface AnteSlice {
  startNextGambit: () => void;
  selectAnte: (cardId: string) => void;
  resolveAnte: () => void;
}

export const createAnteSlice: StateCreator<GameStore, [], [], AnteSlice> = (set, get) => ({
  startNextGambit: () => {
    get().ensureDeckSupply(10);
    const { deck, discardPile, players, playerSkill } = get();

    const resetPlayers = players.map(p => ({
        ...p,
        flight: [],
        ante: null,
        isTalking: false,
        emotion: 'neutral' as NPCEmotion
    }));

    set(syncCompatibility({
        phase: 'ante-selection',
        round: 1,
        pot: 0,
        deck,
        discardPile,
        players: resetPlayers,
        playerSkill,
        activeSpecialRules: {},
        pendingInteraction: null,
        lastCardPlayed: null,
        gambitResult: null,
        notification: { message: "New Gambit Begins!", type: 'info' }
    }, get()));
  },

  selectAnte: (cardId: string) => {
    const { players } = get();
    const p0 = players[0];
    const pCardIndex = p0.hand.findIndex(c => c.id === cardId);
    if (pCardIndex === -1) return;

    const pCard = p0.hand[pCardIndex];
    const newPHand = [...p0.hand];
    newPHand.splice(pCardIndex, 1);

    const updatedPlayers = players.map((p, idx) => {
        if (idx === 0) {
            return { ...p, hand: newPHand, ante: pCard };
        } else {
            // AI chooses their highest strength card as Ante
            const sortedAi = [...p.hand].sort((a, b) => b.strength - a.strength);
            const aiCard = sortedAi[0];
            const aiCardIndex = p.hand.findIndex(c => c.id === aiCard.id);
            const newAiHand = [...p.hand];
            newAiHand.splice(aiCardIndex, 1);
            return { ...p, hand: newAiHand, ante: aiCard };
        }
    });

    playSound('CARD_FLIP');

    set(syncCompatibility({
      players: updatedPlayers,
      phase: 'ante-reveal'
    }, get()));

    setTimeout(() => get().resolveAnte(), 1000);
  },

  resolveAnte: () => {
    const { players, playerSkill } = get();
    const activeAntes = players.map(p => p.ante).filter(Boolean) as CardData[];
    if (activeAntes.length < players.length) return;

    // Highest strength determines base stake
    const baseStake = Math.max(...activeAntes.map(c => c.strength));

    // Determine the Leader index (highest strength ante card; player wins ties)
    let bestLeaderIndex = 0;
    let maxAnteStrength = -1;

    players.forEach((p, idx) => {
       if (p.ante && p.ante.strength > maxAnteStrength) {
           maxAnteStrength = p.ante.strength;
           bestLeaderIndex = idx;
       }
    });

    // Deduct stakes
    let totalStakeGold = 0;
    const updatedPlayers = players.map((p, idx) => {
       let stake = baseStake * 100;
       if (idx === 0 && playerSkill === 'concentration') {
          stake = Math.max(0, baseStake - 1) * 100;
       }
       totalStakeGold += stake;

       const POS = getPos(idx, players.length);
       useAnimationStore.getState().spawnCoins(5, POS, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
       useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `-${formatPrice(stake)}`, 'red');

       return { ...p, gold: p.gold - stake };
    });

    let msg = `Antes Revealed! Base Stake: ${formatPrice(baseStake * 100)}.`;
    if (playerSkill === 'concentration') {
        msg += " (Concentration)";
    }

    get().addNotification(msg);
    playSound('GOLD_LOSS');

    if (baseStake >= 10) useAnimationStore.getState().triggerFlash('rgba(255, 204, 21, 0.3)');

    set(syncCompatibility({
      phase: 'round-start',
      currentLeaderIndex: bestLeaderIndex,
      activePlayerIndex: bestLeaderIndex,
      pot: get().pot + totalStakeGold,
      players: updatedPlayers,
      history: [...get().history, msg]
    }, get()));

    const nextActive = players[bestLeaderIndex];
    if (!nextActive.isNpc) {
       playSound('TURN_START_PLAYER');
    } else {
       playSound('TURN_START_AI');
    }

    useAnimationStore.setState({ activePlayer: nextActive.id });
    useAnimationStore.getState().triggerTurnBanner(nextActive.id, 1500);

    if (nextActive.isNpc) {
      setTimeout(() => get().aiTurn(), 1500);
    }
  }
});
