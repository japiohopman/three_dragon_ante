
import { CardData, BoardCard, GameState, GameEffect, PlayerId, SpecialFlightResult, DragonColor } from '../types';

/**
 * Calculates the effect of a played card based on the current game state.
 * This is a PURE function: it returns a description of changes, it does not mutate state.
 */
export const resolveCardPower = (
  card: CardData,
  state: GameState,
  playerId: PlayerId
): GameEffect => {
  const opponentId = playerId === 'player' ? 'opponent' : 'player';
  const myFlight = playerId === 'player' ? state.playerFlight : state.opponentFlight;
  const oppFlight = playerId === 'player' ? state.opponentFlight : state.playerFlight;

  // Default empty effect
  const effect: GameEffect = { log: `${card.name} power triggered.` };

  // Helper for "Pay 1 Gold to Stakes" powers (Mortals)
  const payToStakes = (amount: number = 1) => {
    effect.goldChange = {
      [playerId]: -amount,
      pot: amount
    };
  };

  switch (card.name) {
    // --- EVIL DRAGONS ---
    case 'Red Dragon':
      effect.goldChange = { [opponentId]: -1, [playerId]: 1 };
      effect.discard = { target: opponentId, count: 1, criteria: 'random' };
      effect.log = `${card.name}: ${opponentId} pays 1 gold and loses a random card.`;
      break;

    case 'Blue Dragon':
      // Choice: Steal 1 from stakes per evil dragon OR Opponent pays that much.
      const evilCount = myFlight.filter(c => c.type === 'evil').length + 1; // +1 includes self
      effect.interaction = {
        type: 'choice',
        sourceCardName: card.name,
        target: playerId, // I choose
        options: [
          { label: `Steal ${evilCount} from Pot`, value: 'steal-pot', cost: 0, amount: evilCount },
          { label: `Make Opponent Pay ${evilCount}`, value: 'opp-pay', cost: 0, amount: evilCount }
        ]
      };
      effect.log = `${card.name}: Choose your tribute.`;
      break;

    case 'Green Dragon':
      // Opponent gives weaker evil dragon OR pays 5 gold.
      effect.interaction = {
        type: 'choice',
        sourceCardName: card.name,
        target: opponentId,
        resolveWith: 'pay-gold', // Hint for AI default
        options: [
          {
            label: `Give Weaker Evil Dragon`,
            value: 'give-card',
            cardFilter: (c: CardData) => c.type === 'evil' && c.strength < card.strength
          },
          { label: `Pay 5 Gold`, value: 'pay-gold', cost: 5, amount: 5 }
        ]
      };
      effect.log = `${card.name}: Demands tribute from ${opponentId}.`;
      break;

    case 'Black Dragon':
      effect.goldChange = { [playerId]: 2, pot: -2 };
      effect.log = `${card.name}: Steals 2 gold from the pot.`;
      break;

    case 'White Dragon':
      const hasMortal = [...myFlight, ...oppFlight].some(c => c.type === 'mortal');
      if (hasMortal) {
        effect.goldChange = { [playerId]: 3, pot: -3 };
        effect.log = `${card.name}: Mortals detected! Stealing 3 gold.`;
      } else {
        effect.log = `${card.name}: No mortals in play. Power fizzles.`;
      }
      break;

    // --- GOOD DRAGONS ---
    case 'Gold Dragon':
      const goodCount = myFlight.filter(c => c.type === 'good').length + 1;
      effect.drawCards = { target: playerId, count: goodCount };
      effect.log = `${card.name}: Drawing ${goodCount} cards.`;
      break;

    case 'Silver Dragon':
      const oppGood = oppFlight.some(c => c.type === 'good');
      if (oppGood) {
         effect.drawCards = { target: 'all', count: 1 };
         effect.log = `${card.name}: Both players draw a card.`;
      } else {
         effect.drawCards = { target: playerId, count: 1 };
         effect.log = `${card.name}: Only you draw a card.`;
      }
      break;

    case 'Bronze Dragon':
      effect.stealAnte = { target: playerId, count: 2, criteria: 'weakest' };
      effect.log = `${card.name}: Retrieving weakest Ante cards.`;
      break;

    case 'Copper Dragon':
      effect.specialAction = 'replace-with-top-deck';
      effect.log = `${card.name}: Transforming into top deck card...`;
      break;

    case 'Brass Dragon':
      effect.interaction = {
        type: 'choice',
        sourceCardName: card.name,
        target: opponentId,
        resolveWith: 'pay-gold',
        options: [
           {
             label: `Give Stronger Good Dragon`,
             value: 'give-card',
             cardFilter: (c: CardData) => c.type === 'good' && c.strength > card.strength
           },
           { label: `Pay 5 Gold`, value: 'pay-gold', cost: 5, amount: 5 }
        ]
      };
      effect.log = `${card.name}: Demands tribute from ${opponentId}.`;
      break;

    // --- MORTALS ---
    case 'The Thief':
      effect.goldChange = { [playerId]: 7, pot: -7 };
      // Force Interaction for Discard
      effect.interaction = {
        type: 'choice',
        sourceCardName: card.name,
        target: playerId,
        options: [
          { label: 'Discard a Card', value: 'discard-card', cardFilter: () => true }
        ]
      };
      effect.log = `${card.name}: Steals 7 gold! Choose a card to discard.`;
      break;

    case 'The Archmage':
      payToStakes(1);
      effect.specialAction = 'copy-ante';
      effect.log = `${card.name}: Pays 1. Casting spell to copy Ante...`;
      break;

    case 'The Dragonslayer':
      payToStakes(1);
      // Logic: Discard a weaker dragon (Strength <= 7) from any flight.
      effect.discard = { target: 'all', count: 1, criteria: 'weaker-dragon' };
      effect.log = `${card.name}: Pays 1. Hunts a weaker dragon (Str <= 7).`;
      break;

    case 'The Druid':
      payToStakes(1);
      effect.specialAction = 'weakest-wins';
      effect.log = `${card.name}: Pays 1. Nature favors the weak this gambit.`;
      break;

    case 'The Priest':
      payToStakes(1);
      effect.specialAction = 'become-leader';
      effect.log = `${card.name}: Pays 1. Seizes initiative for next round.`;
      break;

    case 'The Princess':
      payToStakes(1);
      effect.specialAction = 'trigger-all-good';
      effect.log = `${card.name}: Pays 1. Rallying all good dragons!`;
      break;

    case 'The Fool':
      payToStakes(1);
      const myStr = myFlight.reduce((a,b) => a + b.strength, 0);
      const oppStr = oppFlight.reduce((a,b) => a + b.strength, 0);
      if (oppStr > myStr) {
         effect.drawCards = { target: playerId, count: 1 };
         effect.log = `${card.name}: Pays 1. Foolishly behind, draws a card.`;
      } else {
         effect.log = `${card.name}: Pays 1. Ahead, so learns nothing.`;
      }
      break;

    // --- LEGENDS ---
    case 'Dracolich':
      effect.specialAction = 'copy-evil-power';
      effect.log = `${card.name}: Rising from the grave to copy an evil power...`;
      break;

    case 'Bahamut':
      // Each other player with both good and evil dragons in the same flight pays you 10 gold.
      const hasGood = oppFlight.some(c => c.type === 'good');
      const hasEvil = oppFlight.some(c => c.type === 'evil');
      if (hasGood && hasEvil) {
        effect.goldChange = { [opponentId]: -10, [playerId]: 10 };
        effect.log = `${card.name}: Judges ${opponentId}'s mixed flight! Pays 10 gold.`;
      } else {
        effect.log = `${card.name}: No mixed flight found to judge.`;
      }
      break;

    case 'Tiamat':
      effect.log = `${card.name}: The Dragon God descends!`;
      break;

    default:
      effect.log = `${card.name}: Roars! (No special effect implemented)`;
      break;
  }

  return effect;
};

