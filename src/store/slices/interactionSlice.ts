import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { syncCompatibility, getPos } from './helpers';
import { playSound } from '../../services/soundService';
import { useAnimationStore } from '../useAnimationStore';
import { formatPrice } from '../../utils/currency';
import { resolveCardPower } from '../../utils/cardLogic';
import { GameEffect, BoardCard, CardData } from '../../types';
import { HAND_LIMIT } from '../../utils/constants';

export interface InteractionSlice {
  respondToInteraction: (optionValue: string, selectedCardId?: string) => void;
  resolveAiInteraction: () => void;
  applyGameEffect: (effect: GameEffect) => void;
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
  },

  applyGameEffect: (effect: GameEffect) => {
      const state = get();
      const updates: any = {};

      if (effect.interaction) {
          set({ pendingInteraction: effect.interaction });
          if (effect.interaction.target !== 'player') {
              setTimeout(() => get().resolveAiInteraction(), 1500);
          }
          return;
      }

      if (effect.goldChange) {
          const { player, opponent, pot } = effect.goldChange;

          let pDelta = (player || 0) * 100;
          let oDelta = (opponent || 0) * 100;
          const potDelta = (pot || 0) * 100;

          if (pDelta && pDelta < -100 && state.playerSkill === 'bluff') pDelta += 100;

          const updatedPlayers = state.players.map((p, idx) => {
              let delta = 0;
              if (idx === 0) delta = pDelta;
              else if (idx === state.activePlayerIndex) delta = oDelta; // target is current active opponent

              if (delta) {
                  const POS = getPos(idx, state.players.length);
                  if (delta > 0) {
                      useAnimationStore.getState().spawnCoins(Math.min(5, delta / 100), { x: window.innerWidth / 2, y: window.innerHeight / 2 }, POS);
                      useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `+${formatPrice(delta)}`, 'gold');
                  } else {
                      useAnimationStore.getState().spawnCoins(Math.min(5, Math.abs(delta) / 100), POS, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
                      useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `-${formatPrice(Math.abs(delta))}`, 'red');
                  }
                  return { ...p, gold: p.gold + delta };
              }
              return p;
          });

          updates.players = updatedPlayers;
          if (potDelta) updates.pot = Math.max(0, (state.pot || 0) + potDelta);

          if (pDelta && pDelta > 0 && potDelta && potDelta < 0 && state.playerSkill === 'sleight-of-hand') {
              if (pDelta === 200) {
                   updates.players = updatedPlayers.map((p, idx) => {
                       if (idx === 0) return { ...p, gold: p.gold + 100 };
                       return p;
                   });
                   updates.pot = Math.max(0, (updates.pot || state.pot || 0) - 100);
                   get().addNotification("Sleight of Hand: +1 Gold.");
              }
          }
      }

      if (effect.discard) {
          const { target, criteria } = effect.discard;
          if (criteria === 'weaker-dragon') {
              const s = get();
              const findTarget = (flight: BoardCard[]) =>
                  flight.filter(c => c.strength <= 7 && c.type !== 'mortal').sort((a,b) => b.strength - a.strength)[0];

              let targetCard: BoardCard | undefined;
              let targetPlayerIdx = -1;

              // Search other players for weaker dragons
              for (let i = 0; i < s.players.length; i++) {
                  if (i !== s.activePlayerIndex) {
                      const tCard = findTarget(s.players[i].flight);
                      if (tCard) {
                          targetCard = tCard;
                          targetPlayerIdx = i;
                          break;
                      }
                  }
              }

              if (targetCard && targetPlayerIdx > -1) {
                  const updatedPlayers = s.players.map((p, idx) => {
                      if (idx === targetPlayerIdx) {
                          return { ...p, flight: p.flight.filter(c => c.id !== targetCard!.id) };
                      }
                      return p;
                  });
                  set({
                      players: updatedPlayers,
                      discardPile: [...s.discardPile, targetCard!]
                  });
                  get().addNotification(`Dragonslayer kills ${targetCard.name}!`);
              }
              if (Object.keys(updates).length > 0) set(syncCompatibility(updates, get()));
              return;
          }

          // Discard random card from targeted player
          const updatedPlayers = state.players.map((p, idx) => {
              const isTargeted = (target === 'all' && idx !== state.activePlayerIndex) || (target === 'opponent' && idx !== 0 && idx === state.focusedOpponentIndex);
              if (isTargeted && p.hand.length > 0 && criteria === 'random') {
                   const rIdx = Math.floor(Math.random() * p.hand.length);
                   const removed = p.hand[rIdx];
                   get().addNotification(`${p.name} lost a card to Red Dragon.`);
                   set(s => ({ discardPile: [...s.discardPile, removed] }));
                   return { ...p, hand: p.hand.filter((_, i) => i !== rIdx) };
              }
              return p;
          });
          updates.players = updatedPlayers;
      }

      if (effect.stealCard) {
          const { from, to, count } = effect.stealCard;
          const fromIdx = state.players.findIndex(p => p.id === from);
          const toIdx = state.players.findIndex(p => p.id === to);

          if (fromIdx > -1 && toIdx > -1) {
              const fromPlayer = state.players[fromIdx];
              const toPlayer = state.players[toIdx];

              const fromHand = [...fromPlayer.hand];
              const toHand = [...toPlayer.hand];

              for (let i = 0; i < count; i++) {
                  if (fromHand.length > 0 && toHand.length < HAND_LIMIT) {
                      const idx = Math.floor(Math.random() * fromHand.length);
                      const card = fromHand.splice(idx, 1)[0];
                      toHand.push(card);
                  }
              }

              const updatedPlayers = state.players.map((p, idx) => {
                  if (idx === fromIdx) return { ...p, hand: fromHand };
                  if (idx === toIdx) return { ...p, hand: toHand };
                  return p;
              });
              updates.players = updatedPlayers;
          }
      }

      if (effect.drawCards) {
           const { count, target } = effect.drawCards;
           get().ensureDeckSupply(count * 2);
           let deck = [...get().deck];
           const safeDraw = (n: number) => {
               const drawn = [];
               for(let i=0; i<n; i++) {
                   if (deck.length > 0) drawn.push(deck.shift() as CardData);
               }
               return drawn;
           };

           const updatedPlayers = state.players.map((p, idx) => {
               const isTargeted = (target === 'all') || (target === 'player' && idx === 0) || (target === 'opponent' && idx !== 0 && idx === state.activePlayerIndex);
               if (isTargeted) {
                   const space = HAND_LIMIT - p.hand.length;
                   if (space > 0) {
                       const drawn = safeDraw(Math.min(count, space));
                       return { ...p, hand: [...p.hand, ...drawn] };
                   } else if (idx === 0) {
                       get().addNotification("Your hand is full!", 'alert');
                   }
               }
               return p;
           });

           updates.players = updatedPlayers;
           updates.deck = deck;
      }

      if (effect.stealAnte) {
          const { target, count, criteria } = effect.stealAnte;
          const s = get();
          const activeAntes = s.players.map(p => p.ante).filter(Boolean) as CardData[];

          if (activeAntes.length > 0 && criteria === 'weakest') {
              activeAntes.sort((a,b) => a.strength - b.strength);
              const toSteal = activeAntes.slice(0, count);
              const targetIdx = s.players.findIndex(p => p.id === target);

              if (targetIdx > -1) {
                  const targetPlayer = s.players[targetIdx];
                  const space = HAND_LIMIT - targetPlayer.hand.length;
                  const finalSteal = toSteal.slice(0, space);

                  if (finalSteal.length > 0) {
                      const updatedPlayers = s.players.map((p, idx) => {
                          const isStolen = p.ante && finalSteal.some(fs => fs.id === p.ante!.id);
                          if (idx === targetIdx) {
                              return { ...p, hand: [...p.hand, ...finalSteal], ante: isStolen ? null : p.ante };
                          }
                          if (isStolen) {
                              return { ...p, ante: null };
                          }
                          return p;
                      });
                      updates.players = updatedPlayers;
                      get().addNotification(`${targetPlayer.name} retrieved ${finalSteal.length} Ante card${finalSteal.length > 1 ? 's' : ''}.`);
                  }
              }
          }
      }

      if (effect.specialAction === 'copy-evil-power') {
          const s = get();
          let evilDragons: BoardCard[] = [];
          s.players.forEach(p => {
              evilDragons = [...evilDragons, ...p.flight.filter(c => c.type === 'evil' && c.name !== 'Dracolich')];
          });
          const strongest = evilDragons.sort((a,b) => b.strength - a.strength)[0];
          if (strongest) {
              get().addNotification(`Dracolich copies ${strongest.name}!`, 'power');
              if (Object.keys(updates).length > 0) set(syncCompatibility(updates, get()));
              setTimeout(() => {
                 const subEffect = resolveCardPower(strongest, get(), s.players[s.activePlayerIndex].id);
                 get().applyGameEffect(subEffect);
              }, 1000);
              return;
          }
      }

      if (effect.specialAction) {
          const rules = { ...state.activeSpecialRules };
          if (effect.specialAction === 'weakest-wins') rules.weakestFlightWins = true;
          if (effect.specialAction === 'become-leader') rules.nextRoundLeader = state.players[state.activePlayerIndex].id;
          updates.activeSpecialRules = rules;
      }

      if (Object.keys(updates).length > 0) {
          set(syncCompatibility(updates, get()));
      }

      if (effect.specialAction === 'replace-with-top-deck') {
           const s = get();
           const activeP = s.players[s.activePlayerIndex];
           const flight = [...activeP.flight];
           const oldCard = flight[flight.length - 1];
           if (oldCard && oldCard.name.includes('Copper')) {
               get().addNotification("Copper Dragon burrows...", 'info');
               setTimeout(() => {
                   const s2 = get();
                   let deck = [...s2.deck];
                   if (deck.length > 0) {
                       const newCard = deck.shift();
                       flight.pop();
                       const replacedCard = { ...newCard!, owner: activeP.id, playedAtRound: s2.round };
                       flight.push(replacedCard);

                       const updatedPlayers = s2.players.map((p, idx) => {
                           if (idx === s2.activePlayerIndex) return { ...p, flight };
                           return p;
                       });

                       set(syncCompatibility({ deck, players: updatedPlayers, discardPile: [...s2.discardPile, oldCard] }, get()));
                       get().addNotification(`...and returns as ${replacedCard.name}!`, 'power');
                       useAnimationStore.getState().triggerFlash();
                       setTimeout(() => {
                           const newEffect = resolveCardPower(replacedCard, get(), activeP.id);
                           get().applyGameEffect(newEffect);
                       }, 1500);
                   }
               }, 1000);
           }
      }

      if (effect.specialAction === 'trigger-all-good') {
          const s = get();
          const activeP = s.players[s.activePlayerIndex];
          const flight = activeP.flight;
          const goodDragons = flight.filter(c => c.type === 'good' && c.name !== 'Princess');
          if (goodDragons.length > 0) {
              let idx = 0;
              const triggerNext = () => {
                  if (idx >= goodDragons.length) return;
                  const dragon = goodDragons[idx];
                  get().addNotification(`Princess inspires ${dragon.name}!`, 'power');
                  const subEffect = resolveCardPower(dragon, get(), activeP.id);
                  get().applyGameEffect(subEffect);
                  idx++;
                  if (idx < goodDragons.length) {
                      setTimeout(triggerNext, 2000);
                  }
              };
              setTimeout(triggerNext, 1000);
          }
      }

      if (effect.specialAction === 'copy-ante') {
           const s = get();
           const activeAntes = s.players.map(p => p.ante).filter(Boolean) as CardData[];
           const strongest = activeAntes.sort((a,b) => b.strength - a.strength)[0];
           if (strongest) {
               get().addNotification(`Archmage copies ante: ${strongest.name}!`, 'power');
               setTimeout(() => {
                   const subEffect = resolveCardPower(strongest, get(), s.players[s.activePlayerIndex].id);
                   get().applyGameEffect(subEffect);
               }, 1000);
           }
      }
  }
});
