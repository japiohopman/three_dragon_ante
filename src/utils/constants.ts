
import { CardData, DragonColor, CardType, StandardCardData, Suit, Rank } from '../types';

// Atlas Mapping (5x5)
export const ATLAS_URL = "https://github.com/japiohopman/artificer/blob/main/public/assets/images/three_dragons_ante_card_game/tda_cards.webp?raw=true";
export const ATLAS_URL_SMALL = "https://github.com/japiohopman/artificer/blob/main/public/assets/images/three_dragons_ante_card_game/tda_cards_small.webp?raw=true";

export const SPRITE_MAP = {
  Red: 0, Blue: 1, Green: 2, Black: 3, White: 4,
  Gold: 5, Silver: 6, Bronze: 7, Copper: 8, Brass: 9,
  Bahamut: 10, Tiamat: 11, Dracolich: 12,
  Thief: 15, Archmage: 16, Druid: 17, Slayer: 18, Fool: 19,
  Princess: 20, Priest: 21, CardBack: 23, Logo: 24
};

export const HAND_LIMIT = 10;

// Excluded indices (Empty or UI)
export const EXCLUDED_SPRITES = [13, 14, 22, 23, 24];

// Valid gameplay sprites for generic games (Memory, Solitaire)
export const VALID_SPRITES = [
  0, 1, 2, 3, 4,    // Chromatics
  5, 6, 7, 8, 9,    // Metallics
  10, 11, 12,       // Legends
  15, 16, 17, 18, 19, // Mortals
  20, 21            // Specials
];

// Helper to generate a unique ID
const uid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substr(2, 9);
};

const createDragons = (
  name: string,
  color: DragonColor,
  type: CardType,
  strengths: number[],
  spriteIndex: number,
  desc: string
): CardData[] => {
  return strengths.map(str => ({
    id: uid(),
    name: `${name} Dragon`,
    strength: str,
    color,
    type,
    spriteIndex,
    description: desc
  }));
};

