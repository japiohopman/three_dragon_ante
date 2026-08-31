import { create } from 'zustand';
import { GameState, CardData, PlayerId, GamePhase, GameEffect, InteractionRequest, BoardCard, PlayerSkill, NPCData, PlayerState, NPCEmotion } from '../types';
import { generateDeck, shuffle, HAND_LIMIT } from '../utils/constants';
import { resolveCardPower, checkFlightFormation } from '../utils/cardLogic';
import { useAnimationStore, SpecialEffectType } from './useAnimationStore';
import { playSound } from '../services/soundService';
import { NPC_LIST } from '../utils/npcConstants';
import { getNPCPersona } from '../constants/npcLines';
import { formatPrice } from '../utils/currency';

interface GameStore extends GameState {
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

// DYNAMIC SCREEN COORDINATES
const getPos = (playerIndex: number, totalPlayers: number) => {
  if (playerIndex === 0) {
    return { x: window.innerWidth / 2, y: window.innerHeight - 150 };
  }
  const opponentCount = totalPlayers - 1;
  const slotWidth = window.innerWidth / (opponentCount + 1);
  const x = slotWidth * playerIndex;
  return { x, y: 150 };
};

const getInitialState = (): GameState => ({
  npcId: 'female_alchemist_tabaxi',
  phase: 'lobby',
  round: 1,
  pot: 0,
  deck: [],
  discardPile: [],
  maxGambits: 3,
  gambitsPlayed: 0,
  playerSkill: 'none',

  players: [],
  activePlayerIndex: 0,
  currentLeaderIndex: 0,
  focusedOpponentIndex: 1,

  playerGold: 5000,
  playerHand: [],
  playerFlight: [],
  playerAnte: null,

  opponentGold: 5000,
  opponentHand: [],
  opponentFlight: [],
  opponentAnte: null,
  opponentEmotion: 'neutral',
  npcLine: '',
  isTalking: false,

  currentLeader: 'player',
  activePlayer: 'player',
  lastCardPlayed: null,
  activeSpecialRules: {},
  gambitResult: null,
  pendingInteraction: null,
  notification: null,
  history: [],
  characterStats: {
    strength: 10,
    dexterity: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 16
  }
});

const determineSpecialEffect = (card: CardData): SpecialEffectType => {
    const name = card.name.toLowerCase();

    if (name.includes('red')) return 'fire';
    if (name.includes('blue')) return 'lightning';
    if (name.includes('green')) return 'poison';
    if (name.includes('black') || name.includes('dracolich')) return 'necrotic';
    if (name.includes('bahamut') || name.includes('princess') || name.includes('priest') || name.includes('gold') || name.includes('archmage')) return 'divine';
    if (name.includes('tiamat')) return 'chromatic';
    if (name.includes('slayer') || name.includes('thief')) return 'slash';

    return null;
};

export const useGameStore = create<GameStore>((set, get) => {

  // Helper to synchronize array states to compatibility layer
  const syncCompatibility = (draft: Partial<GameState>) => {
    const players = draft.players || get().players;
    if (!players || players.length === 0) return draft;

    const focusedIdx = draft.focusedOpponentIndex !== undefined ? draft.focusedOpponentIndex : get().focusedOpponentIndex;
    const safeFocusedIdx = (focusedIdx >= 1 && focusedIdx < players.length) ? focusedIdx : 1;

    const p0 = players[0];
    const op = players[safeFocusedIdx] || players[1] || p0;

    const activeIndex = draft.activePlayerIndex !== undefined ? draft.activePlayerIndex : get().activePlayerIndex;
    const activeId = players[activeIndex]?.id || 'player';

    const leaderIndex = draft.currentLeaderIndex !== undefined ? draft.currentLeaderIndex : get().currentLeaderIndex;
    const leaderId = players[leaderIndex]?.id || 'player';

    return {
      ...draft,
      players,
      focusedOpponentIndex: safeFocusedIdx,

      playerGold: p0.gold,
      playerHand: p0.hand,
      playerFlight: p0.flight,
      playerAnte: p0.ante,

      opponentGold: op.gold,
      opponentHand: op.hand,
      opponentFlight: op.flight,
      opponentAnte: op.ante,
      opponentEmotion: op.emotion,
      npcLine: op.npcLine,
      isTalking: op.isTalking,
      npcId: op.npcId || 'female_alchemist_tabaxi',

      activePlayer: activeId,
      currentLeader: leaderId
    };
  };

  return {
  ...getInitialState(),

  resetGame: () => {
    set(getInitialState());
  },

  setNPC: (npcId: string) => {
    set({ npcId });
  },

  setFocusedOpponentIndex: (index: number) => {
    const { players } = get();
    if (index >= 1 && index < players.length) {
      set(syncCompatibility({ focusedOpponentIndex: index }));
    }
  },

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

    set(syncCompatibility({ players: updatedPlayers }));

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
         set(syncCompatibility({ players: resetPlayers }));
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
    }));
  },

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
  },

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
    }));
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
    }));

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

    const leaderId = players[bestLeaderIndex].id;

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
    }));

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
    let { phase, activePlayerIndex, players, round, lastCardPlayed, pendingInteraction, currentLeaderIndex } = state;
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
    }));

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
        set(syncCompatibility({ players: surprisedPlayers }));
        setTimeout(() => {
            const resetOpps = get().players.map((p, idx) => {
                if (idx === randOpp) return { ...p, emotion: 'neutral' as NPCEmotion };
                return p;
            });
            set(syncCompatibility({ players: resetOpps }));
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
    }));

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
        set(syncCompatibility({ players: withEmotion }));
        setTimeout(() => {
            const resetOpps = get().players.map((p, idx) => {
                if (idx === activePlayerIndex) return { ...p, emotion: 'neutral' as NPCEmotion };
                return p;
            });
            set(syncCompatibility({ players: resetOpps }));
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
    }));

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
      }));

      if (logMsg) {
          get().addNotification(logMsg);
          get().speak(logMsg);
      }

      setTimeout(() => {
          get().finishTurn(state.players[state.activePlayerIndex].id);
      }, 1000);
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
      }));

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
        }));
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
        }));

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

          let winnerIdx = 0;
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
              }));
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
              }));
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
          }));
      } catch (error) {
          get().addNotification("Game Logic Error. Recovering...", 'alert');
          set(syncCompatibility({
              phase: 'gambit-end',
              gambitResult: { winnerId: 'tie', winnerName: 'Nobody', scores: [], potWon: 0, reason: "Error Recovery" }
          }));
      }
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
          const { target, count, criteria } = effect.discard;
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
              if (Object.keys(updates).length > 0) set(syncCompatibility(updates));
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
              if (Object.keys(updates).length > 0) set(syncCompatibility(updates));
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
          set(syncCompatibility(updates));
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

                       set(syncCompatibility({ deck, players: updatedPlayers, discardPile: [...s2.discardPile, oldCard] }));
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
};
});
