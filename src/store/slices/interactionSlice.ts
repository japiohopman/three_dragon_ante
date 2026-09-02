import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { syncCompatibility, getPos } from './helpers';
import { playSound } from '../../services/soundService';
import { useAnimationStore } from '../useAnimationStore';
import { formatPrice } from '../../utils/currency';

export interface InteractionSlice {
  respondToInteraction: (optionValue: string, selectedCardId?: string) => void;
  resolveAiInteraction: () => void;
}

export const createInteractionSlice: StateCreator<GameStore, [], [], InteractionSlice> = (set, get) => ({
  respondToInteraction: (optionValue: string, selectedCardId?: string) => {
    const state = get();
    const { pendingInteraction, players, pot, discardPile } = state;
    if (!pendingInteraction) return;

    const p0 = players[0];
    const option = pendingInteraction.options.find(o => o.value === optionValue);
    if (!option) return;

    let logMsg = "";
    let updatedPlayers = [...players];
    let updatedPot = pot;

    const POS = getPos(0, players.length);

    if (optionValue === 'pay-gold') {
       const costCp = (option.cost || 0) * 100;
       updatedPlayers = players.map((p, idx) => {
           if (idx === 0) return { ...p, gold: p.gold - costCp };
           return p;
       });
       updatedPot = pot + costCp;
       playSound('GOLD_LOSS');
       useAnimationStore.getState().spawnCoins(3, POS, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
       useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `-${formatPrice(costCp)}`, 'red');
       logMsg = `You pay ${formatPrice(costCp)}.`;
    }
    else if (optionValue === 'give-card') {
       if (selectedCardId) {
           const cardIndex = p0.hand.findIndex(c => c.id === selectedCardId);
           if (cardIndex > -1) {
               const card = p0.hand[cardIndex];
               const newPHand = p0.hand.filter(c => c.id !== selectedCardId);

               // Give to the active player or source card owner
               const recipientIdx = state.activePlayerIndex;
               updatedPlayers = players.map((p, idx) => {
                   if (idx === 0) return { ...p, hand: newPHand };
                   if (idx === recipientIdx) return { ...p, hand: [...p.hand, card] };
                   return p;
               });

               playSound('CARD_SLIDE');
               logMsg = `You give ${card.name} to ${players[recipientIdx].name}.`;
           }
       }
    }
    else if (optionValue === 'discard-card') {
        if (selectedCardId) {
            const cardIndex = p0.hand.findIndex(c => c.id === selectedCardId);
            if (cardIndex > -1) {
               const card = p0.hand[cardIndex];
               const newHand = p0.hand.filter(c => c.id !== selectedCardId);
               updatedPlayers = players.map((p, idx) => {
                   if (idx === 0) return { ...p, hand: newHand };
                   return p;
               });
               playSound('CARD_SLIDE');
               set({ discardPile: [...discardPile, card] });
               logMsg = `You discard ${card.name}.`;
            }
        }
    }
    else if (optionValue === 'steal-pot') {
        const amountCp = (option.amount || 0) * 100;
        let stolenCp = Math.min(pot, amountCp);

        if (state.playerSkill === 'sleight-of-hand' && pot > stolenCp) {
             stolenCp += 100;
        }

        updatedPot = pot - stolenCp;
        updatedPlayers = players.map((p, idx) => {
           if (idx === 0) return { ...p, gold: p.gold + stolenCp };
           return p;
        });

        playSound('GOLD_GAIN_LARGE');
        useAnimationStore.getState().spawnCoins(5, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, POS);
        useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `+${formatPrice(stolenCp)}`, 'gold');
        logMsg = `Blue Dragon: You steal ${formatPrice(stolenCp)}.`;
    }
    else if (optionValue === 'opp-pay') {
        const amountCp = (option.amount || 0) * 100;

        // Take from the active player index
        const payIdx = state.activePlayerIndex;
        const payPlayer = players[payIdx];
        const payPOS = getPos(payIdx, players.length);

        updatedPlayers = players.map((p, idx) => {
            if (idx === payIdx) return { ...p, gold: p.gold - amountCp };
            if (idx === 0) return { ...p, gold: p.gold + amountCp };
            return p;
        });

        playSound('GOLD_LOSS');
        useAnimationStore.getState().spawnCoins(5, payPOS, POS);
        useAnimationStore.getState().triggerFloatingText(payPOS.x, payPOS.y, `-${formatPrice(amountCp)}`, 'red');
        useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `+${formatPrice(amountCp)}`, 'gold');
        logMsg = `Blue Dragon: ${payPlayer.name} pays you ${formatPrice(amountCp)}.`;
    }

    set(syncCompatibility({
      players: updatedPlayers,
      pot: updatedPot,
      pendingInteraction: null
    }, get()));

    if (logMsg) get().addNotification(logMsg);

    setTimeout(() => {
        get().finishTurn(state.players[state.activePlayerIndex].id);
    }, 1000);
  },

  resolveAiInteraction: () => {
      const state = get();
      const { pendingInteraction, players, pot, discardPile } = state;
      if (!pendingInteraction) return;

      const aiIdx = players.findIndex(p => p.id === pendingInteraction.target);
      if (aiIdx === -1) return;
      const aiPlayer = players[aiIdx];

      let logMsg = "";
      let updatedPlayers = [...players];
      let updatedPot = pot;

      const POS = getPos(aiIdx, players.length);

      const options = pendingInteraction.options;
      let chosenOption = options[0];

      const stealOpt = options.find(o => o.value === 'steal-pot');
      const makePayOpt = options.find(o => o.value === 'opp-pay');

      if (stealOpt && makePayOpt) {
          const amountCp = (stealOpt.amount || 0) * 100;
          if (pot >= amountCp) chosenOption = stealOpt;
          else chosenOption = makePayOpt;
      }
      else {
          const payOption = options.find(o => o.value === 'pay-gold');
          const giveCardOption = options.find(o => o.value === 'give-card');
          const discardOption = options.find(o => o.value === 'discard-card');

          if (discardOption) chosenOption = discardOption;
          else if (payOption && giveCardOption) {
              const validCards = aiPlayer.hand.filter(giveCardOption.cardFilter || (() => false));
              if (validCards.length > 0) {
                  if (aiPlayer.gold > 3000 && (payOption.cost || 0) <= 5) chosenOption = payOption;
                  else chosenOption = giveCardOption;
              } else chosenOption = payOption;
          }
          else if (payOption) chosenOption = payOption;
      }

      if (chosenOption.value === 'pay-gold') {
          const costCp = (chosenOption.cost || 0) * 100;
          updatedPlayers = players.map((p, idx) => {
              if (idx === aiIdx) return { ...p, gold: p.gold - costCp };
              return p;
          });
          updatedPot = pot + costCp;
          playSound('GOLD_LOSS');
          useAnimationStore.getState().spawnCoins(3, POS, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
          useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `-${formatPrice(costCp)}`, 'red');
          logMsg = `${aiPlayer.name} chooses to pay ${formatPrice(costCp)}.`;
      }
      else if (chosenOption.value === 'give-card') {
           const validCards = aiPlayer.hand.filter(chosenOption.cardFilter || (() => false));
           validCards.sort((a,b) => a.strength - b.strength);
           const cardToGive = validCards[0];

           if (cardToGive) {
               const newAiHand = aiPlayer.hand.filter(c => c.id !== cardToGive.id);
               // Give card back to the original source player (index 0 for player, or active player)
               const recipientIdx = 0; // human player
               updatedPlayers = players.map((p, idx) => {
                   if (idx === aiIdx) return { ...p, hand: newAiHand };
                   if (idx === recipientIdx) return { ...p, hand: [...p.hand, cardToGive] };
                   return p;
               });

               playSound('CARD_SLIDE');
               logMsg = `${aiPlayer.name} gives you ${cardToGive.name}.`;
           }
      }
      else if (chosenOption.value === 'discard-card') {
           const sortedHand = [...aiPlayer.hand].sort((a,b) => a.strength - b.strength);
           const card = sortedHand[0];
           if (card) {
                const newAiHand = aiPlayer.hand.filter(c => c.id !== card.id);
                updatedPlayers = players.map((p, idx) => {
                    if (idx === aiIdx) return { ...p, hand: newAiHand };
                    return p;
                });
                playSound('CARD_SLIDE');
                set({ discardPile: [...discardPile, card] });
                logMsg = `${aiPlayer.name} discards ${card.name}.`;
           }
      }
      else if (chosenOption.value === 'steal-pot') {
          const amountCp = (chosenOption.amount || 0) * 100;
          let stolenCp = Math.min(pot, amountCp);
          updatedPot = pot - stolenCp;
          updatedPlayers = players.map((p, idx) => {
              if (idx === aiIdx) return { ...p, gold: p.gold + stolenCp };
              return p;
          });
          playSound('GOLD_GAIN_LARGE');
          useAnimationStore.getState().spawnCoins(5, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, POS);
          useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `+${formatPrice(stolenCp)}`, 'gold');
          logMsg = `${aiPlayer.name} steals ${formatPrice(stolenCp)}.`;
      }
      else if (chosenOption.value === 'opp-pay') {
          const amountCp = (chosenOption.amount || 0) * 100;
          let finalPayCp = amountCp;
          if (state.playerSkill === 'bluff' && amountCp >= 200) finalPayCp -= 100;

          updatedPlayers = players.map((p, idx) => {
              if (idx === 0) return { ...p, gold: p.gold - finalPayCp };
              if (idx === aiIdx) return { ...p, gold: p.gold + amountCp };
              return p;
          });
          updatedPot = pot + amountCp;

          if (state.playerSkill === 'bluff' && amountCp >= 200) {
              updatedPot = pot + finalPayCp;
              get().addNotification("(Bluff: You pay 1 gold less)");
          }

          playSound('GOLD_LOSS');
          const p0POS = getPos(0, players.length);
          useAnimationStore.getState().spawnCoins(5, p0POS, POS);
          useAnimationStore.getState().triggerFloatingText(p0POS.x, p0POS.y, `-${formatPrice(finalPayCp)}`, 'red');
          useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `+${formatPrice(amountCp)}`, 'gold');
          logMsg = `${aiPlayer.name} demands you pay ${formatPrice(amountCp)}.`;
      }

      set(syncCompatibility({
        players: updatedPlayers,
        pot: updatedPot,
        pendingInteraction: null
      }, get()));

      if (logMsg) {
          get().addNotification(logMsg);
          get().speak(logMsg);
      }

      setTimeout(() => {
          get().finishTurn(state.players[state.activePlayerIndex].id);
      }, 1000);
  }
});
