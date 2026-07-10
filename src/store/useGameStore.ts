
import { create } from 'zustand';
import { GameState, CardData, PlayerId, GamePhase, GameEffect, InteractionRequest, BoardCard, PlayerSkill, NPCData } from '../types';
import { generateDeck, shuffle, HAND_LIMIT } from '../utils/constants';
import { resolveCardPower, checkFlightFormation } from '../utils/cardLogic';
import { useAnimationStore, SpecialEffectType } from './useAnimationStore';
import { playSound } from '../services/soundService';
import { NPC_LIST } from '../utils/npcConstants';
import { getNPCPersona } from '../constants/npcLines';

interface GameStore extends GameState {
  startGame: (duration: number, skill: PlayerSkill) => void;
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
}

// DYNAMIC SCREEN COORDINATES
const getPos = () => ({
  PLAYER: { x: window.innerWidth / 2, y: window.innerHeight - 150 },
  OPPONENT: { x: window.innerWidth / 2, y: 150 },
  POT: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
});

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
  playerGold: 50,
  playerHand: [],
  playerFlight: [],
  playerAnte: null,
  opponentGold: 50,
  opponentHand: [],
  opponentFlight: [],
  opponentAnte: null,
  currentLeader: 'player',
  activePlayer: 'player',
  lastCardPlayed: null,
  activeSpecialRules: {},
  gambitResult: null,
  pendingInteraction: null,
  notification: null,
  history: [],
  opponentEmotion: 'neutral',
  npcLine: '',
  isTalking: false,
  characterStats: {
    strength: 10,
    dexterity: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 16
  }
});