export const generateDeck = (): CardData[] => {
  let deck: CardData[] = [];

  // --- EVIL DRAGONS (30 Cards) ---
  deck.push(...createDragons('Red', 'red', 'evil', [2, 3, 5, 8, 10, 12], SPRITE_MAP.Red,
    "The opponent with the strongest flight pays you 1 gold. Take a random card from that player's hand."));
  deck.push(...createDragons('Blue', 'blue', 'evil', [1, 2, 4, 7, 9, 11], SPRITE_MAP.Blue,
    "Choose one: Steal 1 gold from the stakes for each evil dragon in your flight; or each opponent pays that much gold to the stakes."));
  deck.push(...createDragons('Green', 'green', 'evil', [1, 2, 4, 6, 8, 10], SPRITE_MAP.Green,
    "The opponent to your left chooses either to give you a weaker evil dragon from his or her hand or to pay you 5 gold."));
  deck.push(...createDragons('Black', 'black', 'evil', [1, 2, 3, 5, 7, 9], SPRITE_MAP.Black,
    "Steal 2 gold from the stakes."));
  deck.push(...createDragons('White', 'white', 'evil', [1, 2, 3, 4, 6, 8], SPRITE_MAP.White,
    "If any flight includes a mortal, steal 3 gold from the stakes."));

  // --- GOOD DRAGONS (30 Cards) ---
  deck.push(...createDragons('Gold', 'gold', 'good', [2, 4, 6, 9, 11, 13], SPRITE_MAP.Gold,
    "Draw a card for each good dragon in your flight."));
  deck.push(...createDragons('Silver', 'silver', 'good', [2, 3, 6, 8, 10, 12], SPRITE_MAP.Silver,
    "Each player with at least one good dragon in his or her flight draws a card."));
  deck.push(...createDragons('Bronze', 'bronze', 'good', [1, 3, 6, 7, 9, 11], SPRITE_MAP.Bronze,
    "Put the two weakest ante cards into your hand."));
  deck.push(...createDragons('Copper', 'copper', 'good', [1, 3, 5, 7, 8, 10], SPRITE_MAP.Copper,
    "Discard this card and replace it with the top card of the deck. That card's power triggers regardless of its strength."));
  deck.push(...createDragons('Brass', 'brass', 'good', [1, 2, 4, 5, 7, 9], SPRITE_MAP.Brass,
    "The opponent with the strongest flight chooses either to give you a stronger good dragon from his or her hand or to pay you 5 gold."));

  // --- MORTALS (7 Cards) ---
  deck.push({ id: uid(), name: "The Archmage", strength: 9, type: 'mortal', color: 'none', spriteIndex: SPRITE_MAP.Archmage,
    description: "Pay 1 gold to the stakes. Copy the power of an ante card." });
  deck.push({ id: uid(), name: "The Dragonslayer", strength: 8, type: 'mortal', color: 'none', spriteIndex: SPRITE_MAP.Slayer,
    description: "Pay 1 gold to the stakes. Discard a weaker dragon from any flight." });
  deck.push({ id: uid(), name: "The Thief", strength: 7, type: 'mortal', color: 'none', spriteIndex: SPRITE_MAP.Thief,
    description: "Steal 7 gold from the stakes. Discard a card from your hand." });
  deck.push({ id: uid(), name: "The Druid", strength: 6, type: 'mortal', color: 'none', spriteIndex: SPRITE_MAP.Druid,
    description: "Pay 1 gold to the stakes. The player with the weakest flight wins the gambit instead of the player with the strongest flight." });
  deck.push({ id: uid(), name: "The Priest", strength: 5, type: 'mortal', color: 'none', spriteIndex: SPRITE_MAP.Priest,
    description: "Pay 1 gold to the stakes. You are the leader for the next round of this gambit instead of any other player." });
  deck.push({ id: uid(), name: "The Princess", strength: 4, type: 'mortal', color: 'none', spriteIndex: SPRITE_MAP.Princess,
    description: "Pay 1 gold to the stakes. The power of each good dragon in your flight triggers." });
  deck.push({ id: uid(), name: "The Fool", strength: 3, type: 'mortal', color: 'none', spriteIndex: SPRITE_MAP.Fool,
    description: "Pay 1 gold to the stakes. Draw a card for each player with a flight stronger than yours." });

  // --- LEGENDS (3 Cards) ---
  deck.push({ id: uid(), name: "Tiamat", strength: 13, type: 'evil', color: 'none', spriteIndex: SPRITE_MAP.Tiamat, isLegendary: true,
    description: "Dragon God - Tiamat counts as a Black, Blue, Green, Red, and White Dragon. As long as you have Tiamat and a good dragon in your flight, you can't win the gambit." });
  deck.push({ id: uid(), name: "Bahamut", strength: 13, type: 'good', color: 'none', spriteIndex: SPRITE_MAP.Bahamut, isLegendary: true,
    description: "Each other player with both good and evil dragons in the same flight pays you 10 gold. Dragon God - As long as you have Bahamut and an evil dragon in your flight, you can't win the gambit." });
  deck.push({ id: uid(), name: "Dracolich", strength: 10, type: 'evil', color: 'none', spriteIndex: SPRITE_MAP.Dracolich, isLegendary: true,
    description: "Copy the power of an evil dragon in any flight." });

  return shuffle(deck);
};

export const generateStandardDeck = (): StandardCardData[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: StandardCardData[] = [];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      let spriteIndex = SPRITE_MAP.CardBack;

      // Determine base sprite by rank first, as requested
      if (rank === 'A') {
          spriteIndex = SPRITE_MAP.Archmage;
      } else if (rank === 'J') {
          spriteIndex = SPRITE_MAP.Slayer;
      } else if (rank === 'Q') {
          spriteIndex = SPRITE_MAP.Princess;
      } else if (rank === 'K') {
          spriteIndex = SPRITE_MAP.Priest;
      } else {
          // Numbers - themed by suit (White/Bronze logic)
          // Hearts/Diamonds -> White theme
          if (suit === 'hearts' || suit === 'diamonds') {
              spriteIndex = suit === 'hearts' ? SPRITE_MAP.White : SPRITE_MAP.Silver;
          } else {
              // Spades/Clubs -> Bronze theme
              spriteIndex = suit === 'spades' ? SPRITE_MAP.Bronze : SPRITE_MAP.Brass;
          }
      }

      deck.push({ id: uid(), suit, rank, spriteIndex, isFaceUp: false });
    });
  });
  return shuffle(deck);
};

export const shuffle = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};
