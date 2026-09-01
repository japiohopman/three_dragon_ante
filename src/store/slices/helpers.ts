import { GameState, CardData } from '../../types';
import { SpecialEffectType } from '../useAnimationStore';

// DYNAMIC SCREEN COORDINATES
export const getPos = (playerIndex: number, totalPlayers: number) => {
  if (playerIndex === 0) {
    return { x: window.innerWidth / 2, y: window.innerHeight - 150 };
  }
  const opponentCount = totalPlayers - 1;
  const slotWidth = window.innerWidth / (opponentCount + 1);
  const x = slotWidth * playerIndex;
  return { x, y: 150 };
};

export const getInitialState = (): GameState => ({
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

// Helper to synchronize array states to compatibility layer
export const syncCompatibility = (draft: Partial<GameState>, currentState: GameState) => {
  const players = draft.players || currentState.players;
  if (!players || players.length === 0) return draft;

  const focusedIdx = draft.focusedOpponentIndex !== undefined ? draft.focusedOpponentIndex : currentState.focusedOpponentIndex;
  const safeFocusedIdx = (focusedIdx >= 1 && focusedIdx < players.length) ? focusedIdx : 1;

  const p0 = players[0];
  const op = players[safeFocusedIdx] || players[1] || p0;

  const activeIndex = draft.activePlayerIndex !== undefined ? draft.activePlayerIndex : currentState.activePlayerIndex;
  const activeId = players[activeIndex]?.id || 'player';

  const leaderIndex = draft.currentLeaderIndex !== undefined ? draft.currentLeaderIndex : currentState.currentLeaderIndex;
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

export const determineSpecialEffect = (card: CardData): SpecialEffectType => {
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