const getNPCName = (npcId?: string) => {
    if (!npcId) return 'Opponent';
    return NPC_LIST.find(n => n.id === npcId)?.name || 'Opponent';
};

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

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),

  resetGame: () => {
    set(getInitialState());
  },

  setNPC: (npcId: string) => {
    set({ npcId });
  },

  speak: (line: string, duration: number = 3000, dynamic: boolean = false) => {
    let finalLine = line;
    let emotion: any = 'neutral';

    if (dynamic) {
        const state = get();
        const currentNPC = NPC_LIST.find(n => n.id === state.npcId);
        if (currentNPC) {
            const persona = getNPCPersona(currentNPC.id);

            // Map the event string to a persona seed category
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
    }

    set({ npcLine: finalLine, isTalking: true, opponentEmotion: emotion });
    setTimeout(() => {
      const current = get().npcLine;
      if (current === finalLine) {
        set({ isTalking: false });
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

  startGame: (duration: number, skill: PlayerSkill) => {
    const deck = generateDeck();
    const playerHand = deck.splice(0, 6);
    const opponentHand = deck.splice(0, 6);
    const currentNpcId = get().npcId;

    playSound('CARD_SHUFFLE');

    set({
      ...getInitialState(),
      npcId: currentNpcId,
      maxGambits: duration,
      gambitsPlayed: 0,
      playerSkill: skill,
      phase: 'ante-selection',
      deck,
      playerHand,
      opponentHand,
      history: [`Match started! Duration: ${duration} Gambits. Skill: ${skill}. Select a card to Ante.`]
    });
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
      const { playerHand, opponentHand } = get();
      const hand = player === 'player' ? playerHand : opponentHand;
      if (hand.length >= HAND_LIMIT) {
          get().addNotification(`${player === 'player' ? 'Your' : getNPCName(get().npcId) + "'s"} hand is full!`, 'alert');
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
      if ((state.phase === 'player-turn' || state.phase === 'round-start') && state.activePlayer !== 'player') {
          if (state.currentLeader === 'player' && state.phase === 'round-start') {
              set({ activePlayer: 'player' });
              msg = "Fixed: Set Active Player to You.";
          }
          else if (state.activePlayer === 'opponent') {
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
    const { deck, discardPile, playerHand, opponentHand, playerGold, opponentGold, playerSkill } = get();

    set({
        phase: 'ante-selection',
        round: 1,
        pot: 0,
        deck,
        discardPile,
        playerHand,
        opponentHand,
        playerGold,
        opponentGold,
        playerSkill,
        playerFlight: [],
        opponentFlight: [],
        playerAnte: null,
        opponentAnte: null,
        activeSpecialRules: {},
        pendingInteraction: null,
        lastCardPlayed: null,
        gambitResult: null,
        notification: { message: "New Gambit Begins!", type: 'info' }
    });
  },

  selectAnte: (cardId: string) => {
    const { playerHand, opponentHand } = get();
    const pCardIndex = playerHand.findIndex(c => c.id === cardId);
    if (pCardIndex === -1) return;
    const pCard = playerHand[pCardIndex];
    const newPlayerHand = [...playerHand];
    newPlayerHand.splice(pCardIndex, 1);

    const sortedAi = [...opponentHand].sort((a, b) => b.strength - a.strength);
    const aiCard = sortedAi[0];
    const aiCardIndex = opponentHand.findIndex(c => c.id === aiCard.id);
    const newOpponentHand = [...opponentHand];
    newOpponentHand.splice(aiCardIndex, 1);

    playSound('CARD_FLIP');

    set({
      playerAnte: pCard,
      playerHand: newPlayerHand,
      opponentAnte: aiCard,
      opponentHand: newOpponentHand,
      phase: 'ante-reveal'
    });

    setTimeout(() => get().resolveAnte(), 1000);
  },

  resolveAnte: () => {
    const { playerAnte, opponentAnte, playerGold, opponentGold, playerSkill } = get();
    if (!playerAnte || !opponentAnte) return;

    const leader: PlayerId = playerAnte.strength >= opponentAnte.strength ? 'player' : 'opponent';
    const baseStake = Math.max(playerAnte.strength, opponentAnte.strength);

    const playerStake = playerSkill === 'concentration' ? Math.max(0, baseStake - 1) : baseStake;
    const opponentStake = baseStake;

    let msg = `Ante Reveal! Stake: ${baseStake} gold.`;
    if (playerSkill === 'concentration') {
        msg += " (Concentration)";
    }

    get().addNotification(msg);

    playSound('GOLD_LOSS');

    const POS = getPos();
    // Visual Effects
    useAnimationStore.getState().spawnCoins(5, POS.PLAYER, POS.POT);
    useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `-${playerStake}`, 'red');

    useAnimationStore.getState().spawnCoins(5, POS.OPPONENT, POS.POT);
    useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `-${opponentStake}`, 'red');

    // Trigger flash on strong ante collision
    if (baseStake >= 10) useAnimationStore.getState().triggerFlash('rgba(255, 204, 21, 0.3)');

    set((state) => ({
      phase: 'round-start',
      currentLeader: leader,
      activePlayer: leader,
      pot: state.pot + playerStake + opponentStake,
      playerGold: state.playerGold - playerStake,
      opponentGold: state.opponentGold - opponentStake,
      history: [...state.history, msg]
    }));

    if (leader === 'player') playSound('TURN_START_PLAYER');
    else playSound('TURN_START_AI');

    useAnimationStore.setState({ activePlayer: leader });
    useAnimationStore.getState().triggerTurnBanner(leader, 1500);

    if (leader === 'opponent') {
      setTimeout(() => get().aiTurn(), 1500);
    }
  },

  playCard: (cardId: string) => {
    const state = get();
    let { phase, activePlayer, playerHand, round, lastCardPlayed, playerFlight, pendingInteraction, currentLeader } = state;

    if ((phase === 'round-start' && currentLeader === 'player' && activePlayer !== 'player') ||
        (phase === 'player-turn' && activePlayer !== 'player')) {
            get().addNotification("Synchronizing Turn State...", 'info');
            set({ activePlayer: 'player' });
            activePlayer = 'player';
    }

    if (pendingInteraction) {
        get().addNotification("Resolve Interaction First!", 'alert');
        return;
    }
    if (phase !== 'round-start' && phase !== 'player-turn') return;
    if (activePlayer !== 'player') return;

    if (playerHand.length === 0) {
       get().buyCard('player');
       return;
    }

    const cardIndex = playerHand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const card = playerHand[cardIndex];
    const newHand = [...playerHand];
    newHand.splice(cardIndex, 1);

    const playedCard = { ...card, owner: 'player' as PlayerId, playedAtRound: round };
    const newFlight = [...playerFlight, playedCard];

    playSound('CARD_SLAM');

    set({
      playerHand: newHand,
      playerFlight: newFlight,
    });

    // VFX Triggers
    if (card.strength >= 10) useAnimationStore.getState().triggerFlash();
    if (card.strength >= 13 || card.name.includes('Red') || card.name.includes('Tiamat')) {
       useAnimationStore.getState().triggerShake(2);
    }

    const isTriggered = !lastCardPlayed || card.strength <= lastCardPlayed.strength;

    if (isTriggered) {
        // TRIGGER SPECIAL EFFECT
        set({ opponentEmotion: 'surprised' });
        setTimeout(() => set({ opponentEmotion: 'neutral' }), 2000);
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
        set({ opponentEmotion: 'proud' });
        setTimeout(() => set({ opponentEmotion: 'neutral' }), 2000);
    }

    const currentState = get();
    if (!currentState.pendingInteraction) {
        setTimeout(() => get().finishTurn('player'), 500);
    }
  },

  aiTurn: () => {
    const state = get();
    const { opponentHand, lastCardPlayed, round, opponentFlight } = state;

    if (opponentHand.length <= 1) {
        get().buyCard('opponent');
    }
    const currentHand = get().opponentHand;

    if (currentHand.length === 0) {
        get().finishTurn('opponent');
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

    const playedCard = { ...card, owner: 'opponent' as PlayerId, playedAtRound: round };
    const newFlight = [...opponentFlight, playedCard];

    playSound('CARD_SLAM');

    set({
      opponentHand: newHand,
      opponentFlight: newFlight,
    });

    if (card.strength >= 10) useAnimationStore.getState().triggerFlash();
    if (card.strength >= 13 || card.name.includes('Red') || card.name.includes('Tiamat')) {
       useAnimationStore.getState().triggerShake(2);
    }

    const isTriggered = !lastCardPlayed || card.strength <= lastCardPlayed.strength;

    if (isTriggered) {
        // TRIGGER SPECIAL EFFECT
        set({ opponentEmotion: 'happy' });
        setTimeout(() => set({ opponentEmotion: 'neutral' }), 2000);
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

        get().addNotification(`${getNPCName(get().npcId)} triggers ${card.name}!`, 'power');
        get().speak(`${card.name} Power Triggered`, 3000, true);
        const effect = resolveCardPower(card, get(), 'opponent');
        get().applyGameEffect(effect);
    } else {
        get().addNotification(`${getNPCName(get().npcId)} plays ${card.name}.`, 'info');
        if (Math.random() > 0.7) get().speak("Thinking about current hand", 3000, true);
        set({ opponentEmotion: 'neutral' });
    }

    const currentState = get();
    if (!currentState.pendingInteraction) {
        setTimeout(() => get().finishTurn('opponent'), 500);
    } else {
        if (currentState.pendingInteraction.target === 'opponent') {
            setTimeout(() => get().resolveAiInteraction(), 1500);
        }
    }
  },

  respondToInteraction: (optionValue: string, selectedCardId?: string) => {
    const state = get();
    const { pendingInteraction, playerHand, opponentHand, playerGold, opponentGold, pot, discardPile } = state;
    if (!pendingInteraction) return;

    const option = pendingInteraction.options.find(o => o.value === optionValue);
    if (!option) return;

    const updates: Partial<GameState> = { pendingInteraction: null };
    let logMsg = "";
    const POS = getPos();

    if (optionValue === 'pay-gold') {
       const cost = option.cost || 0;
       updates.playerGold = playerGold - cost;
       updates.pot = pot + cost;
       playSound('GOLD_LOSS');
       useAnimationStore.getState().spawnCoins(3, POS.PLAYER, POS.POT);
       useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `-${cost}`, 'red');
       logMsg = `You pay ${cost} gold.`;
    }
    else if (optionValue === 'give-card') {
       if (selectedCardId) {
           const cardIndex = playerHand.findIndex(c => c.id === selectedCardId);
           if (cardIndex > -1) {
               const card = playerHand[cardIndex];
               const newHand = [...playerHand];
               newHand.splice(cardIndex, 1);
               updates.playerHand = newHand;
               updates.opponentHand = [...opponentHand, card];
               playSound('CARD_SLIDE');
               logMsg = `You give ${card.name} to ${getNPCName(get().npcId)}.`;
           }
       }
    }
    else if (optionValue === 'discard-card') {
        if (selectedCardId) {
            const cardIndex = playerHand.findIndex(c => c.id === selectedCardId);
            if (cardIndex > -1) {
               const card = playerHand[cardIndex];
               const newHand = [...playerHand];
               newHand.splice(cardIndex, 1);
               updates.playerHand = newHand;
               updates.discardPile = [...discardPile, card];
               playSound('CARD_SLIDE');
               logMsg = `You discard ${card.name}.`;
            }
        }
    }
    else if (optionValue === 'steal-pot') {
        let amount = option.amount || 0;
        let stolen = Math.min(pot, amount);

        if (state.playerSkill === 'sleight-of-hand' && pot > stolen) {
             stolen += 1;
        }

        updates.pot = pot - stolen;
        updates.playerGold = playerGold + stolen;
        playSound('GOLD_GAIN_LARGE');
        useAnimationStore.getState().spawnCoins(5, POS.POT, POS.PLAYER);
        useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `+${stolen}`, 'gold');
        logMsg = `Blue Dragon: You steal ${stolen} gold.`;
    }
    else if (optionValue === 'opp-pay') {
        const amount = option.amount || 0;
        updates.opponentGold = opponentGold - amount;
        updates.pot = pot + amount;
        playSound('GOLD_LOSS');
        useAnimationStore.getState().spawnCoins(5, POS.OPPONENT, POS.POT);
        useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `-${amount}`, 'red');
        logMsg = `Blue Dragon: ${getNPCName(get().npcId)} pays ${amount} gold.`;
    }

    set(updates);
    if (logMsg) get().addNotification(logMsg);

    setTimeout(() => {
        get().finishTurn(state.activePlayer);
    }, 1000);
  },

  resolveAiInteraction: () => {
      const state = get();
      const { pendingInteraction, opponentHand, opponentGold, playerGold, pot, discardPile } = state;
      if (!pendingInteraction || pendingInteraction.target !== 'opponent') return;

      const updates: Partial<GameState> = { pendingInteraction: null };
      let logMsg = "";
      const POS = getPos();

      const options = pendingInteraction.options;
      let chosenOption = options[0];

      const stealOpt = options.find(o => o.value === 'steal-pot');
      const makePayOpt = options.find(o => o.value === 'opp-pay');

      if (stealOpt && makePayOpt) {
          const amount = stealOpt.amount || 0;
          if (pot >= amount) chosenOption = stealOpt;
          else chosenOption = makePayOpt;
      }
      else {
          const payOption = options.find(o => o.value === 'pay-gold');
          const giveCardOption = options.find(o => o.value === 'give-card');
          const discardOption = options.find(o => o.value === 'discard-card');

          if (discardOption) chosenOption = discardOption;
          else if (payOption && giveCardOption) {
              const validCards = opponentHand.filter(giveCardOption.cardFilter || (() => false));
              if (validCards.length > 0) {
                  if (opponentGold > 30 && (payOption.cost || 0) <= 5) chosenOption = payOption;
                  else chosenOption = giveCardOption;
              } else chosenOption = payOption;
          }
          else if (payOption) chosenOption = payOption;
      }

      if (chosenOption.value === 'pay-gold') {
          const cost = chosenOption.cost || 0;
          updates.opponentGold = opponentGold - cost;
          updates.pot = pot + cost;
          playSound('GOLD_LOSS');
          useAnimationStore.getState().spawnCoins(3, POS.OPPONENT, POS.POT);
          useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `-${cost}`, 'red');
          logMsg = `${getNPCName(get().npcId)} chooses to pay ${cost} gold.`;
      }
      else if (chosenOption.value === 'give-card') {
           const validCards = opponentHand.filter(chosenOption.cardFilter || (() => false));
           validCards.sort((a,b) => a.strength - b.strength);
           const cardToGive = validCards[0];

           if (cardToGive) {
               const idx = opponentHand.findIndex(c => c.id === cardToGive.id);
               const newHand = [...opponentHand];
               newHand.splice(idx, 1);
               updates.opponentHand = newHand;
               updates.playerHand = [...state.playerHand, cardToGive];
               playSound('CARD_SLIDE');
               logMsg = `${getNPCName(get().npcId)} gives you ${cardToGive.name}.`;
           }
      }
      else if (chosenOption.value === 'discard-card') {
           const sortedHand = [...opponentHand].sort((a,b) => a.strength - b.strength);
           const card = sortedHand[0];
           if (card) {
                const idx = opponentHand.findIndex(c => c.id === card.id);
                const newHand = [...opponentHand];
                newHand.splice(idx, 1);
                updates.opponentHand = newHand;
                updates.discardPile = [...discardPile, card];
                playSound('CARD_SLIDE');
                logMsg = `${getNPCName(get().npcId)} discards ${card.name}.`;
           }
      }
      else if (chosenOption.value === 'steal-pot') {
          let amount = chosenOption.amount || 0;
          let stolen = Math.min(pot, amount);
          updates.pot = pot - stolen;
          updates.opponentGold = opponentGold + stolen;
          playSound('GOLD_GAIN_LARGE');
          useAnimationStore.getState().spawnCoins(5, POS.POT, POS.OPPONENT);
          useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `+${stolen}`, 'gold');
          logMsg = `${getNPCName(get().npcId)} steals ${stolen} gold.`;
      }
      else if (chosenOption.value === 'opp-pay') {
          const amount = chosenOption.amount || 0;
          let finalPay = amount;
          if (state.playerSkill === 'bluff' && amount >= 2) finalPay -= 1;

          updates.playerGold = playerGold - finalPay;
          updates.pot = pot + amount;

          if (state.playerSkill === 'bluff' && amount >= 2) {
              updates.pot = pot + finalPay;
              get().addNotification("(Bluff: You pay 1 gold less)");
          }

          playSound('GOLD_LOSS');
          useAnimationStore.getState().spawnCoins(5, POS.PLAYER, POS.POT);
          useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `-${finalPay}`, 'red');
          logMsg = `${getNPCName(get().npcId)} demands you pay ${amount} gold.`;
      }

      set(updates);
      if (logMsg) {
          get().addNotification(logMsg);
          get().speak(logMsg);
      }

      setTimeout(() => {
          get().finishTurn(state.activePlayer);
      }, 1000);
  },

  finishTurn: (playerId: PlayerId) => {
      const state = get();
      if (state.phase === 'gambit-end' || state.phase === 'game-over') return;

      const flight = playerId === 'player' ? state.playerFlight : state.opponentFlight;
      const lastPlayed = flight[flight.length - 1];
      const POS = getPos();

      if (lastPlayed) {
          const specialFlight = checkFlightFormation(flight, lastPlayed);
          if (specialFlight) {
            useAnimationStore.getState().triggerFlash('rgba(255, 215, 0, 0.4)'); // Gold flash for special flight
            if (specialFlight.type === 'color') {
                 const dragons = flight.filter(c => c.type !== 'mortal').sort((a,b) => b.strength - a.strength);
                 const reward = dragons.length > 1 ? dragons[1].strength : dragons[0].strength;

                 if (playerId === 'player') {
                     get().addNotification(`COLOR FLIGHT! ${getNPCName(get().npcId)} pays ${reward} gold.`, 'gold-gain');
                     useAnimationStore.getState().spawnCoins(5, POS.OPPONENT, POS.PLAYER);
                     useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `+${reward}`, 'gold');
                     set(s => ({ opponentGold: s.opponentGold - reward, playerGold: s.playerGold + reward }));
                 } else {
                     get().addNotification(`${getNPCName(get().npcId).toUpperCase()} COLOR FLIGHT! You pay ${reward} gold.`, 'gold-loss');
                     let finalPay = reward;
                     if (state.playerSkill === 'bluff' && reward >= 2) {
                         finalPay = reward - 1;
                         get().addNotification("(Bluff: You pay 1 gold less)", 'info');
                     }
                     useAnimationStore.getState().spawnCoins(5, POS.PLAYER, POS.OPPONENT);
                     useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `-${finalPay}`, 'red');
                     set(s => ({ playerGold: s.playerGold - finalPay, opponentGold: s.opponentGold + finalPay }));
                 }
            } else if (specialFlight.type === 'strength') {
                 const reward = specialFlight.strength || 0;
                 if (playerId === 'player') {
                     let finalReward = reward;
                     let bonusMsg = '';
                     if (state.playerSkill === 'sleight-of-hand' && state.pot > reward) {
                         finalReward += 1;
                         bonusMsg = ' (+1 Sleight)';
                     }

                     get().addNotification(`STRENGTH FLIGHT! Steal ${reward}${bonusMsg} gold + Antes.`, 'gold-gain');
                     playSound('GOLD_GAIN_LARGE');
                     useAnimationStore.getState().spawnCoins(8, POS.POT, POS.PLAYER);
                     useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `+${finalReward}`, 'gold');
                     set(s => ({
                         pot: Math.max(0, s.pot - finalReward),
                         playerGold: s.playerGold + finalReward,
                         playerHand: [...s.playerHand, ...(s.playerAnte ? [s.playerAnte] : []), ...(s.opponentAnte ? [s.opponentAnte] : [])],
                         playerAnte: null, opponentAnte: null
                     }));
                 } else {
                     get().addNotification(`${getNPCName(get().npcId).toUpperCase()} STRENGTH FLIGHT! Steals ${reward} gold + Antes.`, 'gold-loss');
                     useAnimationStore.getState().spawnCoins(8, POS.POT, POS.OPPONENT);
                     useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `+${reward}`, 'gold');
                     set(s => ({
                         pot: Math.max(0, s.pot - reward),
                         opponentGold: s.opponentGold + reward,
                         opponentHand: [...s.opponentHand, ...(s.playerAnte ? [s.playerAnte] : []), ...(s.opponentAnte ? [s.opponentAnte] : [])],
                         playerAnte: null, opponentAnte: null
                     }));
                 }
            }
          }
      }

      const nextActive = playerId === 'player' ? 'opponent' : 'player';
      set({
          activePlayer: nextActive,
          lastCardPlayed: lastPlayed || state.lastCardPlayed,
          phase: nextActive === 'player' ? 'player-turn' : 'opponent-turn'
      });

      useAnimationStore.setState({ activePlayer: nextActive });
      useAnimationStore.getState().triggerTurnBanner(nextActive, 1500);

      if (nextActive === 'player' && get().playerHand.length === 0) {
          setTimeout(() => {
              get().addNotification("Empty Hand! Auto-Buying...", 'alert');
              get().buyCard('player');
          }, 1200);
      }

      const { playerFlight: pf, opponentFlight: of, round } = get();
      const pPlayed = pf.some(c => c.playedAtRound === round);
      const oPlayed = of.some(c => c.playedAtRound === round);

      if (pPlayed && oPlayed) {
          setTimeout(() => get().nextRound(), 1500);
      } else if (nextActive === 'opponent') {
          setTimeout(() => get().aiTurn(), 1500);
      }
  },

  buyCard: (player) => {
      get().ensureDeckSupply(5);
      const { deck, discardPile, pot, playerGold, opponentGold } = get();
      const POS = getPos();

      const costCard = deck[0];
      const cost = costCard.strength;
      const deckAfterCost = deck.slice(1);
      const newDiscard = [...discardPile, costCard];

      const currentHand = player === 'player' ? get().playerHand : get().opponentHand;
      const needed = 4 - currentHand.length;

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

        if (player === 'player') {
            get().addNotification(`Buying Cards... Paid ${cost} gold.`, 'gold-loss');
            playSound('GOLD_LOSS');
            playSound('CARD_DEAL');
            useAnimationStore.getState().spawnCoins(3, POS.PLAYER, POS.POT);
            useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `-${cost}`, 'red');
            set({
                playerGold: playerGold - cost,
                pot: pot + cost,
                playerHand: [...get().playerHand, ...drawnCards],
                deck: workingDeck,
                discardPile: newDiscard
            });
        } else {
            get().addNotification(`${getNPCName(get().npcId)} buys cards. Paid ${cost} gold.`);
            playSound('GOLD_LOSS');
            playSound('CARD_DEAL');
            useAnimationStore.getState().spawnCoins(3, POS.OPPONENT, POS.POT);
            useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `-${cost}`, 'red');
            set({
                opponentGold: opponentGold - cost,
                pot: pot + cost,
                opponentHand: [...get().opponentHand, ...drawnCards],
                deck: workingDeck,
                discardPile: newDiscard
            });
        }
      }
  },

  nextRound: () => {
    try {
        const { round, playerFlight, opponentFlight, activeSpecialRules, currentLeader } = get();

        const pStrength = playerFlight.reduce((a,c) => a + c.strength, 0);
        const oStrength = opponentFlight.reduce((a,c) => a + c.strength, 0);
        const isTied = pStrength === oStrength;

        if (round >= 3 && !isTied) {
            get().endGambit();
            return;
        } else if (round >= 3 && isTied) {
            get().addNotification("Flights Tied! Entering Sudden Death Round.");
        }

        let nextLeader: PlayerId = currentLeader;
        if (activeSpecialRules.nextRoundLeader) {
            nextLeader = activeSpecialRules.nextRoundLeader;
        } else {
            const pCard = playerFlight.find(c => c.playedAtRound === round);
            const oCard = opponentFlight.find(c => c.playedAtRound === round);
            if (pCard && oCard) {
                if (pCard.strength > oCard.strength) nextLeader = 'player';
                else if (oCard.strength > pCard.strength) nextLeader = 'opponent';
            }
        }

        set({
            round: round + 1,
            currentLeader: nextLeader,
            activePlayer: nextLeader,
            lastCardPlayed: null,
            activeSpecialRules: { ...activeSpecialRules, nextRoundLeader: undefined },
            phase: 'round-start'
        });

        get().addNotification(`Round ${round + 1}. ${nextLeader === 'player' ? 'You lead.' : getNPCName(get().npcId) + ' leads.'}`);
        useAnimationStore.setState({ activePlayer: nextLeader });
        useAnimationStore.getState().triggerTurnBanner(nextLeader, 1500);

        if (nextLeader === 'opponent') setTimeout(() => get().aiTurn(), 2000);
    } catch (error) {
        get().fixGameState();
    }
  },

  endGambit: () => {
      try {
          const { playerFlight, opponentFlight, pot, playerGold, opponentGold, activeSpecialRules, playerHand, opponentHand, gambitsPlayed, maxGambits } = get();
          const POS = getPos();

          const pStrength = playerFlight.reduce((acc, c) => acc + c.strength, 0);
          const oStrength = opponentFlight.reduce((acc, c) => acc + c.strength, 0);

          let winner: PlayerId | 'tie' = 'tie';
          let reason = "Strength tied.";

          if (activeSpecialRules.weakestFlightWins) {
              if (pStrength < oStrength) { winner = 'player'; reason = "Druid active: Weakest flight wins."; }
              else if (oStrength < pStrength) { winner = 'opponent'; reason = "Druid active: Weakest flight wins."; }
          } else {
              if (pStrength > oStrength) { winner = 'player'; reason = "Strongest flight wins."; }
              else if (oStrength > pStrength) { winner = 'opponent'; reason = "Strongest flight wins."; }
          }

          const newPlayerGold = winner === 'player' ? playerGold + pot : playerGold;
          const newOpponentGold = winner === 'opponent' ? opponentGold + pot : opponentGold;
          const msg = winner === 'player' ? `You Win ${pot} Gold!` : `${getNPCName(get().npcId)} Wins ${pot} Gold.`;

          if (winner === 'player') {
              playSound('GAMBIT_WIN');
              set({ opponentEmotion: 'angry' });
              setTimeout(() => set({ opponentEmotion: 'neutral' }), 4000);
              useAnimationStore.getState().spawnCoins(15, POS.POT, POS.PLAYER);
              useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `+${pot}`, 'gold');
          }
          if (winner === 'opponent') {
              playSound('GAMBIT_LOSS');
              set({ opponentEmotion: 'proud' });
              setTimeout(() => set({ opponentEmotion: 'neutral' }), 4000);
              useAnimationStore.getState().spawnCoins(15, POS.POT, POS.OPPONENT);
              useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `+${pot}`, 'gold');
          }

          const result = {
              winner,
              playerStrength: pStrength,
              opponentStrength: oStrength,
              potWon: pot,
              reason
          };

          const newGambitsPlayed = gambitsPlayed + 1;
          set({ gambitsPlayed: newGambitsPlayed });

          if (newPlayerGold <= 0 || newOpponentGold <= 0) {
              set({
                 phase: 'game-over',
                 pot: 0,
                 playerGold: newPlayerGold,
                 opponentGold: newOpponentGold,
                 notification: {
                     message: newPlayerGold > newOpponentGold ? `Victory! ${getNPCName(get().npcId)} is bankrupt.` : "Defeat! You are out of gold.",
                     type: newPlayerGold > newOpponentGold ? 'gold-gain' : 'alert'
                 }
              });
              return;
          }

          if (newGambitsPlayed >= maxGambits) {
               set({
                 phase: 'game-over',
                 pot: 0,
                 playerGold: newPlayerGold,
                 opponentGold: newOpponentGold,
                 notification: {
                     message: newPlayerGold >= newOpponentGold ? "Match Complete! You have the most gold." : `Match Complete! ${getNPCName(get().npcId)} wins on gold.`,
                     type: newPlayerGold >= newOpponentGold ? 'gold-gain' : 'alert'
                 }
              });
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

          const pCount = Math.min(2, HAND_LIMIT - playerHand.length);
          const oCount = Math.min(2, HAND_LIMIT - opponentHand.length);
          const pDrawn = safeDraw(pCount);
          const oDrawn = safeDraw(oCount);

          const newDiscard = [...get().discardPile, ...playerFlight, ...opponentFlight];

          set({
              phase: 'gambit-end',
              pot: 0,
              playerGold: newPlayerGold,
              opponentGold: newOpponentGold,
              deck: workingDeck,
              playerHand: [...playerHand, ...pDrawn],
              opponentHand: [...opponentHand, ...oDrawn],
              playerFlight: [], opponentFlight: [], playerAnte: null, opponentAnte: null,
              discardPile: newDiscard,
              activeSpecialRules: {},
              gambitResult: result,
              notification: { message: msg, type: winner === 'player' ? 'gold-gain' : 'gold-loss' }
          });
      } catch (error) {
          get().addNotification("Game Logic Error. Recovering...", 'alert');
          set({
              phase: 'gambit-end',
              gambitResult: { winner: 'tie', playerStrength: 0, opponentStrength: 0, potWon: 0, reason: "Error Recovery" }
          });
      }
  },

  applyGameEffect: (effect: GameEffect) => {
      const state = get();
      const updates: any = {};
      const POS = getPos();

      if (effect.interaction) {
          set({ pendingInteraction: effect.interaction });
          if (effect.interaction.target === 'opponent') {
              setTimeout(() => get().resolveAiInteraction(), 1500);
          }
          return;
      }

      if (effect.goldChange) {
          const { player, opponent, pot } = effect.goldChange;

          let pDelta = player;
          let oDelta = opponent;

          if (pDelta && pDelta < -1 && state.playerSkill === 'bluff') pDelta += 1;

          if (pDelta) {
             updates.playerGold = (state.playerGold || 0) + pDelta;
             if (pDelta > 0) {
                 useAnimationStore.getState().spawnCoins(Math.min(5, pDelta), POS.POT, POS.PLAYER);
                 useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `+${pDelta}`, 'gold');
             } else {
                 useAnimationStore.getState().spawnCoins(Math.min(5, Math.abs(pDelta)), POS.PLAYER, POS.POT);
                 useAnimationStore.getState().triggerFloatingText(POS.PLAYER.x, POS.PLAYER.y, `${pDelta}`, 'red');
             }
          }

          if (oDelta) {
              updates.opponentGold = (state.opponentGold || 0) + oDelta;
              if (oDelta > 0) {
                  useAnimationStore.getState().spawnCoins(Math.min(5, oDelta), POS.POT, POS.OPPONENT);
                  useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `+${oDelta}`, 'gold');
              } else {
                  useAnimationStore.getState().spawnCoins(Math.min(5, Math.abs(oDelta)), POS.OPPONENT, POS.POT);
                  useAnimationStore.getState().triggerFloatingText(POS.OPPONENT.x, POS.OPPONENT.y, `${oDelta}`, 'red');
              }
          }

          if (pot) updates.pot = Math.max(0, (state.pot || 0) + pot);

          if (pDelta && pDelta > 0 && pot && pot < 0 && state.playerSkill === 'sleight-of-hand') {
              if (pDelta === 2) {
                   updates.playerGold += 1;
                   updates.pot -= 1;
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
              let targetOwner: PlayerId = s.activePlayer === 'player' ? 'opponent' : 'player';
              if (s.activePlayer === 'player') targetCard = findTarget(s.opponentFlight);
              else targetCard = findTarget(s.playerFlight);
              if (!targetCard) {
                   targetOwner = s.activePlayer;
                   if (s.activePlayer === 'player') targetCard = findTarget(s.playerFlight);
                   else targetCard = findTarget(s.opponentFlight);
              }
              if (targetCard) {
                  const flightKey = targetOwner === 'player' ? 'playerFlight' : 'opponentFlight';
                  const currentFlight = s[flightKey as keyof GameState] as BoardCard[];
                  const newFlight = currentFlight.filter(c => c.id !== targetCard!.id);
                  set(s => ({
                      [flightKey]: newFlight,
                      discardPile: [...s.discardPile, targetCard!]
                  }));
                  get().addNotification(`Dragonslayer kills ${targetCard.name}!`);
              }
              if (Object.keys(updates).length > 0) set(updates);
              return;
          }
          const targets = target === 'all' ? ['player', 'opponent'] : [target];
          targets.forEach(t => {
              const isPlayer = t === 'player';
              const hand = isPlayer ? state.playerHand : state.opponentHand;
              if (hand.length === 0) return;
              if (criteria === 'random') {
                   const idx = Math.floor(Math.random() * hand.length);
                   const removed = hand[idx];
                   const newHand = hand.filter((_, i) => i !== idx);
                   if (isPlayer) updates.playerHand = newHand;
                   else updates.opponentHand = newHand;
                   set(s => ({ discardPile: [...s.discardPile, removed] }));
                   get().addNotification(`${isPlayer ? 'You' : getNPCName(get().npcId)} lost a card to Red Dragon.`);
              }
          });
      }

      if (effect.stealCard) {
          const { from, to, count } = effect.stealCard;
          const fromHand = from === 'player' ? [...(updates.playerHand || state.playerHand)] : [...(updates.opponentHand || state.opponentHand)];
          const toHand = to === 'player' ? [...(updates.playerHand || state.playerHand)] : [...(updates.opponentHand || state.opponentHand)];

          for (let i = 0; i < count; i++) {
              if (fromHand.length > 0 && toHand.length < HAND_LIMIT) {
                  const idx = Math.floor(Math.random() * fromHand.length);
                  const card = fromHand.splice(idx, 1)[0];
                  toHand.push(card);
              }
          }

          if (from === 'player') updates.playerHand = fromHand;
          else updates.opponentHand = fromHand;

          if (to === 'player') updates.playerHand = toHand;
          else updates.opponentHand = toHand;
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

           if (target === 'player' || target === 'all') {
               const hand = updates.playerHand || state.playerHand;
               const space = HAND_LIMIT - hand.length;
               if (space > 0) {
                   const drawn = safeDraw(Math.min(count, space));
                   updates.playerHand = [...hand, ...drawn];
               } else {
                   get().addNotification("Your hand is full!", 'alert');
               }
           }
           if (target === 'opponent' || target === 'all') {
               const hand = updates.opponentHand || state.opponentHand;
               const space = HAND_LIMIT - hand.length;
               if (space > 0) {
                   const drawn = safeDraw(Math.min(count, space));
                   updates.opponentHand = [...hand, ...drawn];
               }
           }
           updates.deck = deck;
      }

      if (effect.stealAnte) {
          const { target, count, criteria } = effect.stealAnte;
          const s = get();
          const antes = [s.playerAnte, s.opponentAnte].filter(Boolean) as CardData[];
          if (antes.length > 0) {
              if (criteria === 'weakest') {
                  antes.sort((a,b) => a.strength - b.strength);
                  const toSteal = antes.slice(0, count);
                  const targetHand = target === 'player' ? (updates.playerHand || s.playerHand) : (updates.opponentHand || s.opponentHand);
                  const space = HAND_LIMIT - targetHand.length;
                  const finalSteal = toSteal.slice(0, space);
                  if (finalSteal.length > 0) {
                      if (target === 'player') {
                          updates.playerHand = [...targetHand, ...finalSteal];
                          get().addNotification(`You retrieved ${finalSteal.length} Ante card${finalSteal.length > 1 ? 's' : ''}.`);
                      } else {
                          updates.opponentHand = [...targetHand, ...finalSteal];
                          get().addNotification(`${getNPCName(get().npcId)} retrieved ${finalSteal.length} Ante card${finalSteal.length > 1 ? 's' : ''}.`);
                      }
                      const stolenIds = finalSteal.map(c => c.id);
                      if (s.playerAnte && stolenIds.includes(s.playerAnte.id)) updates.playerAnte = null;
                      if (s.opponentAnte && stolenIds.includes(s.opponentAnte.id)) updates.opponentAnte = null;
                  }
              }
          }
      }

      if (effect.specialAction === 'copy-evil-power') {
          const s = get();
          const allDragons = [...s.playerFlight, ...s.opponentFlight];
          const evilDragons = allDragons.filter(c => c.type === 'evil' && c.name !== 'Dracolich');
          const strongest = evilDragons.sort((a,b) => b.strength - a.strength)[0];
          if (strongest) {
              get().addNotification(`Dracolich copies ${strongest.name}!`, 'power');
              if (Object.keys(updates).length > 0) set(updates);
              setTimeout(() => {
                 const subEffect = resolveCardPower(strongest, get(), s.activePlayer);
                 get().applyGameEffect(subEffect);
              }, 1000);
              return;
          }
      }

      if (effect.specialAction) {
          const rules = { ...state.activeSpecialRules };
          if (effect.specialAction === 'weakest-wins') rules.weakestFlightWins = true;
          if (effect.specialAction === 'become-leader') rules.nextRoundLeader = state.activePlayer;
          updates.activeSpecialRules = rules;
      }

      if (Object.keys(updates).length > 0) {
          set(updates);
      }

      if (effect.specialAction === 'replace-with-top-deck') {
           const s = get();
           const flight = s.activePlayer === 'player' ? [...s.playerFlight] : [...s.opponentFlight];
           const oldCard = flight[flight.length - 1];
           if (oldCard && oldCard.name.includes('Copper')) {
               get().addNotification("Copper Dragon burrows...", 'info');
               setTimeout(() => {
                   const s2 = get();
                   let deck = [...s2.deck];
                   if (deck.length > 0) {
                       const newCard = deck.shift();
                       flight.pop();
                       const replacedCard = { ...newCard!, owner: s2.activePlayer, playedAtRound: s2.round };
                       flight.push(replacedCard);
                       const updateKey = s2.activePlayer === 'player' ? 'playerFlight' : 'opponentFlight';
                       set({ deck, [updateKey]: flight, discardPile: [...s2.discardPile, oldCard] });
                       get().addNotification(`...and returns as ${replacedCard.name}!`, 'power');
                       useAnimationStore.getState().triggerFlash();
                       setTimeout(() => {
                           const newEffect = resolveCardPower(replacedCard, get(), s2.activePlayer);
                           get().applyGameEffect(newEffect);
                       }, 1500);
                   }
               }, 1000);
           }
      }

      if (effect.specialAction === 'trigger-all-good') {
          const s = get();
          const flight = s.activePlayer === 'player' ? s.playerFlight : s.opponentFlight;
          const goodDragons = flight.filter(c => c.type === 'good' && c.name !== 'Princess');
          if (goodDragons.length > 0) {
              let idx = 0;
              const triggerNext = () => {
                  if (idx >= goodDragons.length) return;
                  const dragon = goodDragons[idx];
                  get().addNotification(`Princess inspires ${dragon.name}!`, 'power');
                  const subEffect = resolveCardPower(dragon, get(), s.activePlayer);
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
           const antes = [s.playerAnte, s.opponentAnte].filter(Boolean) as CardData[];
           const strongest = antes.sort((a,b) => b.strength - a.strength)[0];
           if (strongest) {
               get().addNotification(`Archmage copies ante: ${strongest.name}!`, 'power');
               setTimeout(() => {
                   const subEffect = resolveCardPower(strongest, get(), s.activePlayer);
                   get().applyGameEffect(subEffect);
               }, 1000);
           }
      }
  }
}));