export const checkFlightFormation = (
  flight: BoardCard[],
  newCard: BoardCard
): SpecialFlightResult | null => {
  if (flight.length < 3) return null;

  const dragons = flight.filter(c => c.type !== 'mortal');

  if (dragons.length < 3) return null;

  // Check Strength Flight
  const sameStrength = dragons.filter(c => c.strength === newCard.strength);
  if (sameStrength.length >= 3) {
      return {
          type: 'strength',
          strength: newCard.strength,
          cards: sameStrength.slice(-3)
      };
  }

  // Check Color Flight
  const isTiamat = (c: CardData) => c.name.includes('Tiamat');
  const isChromatic = (c: CardData) => ['red','blue','green','black','white'].includes(c.color);

  let targetColor: DragonColor = newCard.color;

  if (isTiamat(newCard)) {
      const others = dragons.filter(c => c.id !== newCard.id);
      const colorCounts: Record<string, number> = {};
      others.forEach(c => {
          if (isChromatic(c)) {
              colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
          }
      });
      const matchColor = Object.keys(colorCounts).find(col => colorCounts[col] >= 2);
      if (matchColor) {
          return { type: 'color', color: matchColor as DragonColor, cards: [newCard] };
      }
  } else if (isChromatic(newCard)) {
      const matches = dragons.filter(c =>
          c.color === targetColor || isTiamat(c)
      );
      if (matches.length >= 3) {
          return { type: 'color', color: targetColor, cards: matches.slice(-3) };
      }
  }

  return null;
};
