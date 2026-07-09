
export type CardType = 'good' | 'evil' | 'mortal';
export type DragonColor = 'red' | 'blue' | 'green' | 'black' | 'white' | 'gold' | 'silver' | 'bronze' | 'copper' | 'brass' | 'none';

export type AppMode = 'showcase' | 'tda' | 'memory' | 'solitaire' | 'forge';

export interface CardData {
  id: string;
  name: string;
  strength: number;
  type: CardType;
  color: DragonColor;
  spriteIndex: number; // 0-24 based on the Atlas
  description: string;
  isLegendary?: boolean; // For Bahamut/Tiamat passive effects
}

// For Standard 52-card deck games
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface StandardCardData {
  id: string;
  suit: Suit;
  rank: Rank;
  spriteIndex: number;
  isFaceUp: boolean;
}

export type PlayerId = 'player' | 'opponent';

export type PlayerSkill = 'none' | 'bluff' | 'sleight-of-hand' | 'concentration';

export type GamePhase =
  | 'lobby'
  | 'ante-selection'
  | 'ante-reveal'
  | 'round-start'
  | 'player-turn'
  | 'opponent-turn'
  | 'round-resolution'
  | 'gambit-end'
  | 'game-over' // New phase for final victory/defeat
  | 'decision'; // New phase for handling interruptions

export interface BoardCard extends CardData {
  owner: PlayerId;
  playedAtRound: number;
}

export interface Notification {
  message: string;
  type?: 'info' | 'gold-gain' | 'gold-loss' | 'power' | 'alert';
  duration?: number;
}

// Option structure for UI buttons
export interface InteractionOption {
  label: string;
  value: string; // The action key (e.g., 'pay-5', 'give-card')
  cost?: number;
  amount?: number; // For variable effects (e.g. Blue Dragon steals X)
  cardFilter?: (c: CardData) => boolean; // If this option involves selecting a card
}

// For handling complex card interactions (e.g. Green Dragon: Pay or Give Card)
export interface InteractionRequest {
  type: 'choice' | 'card-selection';
  sourceCardName: string; // The card causing this (e.g. "Green Dragon")
  target: PlayerId; // Who needs to make the choice
  options: InteractionOption[];
  resolveWith?: 'pay-gold' | 'give-card'; // Metadata for AI
}

// Describes the result of a power logic calculation without mutating state
export interface GameEffect {
  // Delta changes to economy
  goldChange?: {
    player?: number;
    opponent?: number;
    pot?: number;
  };

  // Card manipulations
  drawCards?: {
    target: PlayerId | 'all';
    count: number;
    source?: 'deck';
  };

  stealAnte?: {
    target: PlayerId;
    count: number;
    criteria: 'weakest';
  };

  discard?: {
    target: PlayerId | 'all';
    count: number;
    criteria?: 'random' | 'choice' | 'weaker-dragon';
  };

  stealCard?: {
    from: PlayerId;
    to: PlayerId;
    count: number;
    criteria: 'random';
  };

  // Complex Logic Triggers
  interaction?: InteractionRequest;

  // Special Flags
  specialAction?:
    | 'replace-with-top-deck' // Copper Dragon
    | 'copy-ante'             // Archmage
    | 'copy-evil-power'       // Dracolich
    | 'trigger-all-good'      // Princess
    | 'weakest-wins'          // Druid
    | 'become-leader';        // Priest

  log: string;
}

export interface SpecialFlightResult {
  type: 'color' | 'strength' | null;
  strength?: number; // The strength of the flight (for Strength flights)
  color?: DragonColor; // The color of the flight
  cards: BoardCard[]; // The cards involved
}

export interface ActiveSpecialRules {
  weakestFlightWins?: boolean; // Druid
  nextRoundLeader?: PlayerId; // Priest
}

export interface GambitResult {
  winner: PlayerId | 'tie';
  playerStrength: number;
  opponentStrength: number;
  potWon: number;
  reason: string;
}

export type NPCEmotion =
  | 'neutral'
  | 'curious'
  | 'skeptical'
  | 'happy'
  | 'greedy'
  | 'angry'
  | 'sad'
  | 'surprised'
  | 'proud';

export interface NPCData {
  id: string;
  name: string;
  race: string;
  role: string;
  personality: string;
  matrixUrl: string;
  backgroundUrl?: string;
  isGambler: boolean;
  willingToPlay?: boolean;
  stats: {
    strength: number;
    dexterity: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

export interface GameState {
  // Core State
  npcId?: string;
  phase: GamePhase;
  round: number; // 1, 2, or 3
  pot: number;
  deck: CardData[];
  discardPile: CardData[]; // Added discard pile

  // Match Stats
  maxGambits: number;
  gambitsPlayed: number;

  // RPG Elements
  playerSkill: PlayerSkill;

  // Player State
  playerGold: number;
  playerHand: CardData[];
  playerFlight: BoardCard[];
  playerAnte: CardData | null;

  // Character Data from Artificer Save
  characterStats?: {
    strength: number;
    dexterity: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };

  // Opponent State (Aldric)
  opponentGold: number;
  opponentHand: CardData[];
  opponentFlight: BoardCard[];
  opponentAnte: CardData | null;

  // Round Logic
  currentLeader: PlayerId; // Who plays first this round
  activePlayer: PlayerId;
  lastCardPlayed: BoardCard | null;

  // Rules for current gambit
  activeSpecialRules: ActiveSpecialRules;
  gambitResult: GambitResult | null; // Detailed results for the end screen

  // Pending Interaction (For Green Dragon, etc.)
  pendingInteraction: InteractionRequest | null;

  // UI & Effects
  notification: Notification | null;
  history: string[]; // Log of actions
  opponentEmotion: NPCEmotion;
  npcLine?: string;
  isTalking?: boolean;
}
