import { StateCreator } from 'zustand';
import { GameStore } from './types';
import { syncCompatibility, getPos, determineSpecialEffect } from './helpers';
import { playSound } from '../../services/soundService';
import { useAnimationStore } from '../useAnimationStore';
import { formatPrice } from '../../utils/currency';
import { resolveCardPower, checkFlightFormation } from '../../utils/cardLogic';
import { CardData, NPCEmotion, PlayerId } from '../../types';
import { HAND_LIMIT } from '../../utils/constants';

export interface TurnSlice {
  startNextGambit: () => void;
  selectAnte: (cardId: string) => void;
  resolveAnte: () => void;
  playCard: (cardId: string) => void;
  aiTurn: () => void;
  finishTurn: (playerId: PlayerId) => void;
  nextRound: () => void;
  endGambit: () => void;
}

export const createTurnSlice: StateCreator<GameStore, [], [], TurnSlice> = (set, get) => ({
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
  },

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
        setTimeout(() => get().finishTurn('player'), 500);
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
        get().finishTurn(aiPlayer.id);
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
        setTimeout(() => get().finishTurn(aiPlayer.id), 500);
    } else {
        if (currentState.pendingInteraction.target !== 'player') {
            setTimeout(() => get().resolveAiInteraction(), 1500);
        }
    }
  },

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
