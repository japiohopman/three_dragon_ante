import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { syncCompatibility, getPos } from './helpers';
import { playSound } from '../../services/soundService';
import { useAnimationStore } from '../useAnimationStore';
import { formatPrice } from '../../utils/currency';
import { checkFlightFormation } from '../../utils/cardLogic';
import { CardData, PlayerId } from '../../types';
import { HAND_LIMIT } from '../../utils/constants';

export interface RoundSlice {
  finishTurn: (playerId: PlayerId) => void;
  nextRound: () => void;
  endGambit: () => void;
}

export const createRoundSlice: StateCreator<GameStore, [], [], RoundSlice> = (set, get) => ({
  finishTurn: (playerId: PlayerId) => {
      const state = get();
      if (state.phase === 'gambit-end' || state.phase === 'game-over') return;

      const pIdx = state.players.findIndex(p => p.id === playerId);
      if (pIdx === -1) return;
      const playerState = state.players[pIdx];

      const flight = playerState.flight;
      const lastPlayed = flight[flight.length - 1];

      let updatedPlayers = [...state.players];
      let updatedPot = state.pot;

      if (lastPlayed) {
          const specialFlight = checkFlightFormation(flight, lastPlayed);
          if (specialFlight) {
            useAnimationStore.getState().triggerFlash('rgba(255, 215, 0, 0.4)'); // Gold flash for special flight
            if (specialFlight.type === 'color') {
                 const dragons = flight.filter(c => c.type !== 'mortal').sort((a,b) => b.strength - a.strength);
                 const reward = dragons.length > 1 ? dragons[1].strength : dragons[0].strength;
                 const rewardCp = reward * 100;

                 // All other active players pay rewardCp to this player
                 updatedPlayers = state.players.map((p, idx) => {
                     if (idx === pIdx) {
                         const totalReceived = rewardCp * (state.players.length - 1);
                         const POS = getPos(pIdx, state.players.length);
                         useAnimationStore.getState().triggerFloatingText(POS.x, POS.y, `+${formatPrice(totalReceived)}`, 'gold');
                         return { ...p, gold: p.gold + totalReceived };
                     } else {
                         let finalPayCp = rewardCp;
                         if (idx === 0 && state.playerSkill === 'bluff' && rewardCp >= 200) {
                             finalPayCp = rewardCp - 100;
                             get().addNotification("(Bluff: You pay 1 gold less)", 'info');
                         }
                         const fromPOS = getPos(idx, state.players.length);
                         const toPOS = getPos(pIdx, state.players.length);
                         useAnimationStore.getState().spawnCoins(5, fromPOS, toPOS);
                         useAnimationStore.getState().triggerFloatingText(fromPOS.x, fromPOS.y, `-${formatPrice(finalPayCp)}`, 'red');
                         return { ...p, gold: p.gold - finalPayCp };
                     }
                 });

                 get().addNotification(`${playerState.name.toUpperCase()} COLOR FLIGHT! Everybody pays them ${formatPrice(rewardCp)}.`, 'gold-gain');
            } else if (specialFlight.type === 'strength') {
                 const reward = specialFlight.strength || 0;
                 const rewardCp = reward * 100;

                 let finalRewardCp = rewardCp;
                 let bonusMsg = '';
                 if (pIdx === 0 && state.playerSkill === 'sleight-of-hand' && state.pot > rewardCp) {
                     finalRewardCp += 100;
                     bonusMsg = ' (+1 Sleight)';
                 }

                 const toPOS = getPos(pIdx, state.players.length);
                 playSound('GOLD_GAIN_LARGE');
                 useAnimationStore.getState().spawnCoins(8, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, toPOS);
                 useAnimationStore.getState().triggerFloatingText(toPOS.x, toPOS.y, `+${formatPrice(finalRewardCp)}`, 'gold');

                 // Collect all player antes
                 const collectedAntes: CardData[] = [];
                 updatedPlayers = state.players.map((p, idx) => {
                     if (p.ante) collectedAntes.push(p.ante);
                     if (idx === pIdx) {
                         return { ...p, gold: p.gold + finalRewardCp, ante: null };
                     }
                     return { ...p, ante: null };
                 });

                 updatedPlayers[pIdx].hand = [...updatedPlayers[pIdx].hand, ...collectedAntes];
                 updatedPot = Math.max(0, state.pot - finalRewardCp);

                 get().addNotification(`${playerState.name.toUpperCase()} STRENGTH FLIGHT! Steals ${formatPrice(rewardCp)}${bonusMsg} + Todos Antes.`, 'gold-gain');
            }
          }
      }

      // Clockwise advancement
      const nextActiveIndex = (pIdx + 1) % state.players.length;
      const nextActive = state.players[nextActiveIndex];

      const newFocusedOpponentIndex = (nextActiveIndex > 0 && nextActiveIndex < state.players.length)
          ? nextActiveIndex
          : state.focusedOpponentIndex;

      set(syncCompatibility({
          players: updatedPlayers,
          pot: updatedPot,
          activePlayerIndex: nextActiveIndex,
          focusedOpponentIndex: newFocusedOpponentIndex,
          lastCardPlayed: lastPlayed || state.lastCardPlayed,
          phase: nextActive.isNpc ? 'opponent-turn' : 'player-turn'
      }, get()));

      useAnimationStore.setState({ activePlayer: nextActive.id });
      useAnimationStore.getState().triggerTurnBanner(nextActive.id, 1500);

      if (!nextActive.isNpc && nextActive.hand.length === 0) {
          setTimeout(() => {
              get().addNotification("Empty Hand! Auto-Buying...", 'alert');
              get().buyCard('player');
          }, 1200);
      }

      // Check if all players have played this round
      const currentRound = get().round;
      const allPlayed = get().players.every(p => p.flight.some(c => c.playedAtRound === currentRound));

      if (allPlayed) {
          setTimeout(() => get().nextRound(), 1500);
      } else if (nextActive.isNpc) {
          setTimeout(() => get().aiTurn(), 1500);
      }
  },

  nextRound: () => {
    try {
        const { round, players, activeSpecialRules, currentLeaderIndex } = get();

        // Calculate flights strength
        const strengths = players.map(p => p.flight.reduce((a,c) => a + c.strength, 0));
        const maxStr = Math.max(...strengths);
        const uniqueLeaders = players.filter((p, idx) => strengths[idx] === maxStr);
        const isTied = uniqueLeaders.length > 1;

        if (round >= 3 && !isTied) {
            get().endGambit();
            return;
        } else if (round >= 3 && isTied) {
            get().addNotification("Flights Tied! Entering Sudden Death Round.");
        }

        let nextLeaderIndex = currentLeaderIndex;
        if (activeSpecialRules.nextRoundLeader) {
            const rulesLeaderIdx = players.findIndex(p => p.id === activeSpecialRules.nextRoundLeader);
            if (rulesLeaderIdx > -1) nextLeaderIndex = rulesLeaderIdx;
        } else {
            // Leader of round is player with strongest card played in current round
            let maxRoundStrength = -1;
            players.forEach((p, idx) => {
                const roundCard = p.flight.find(c => c.playedAtRound === round);
                if (roundCard && roundCard.strength > maxRoundStrength) {
                    maxRoundStrength = roundCard.strength;
                    nextLeaderIndex = idx;
                }
            });
        }

        set(syncCompatibility({
            round: round + 1,
            currentLeaderIndex: nextLeaderIndex,
            activePlayerIndex: nextLeaderIndex,
            lastCardPlayed: null,
            activeSpecialRules: { ...activeSpecialRules, nextRoundLeader: undefined },
            phase: 'round-start'
        }, get()));

        const nextLeader = players[nextLeaderIndex];
        get().addNotification(`Round ${round + 1}. ${nextLeader.isNpc ? nextLeader.name + ' leads.' : 'You lead.'}`);
        useAnimationStore.setState({ activePlayer: nextLeader.id });
        useAnimationStore.getState().triggerTurnBanner(nextLeader.id, 1500);

        if (nextLeader.isNpc) setTimeout(() => get().aiTurn(), 2000);
    } catch (error) {
        get().fixGameState();
    }
  },

  endGambit: () => {
      try {
          const { players, pot, activeSpecialRules, gambitsPlayed, maxGambits } = get();

          const scores = players.map(p => ({
              playerId: p.id,
              name: p.name,
              strength: p.flight.reduce((acc, c) => acc + c.strength, 0)
          }));

          let reason = "Strongest flight wins.";

          if (activeSpecialRules.weakestFlightWins) {
              scores.sort((a, b) => a.strength - b.strength);
              reason = "Druid active: Weakest flight wins.";
          } else {
              scores.sort((a, b) => b.strength - a.strength);
          }

          const winnerId = scores[0].playerId;
          const winnerName = scores[0].name;

          const updatedPlayers = players.map(p => {
              if (p.id === winnerId) return { ...p, gold: p.gold + pot };
              return p;
          });

          const winnerPOS = getPos(players.findIndex(p => p.id === winnerId), players.length);
          playSound(winnerId === 'player' ? 'GAMBIT_WIN' : 'GAMBIT_LOSS');
          useAnimationStore.getState().spawnCoins(15, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, winnerPOS);
          useAnimationStore.getState().triggerFloatingText(winnerPOS.x, winnerPOS.y, `+${formatPrice(pot)}`, 'gold');

          const result = {
              winnerId,
              winnerName,
              scores,
              potWon: pot,
              reason
          };

          const newGambitsPlayed = gambitsPlayed + 1;
          set({ gambitsPlayed: newGambitsPlayed });

          // Check if any player bankrupt
          const anyBankrupt = updatedPlayers.some(p => p.gold <= 0);
          if (anyBankrupt) {
              const humanWon = updatedPlayers[0].gold > 0;
              set(syncCompatibility({
                 phase: 'game-over',
                 pot: 0,
                 players: updatedPlayers,
                 notification: {
                     message: humanWon ? `Victory! An opponent is bankrupt.` : "Defeat! You are out of gold.",
                     type: humanWon ? 'gold-gain' : 'alert'
                 }
              }, get()));
              return;
          }

          if (newGambitsPlayed >= maxGambits) {
               // Determine match winner based on gold
               const sortedByGold = [...updatedPlayers].sort((a,b) => b.gold - a.gold);
               const humanWon = sortedByGold[0].id === 'player';
               set(syncCompatibility({
                 phase: 'game-over',
                 pot: 0,
                 players: updatedPlayers,
                 notification: {
                     message: humanWon ? "Match Complete! You have the most gold." : `Match Complete! ${sortedByGold[0].name} wins on gold.`,
                     type: humanWon ? 'gold-gain' : 'alert'
                 }
              }, get()));
              return;
          }

          get().ensureDeckSupply(4);
          let workingDeck = [...get().deck];

          const safeDraw = (count: number) => {
              const drawn = [];
              for(let i = 0; i < count; i++) {
                   if (workingDeck.length > 0) {
                       drawn.push(workingDeck.shift() as CardData);
                   }
              }
              return drawn;
          };

          // Everyone draws up to 2 cards
          const finalPlayers = updatedPlayers.map(p => {
              const drawCount = Math.min(2, HAND_LIMIT - p.hand.length);
              const drawn = safeDraw(drawCount);
              return { ...p, hand: [...p.hand, ...drawn] };
          });

          // Discard all flights
          let discardFromFlights: CardData[] = [];
          players.forEach(p => discardFromFlights = [...discardFromFlights, ...p.flight]);
          const newDiscard = [...get().discardPile, ...discardFromFlights];

          set(syncCompatibility({
              phase: 'gambit-end',
              pot: 0,
              deck: workingDeck,
              players: finalPlayers,
              discardPile: newDiscard,
              activeSpecialRules: {},
              gambitResult: result,
              notification: { message: `${winnerName} wins ${formatPrice(pot)}!`, type: winnerId === 'player' ? 'gold-gain' : 'gold-loss' }
          }, get()));
      } catch (error) {
          get().addNotification("Game Logic Error. Recovering...", 'alert');
          set(syncCompatibility({
              phase: 'gambit-end',
              gambitResult: { winnerId: 'tie', winnerName: 'Nobody', scores: [], potWon: 0, reason: "Error Recovery" }
          }, get()));
      }
  }
});
