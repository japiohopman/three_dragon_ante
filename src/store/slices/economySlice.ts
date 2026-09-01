import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { syncCompatibility, getPos } from './helpers';
import { playSound } from '../../services/soundService';
import { useAnimationStore } from '../useAnimationStore';
import { formatPrice } from '../../utils/currency';
import { generateDeck, shuffle, HAND_LIMIT } from '../../utils/constants';
import { PlayerId, CardData } from '../../types';

export interface EconomySlice {
  buyCard: (player: PlayerId) => void;
  ensureDeckSupply: (minNeeded?: number) => void;
  checkHandLimit: (player: PlayerId) => boolean;
}

export const createEconomySlice: StateCreator<GameStore, [], [], EconomySlice> = (set, get) => ({
  ensureDeckSupply: (minNeeded: number = 1) => {
      let { deck, discardPile } = get();
      if (deck.length < minNeeded) {
          if (discardPile.length > 0) {
              const newDeck = [...deck, ...shuffle(discardPile)];
              set({ deck: newDeck, discardPile: [] });
              get().addNotification("The House reshuffles the discard pile.");
              deck = newDeck;
          }
          if (deck.length < minNeeded) {
              const freshCards = generateDeck();
              const superDeck = [...deck, ...freshCards];
              set({ deck: superDeck });
              get().addNotification("The House brings a fresh deck of cards!");
              deck = superDeck;
          }
      }
  },

  checkHandLimit: (player: PlayerId) => {
      const { players } = get();
      const pState = players.find(p => p.id === player);
      if (pState && pState.hand.length >= HAND_LIMIT) {
          get().addNotification(`${pState.isNpc ? pState.name + "'s" : 'Your'} hand is full!`, 'alert');
          return true;
      }
      return false;
  },

  buyCard: (player) => {
      get().ensureDeckSupply(5);
      const { deck, discardPile, pot, players } = get();

      const pIdx = players.findIndex(p => p.id === player);
      if (pIdx === -1) return;
      const pState = players[pIdx];

      const costCard = deck[0];
      const costCp = costCard.strength * 100;
      const deckAfterCost = deck.slice(1);
      const newDiscard = [...discardPile, costCard];

      const needed = 4 - pState.hand.length;

      if (needed > 0) {
        const drawnCards = [];
        let workingDeck = [...deckAfterCost];

        for(let i = 0; i < needed; i++) {
            if (workingDeck.length === 0) {
                workingDeck = generateDeck();
                get().addNotification("Deck depleted! New cards added.");
            }
            drawnCards.push(workingDeck.shift() as CardData);
        }

        const POS = getPos(pIdx, players.length);
        get().addNotification(`${pState.name} buys cards. Paid ${formatPrice(costCp)}.`);
        playSound('GOLD_LOSS');
        playSound('CARD_DEAL');
        useAnimationStore.getState().spawnCoins(3, POS, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
        useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `-${formatPrice(costCp)}`, 'red');

        const updatedPlayers = players.map((p, idx) => {
            if (idx === pIdx) return { ...p, gold: p.gold - costCp, hand: [...p.hand, ...drawnCards] };
            return p;
        });

        set(syncCompatibility({
            players: updatedPlayers,
            deck: workingDeck,
            discardPile: newDiscard,
            pot: pot + costCp
        }, get()));
      }
  }
});
