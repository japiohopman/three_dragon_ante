import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { syncCompatibility, determineSpecialEffect } from './helpers';
import { playSound } from '../../services/soundService';
import { useAnimationStore } from '../useAnimationStore';
import { resolveCardPower } from '../../utils/cardLogic';
import { NPCEmotion, PlayerId } from '../../types';

export interface TurnSlice {
  playCard: (cardId: string) => void;
  aiTurn: () => void;
}

export const createTurnSlice: StateCreator<GameStore, [], [], TurnSlice> = (set, get) => ({
  playCard: (cardId: string) => {
    const state = get();
    let { phase, activePlayerIndex, players, round, lastCardPlayed, pendingInteraction } = state;
    const humanPlayer = players[0];

    if (pendingInteraction) {
        get().addNotification("Resolve Interaction First!", 'alert');
        return;
    }
    if (phase !== 'round-start' && phase !== 'player-turn') return;
    if (activePlayerIndex !== 0) return;

    if (humanPlayer.hand.length === 0) {
       get().buyCard('player');
       return;
    }

    const cardIndex = humanPlayer.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const card = humanPlayer.hand[cardIndex];
    const newHand = [...humanPlayer.hand];
    newHand.splice(cardIndex, 1);

    const playedCard = { ...card, owner: 'player' as PlayerId, playedAtRound: round };
    const newFlight = [...humanPlayer.flight, playedCard];

    playSound('CARD_SLAM');

    const updatedPlayers = players.map((p, idx) => {
        if (idx === 0) return { ...p, hand: newHand, flight: newFlight };
        return p;
    });

    set(syncCompatibility({
      players: updatedPlayers
    }, get()));

    if (card.strength >= 10) useAnimationStore.getState().triggerFlash();
    if (card.strength >= 13 || card.name.includes('Red') || card.name.includes('Tiamat')) {
       useAnimationStore.getState().triggerShake(2);
    }

    const isTriggered = !lastCardPlayed || card.strength <= lastCardPlayed.strength;

    if (isTriggered) {
        // Trigger surprised response from a random AI player
        const randOpp = 1 + Math.floor(Math.random() * (players.length - 1));
        const surprisedPlayers = updatedPlayers.map((p, idx) => {
            if (idx === randOpp) return { ...p, emotion: 'surprised' as NPCEmotion };
            return p;
        });
        set(syncCompatibility({ players: surprisedPlayers }, get()));
        setTimeout(() => {
            const resetOpps = get().players.map((p, idx) => {
                if (idx === randOpp) return { ...p, emotion: 'neutral' as NPCEmotion };
                return p;
            });
            set(syncCompatibility({ players: resetOpps }, get()));
        }, 2000);

        const vfx = determineSpecialEffect(card);
        if (vfx) {
            useAnimationStore.getState().triggerSpecialEffect(vfx);
            if (vfx === 'fire') playSound('FIRE_BREATH');
            if (vfx === 'lightning') playSound('LIGHTNING_STRIKE');
            if (vfx === 'poison') playSound('POISON_CLOUD');
            if (vfx === 'divine') playSound('DIVINE_RAY');
            if (vfx === 'necrotic') playSound('NECROTIC_PULSE');
            if (vfx === 'slash') playSound('SWORD_SLASH');
            if (vfx === 'chromatic') playSound('CHROMATIC_SHIFT');
        }

        get().addNotification(`${card.name} Power Triggered!`, 'power');
        const effect = resolveCardPower(card, get(), 'player');
        get().applyGameEffect(effect);
    } else {
        get().addNotification(`${card.name} played (Too Strong)`, 'info');
    }

    const currentState = get();
    if (!currentState.pendingInteraction) {
        setTimeout(() => get().finishTurn('player'), isTriggered ? 800 : 500);
    }
  },

  aiTurn: () => {
    const state = get();
    const { players, activePlayerIndex, lastCardPlayed, round } = state;
    const aiPlayer = players[activePlayerIndex];
    if (!aiPlayer || !aiPlayer.isNpc) return;

    if (aiPlayer.hand.length <= 1) {
        get().buyCard(aiPlayer.id);
    }
    const currentHand = get().players[activePlayerIndex].hand;

    if (currentHand.length === 0) {
        get().addNotification(`${aiPlayer.name} passes (Empty hand)`, 'info');
        setTimeout(() => get().finishTurn(aiPlayer.id), 800);
        return;
    }

    let bestIndex = 0;

    if (lastCardPlayed) {
        const triggerable = currentHand
            .map((c, i) => ({c, i}))
            .filter(item => item.c.strength <= lastCardPlayed.strength)
            .sort((a, b) => b.c.strength - a.c.strength);

        if (triggerable.length > 0) {
            bestIndex = triggerable[0].i;
        } else {
             const lowest = currentHand
                .map((c, i) => ({c, i}))
                .sort((a, b) => a.c.strength - b.c.strength);
             bestIndex = lowest[0].i;
        }
    } else {
        const strongest = currentHand
            .map((c, i) => ({c, i}))
            .sort((a, b) => b.c.strength - a.c.strength);
        bestIndex = strongest[0].i;
    }

    const card = currentHand[bestIndex];
    const newHand = [...currentHand];
    newHand.splice(bestIndex, 1);

    const playedCard = { ...card, owner: aiPlayer.id, playedAtRound: round };
    const newFlight = [...aiPlayer.flight, playedCard];

    playSound('CARD_SLAM');

    const updatedPlayers = players.map((p, idx) => {
        if (idx === activePlayerIndex) return { ...p, hand: newHand, flight: newFlight };
        return p;
    });

    set(syncCompatibility({
      players: updatedPlayers
    }, get()));

    if (card.strength >= 10) useAnimationStore.getState().triggerFlash();
    if (card.strength >= 13 || card.name.includes('Red') || card.name.includes('Tiamat')) {
       useAnimationStore.getState().triggerShake(2);
    }

    const isTriggered = !lastCardPlayed || card.strength <= lastCardPlayed.strength;

    if (isTriggered) {
        const withEmotion = get().players.map((p, idx) => {
            if (idx === activePlayerIndex) return { ...p, emotion: 'happy' as NPCEmotion };
            return p;
        });
        set(syncCompatibility({ players: withEmotion }, get()));
        setTimeout(() => {
            const resetOpps = get().players.map((p, idx) => {
                if (idx === activePlayerIndex) return { ...p, emotion: 'neutral' as NPCEmotion };
                return p;
            });
            set(syncCompatibility({ players: resetOpps }, get()));
        }, 2000);

        const vfx = determineSpecialEffect(card);
        if (vfx) {
            useAnimationStore.getState().triggerSpecialEffect(vfx);
            if (vfx === 'fire') playSound('FIRE_BREATH');
            if (vfx === 'lightning') playSound('LIGHTNING_STRIKE');
            if (vfx === 'poison') playSound('POISON_CLOUD');
            if (vfx === 'divine') playSound('DIVINE_RAY');
            if (vfx === 'necrotic') playSound('NECROTIC_PULSE');
            if (vfx === 'slash') playSound('SWORD_SLASH');
            if (vfx === 'chromatic') playSound('CHROMATIC_SHIFT');
        }

        get().addNotification(`${aiPlayer.name} triggers ${card.name}!`, 'power');
        get().speak(`${card.name} Power Triggered`, 3000, true);
        const effect = resolveCardPower(card, get(), aiPlayer.id);
        get().applyGameEffect(effect);
    } else {
        get().addNotification(`${aiPlayer.name} plays ${card.name}.`, 'info');
        if (Math.random() > 0.7) get().speak("Thinking about current hand", 3000, true);
    }

    const currentState = get();
    if (!currentState.pendingInteraction) {
        setTimeout(() => get().finishTurn(aiPlayer.id), isTriggered ? 1200 : 800);
    } else {
        if (currentState.pendingInteraction.target !== 'player') {
            setTimeout(() => get().resolveAiInteraction(), 1500);
        }
    }
  }
});
