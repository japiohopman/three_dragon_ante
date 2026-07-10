
import { NPCData } from '../types';

const BASE_NPC_URL = 'https://raw.githubusercontent.com/japiohopman/artificer/main/public/assets/atlas/characters/npc/images/';
const BASE_BG_URL = 'https://raw.githubusercontent.com/japiohopman/artificer/main/public/assets/images/shop_location_backgrounds/';

const createNPC = (
  id: string,
  name: string,
  race: string,
  role: string,
  ext: 'webp' | 'png' = 'webp',
  willingToPlay: boolean = true,
  isGambler: boolean = true,
  personality: string = "A traveler in the tavern looking for a game."
): NPCData => ({
  id,
  name,
  race,
  role,
  personality,
  matrixUrl: `${BASE_NPC_URL}${id}_matrix.${ext}`,
  backgroundUrl: `${BASE_BG_URL}day_wood_elf_tavern.webp`,
  willingToPlay,
  isGambler,
  stats: {
    strength: 10 + Math.floor(Math.random() * 8),
    dexterity: 10 + Math.floor(Math.random() * 8),
    intelligence: 10 + Math.floor(Math.random() * 8),
    wisdom: 10 + Math.floor(Math.random() * 8),
    charisma: 10 + Math.floor(Math.random() * 8)
  }
});

export const NPC_LIST: NPCData[] = [
  // Females
  createNPC('female_alchemist_lightfoot_halfling', 'Aris', 'Halfling', 'Alchemist', 'webp', true, true, "She smells of strange reagents and always has a deck ready."),
  createNPC('female_artificer_dragonborn', 'Kava', 'Dragonborn', 'Artificer', 'webp', true, true, "She treats every hand of cards like a mechanical puzzle."),
  createNPC('female_blacksmith_high_elf', 'Elowen', 'High Elf', 'Blacksmith', 'webp', true, true, "Sturdy and patient, she plays a very defensive game."),
  createNPC('female_blacksmith_owlin', 'Hoot', 'Owlin', 'Blacksmith', 'webp', true, true, "Observant and quiet, she watches your every move."),
  createNPC('female_cleric_goliath_obaya', 'Obaya', 'Goliath', 'Cleric', 'webp', true, true, "A traveler from afar, collecting stories and gold."),
  createNPC('female_cleric_human', 'Sister Elena', 'Human', 'Cleric', 'webp', true, true, "She believes the cards reveal the will of the gods."),
  createNPC('female_commoner_drow', 'Viconia', 'Drow', 'Commoner', 'webp', true, true, "A Drow on the run from her past, she enjoys a strategic game."),
  createNPC('female_commoner_firbolg', 'Willow', 'Firbolg', 'Commoner', 'webp', true, true, "Kind-hearted but surprisingly good at bluffing."),
  createNPC('female_commoner_mountain_dwarf', 'Hilda', 'Mountain Dwarf', 'Commoner', 'webp', true, true, "Hard-working and plays for the love of the game."),
  createNPC('female_fighter_mountain_dwarf', 'Audhild', 'Mountain Dwarf', 'Fighter', 'webp', true, true, "Aggressive and bold, she isn't afraid of high stakes."),
  createNPC('female_lord_moon_elf', 'Lady Alustriel', 'Moon Elf', 'Lord', 'webp', true, true, "Elegant and calculating, a true master of the game."),
  createNPC('female_mage_human', 'Morgana', 'Human', 'Mage', 'webp', true, true, "She uses logic and probability to dominate the table."),
  createNPC('female_mage_tiefling', 'Makaria', 'Tiefling', 'Mage', 'webp', true, true, "Her tail twitches when she has a good hand."),
  createNPC('female_mercenary_tortle', 'Slow-Shell', 'Tortle', 'Mercenary', 'webp', true, true, "Slow to act, but always makes the right move eventually."),
  createNPC('female_queen_drow', 'Matron Malice', 'Drow', 'Queen', 'webp', true, true, "Ruthless and demanding, she expects to win every gambit."),
  createNPC('female_ranger_high_elf', 'Irilia', 'High Elf', 'Ranger', 'webp', true, true, "Keen-eyed and focused, she never misses a tell."),
  createNPC('female_rogue_mountain_dwarf', 'Tana', 'Mountain Dwarf', 'Rogue', 'webp', true, true, "Watch your purse and your cards when playing with her."),
  createNPC('female_sorcerer_human', 'Kira', 'Human', 'Sorcerer', 'webp', true, true, "She has a natural flair for the dramatic at the table."),
  createNPC('female_wizard_highelf_laeral', 'Laeral Silverhand', 'High Elf', 'Wizard', 'webp', true, true, "A legendary figure who enjoys a quiet game in the tavern."),

  // Males
  createNPC('male_bard_mountain_dwarf', 'Berrinar', 'Mountain Dwarf', 'Bard', 'webp', true, true, "He sings about his wins and drinks away his losses."),
  createNPC('male_blacksmith_dragonborn', 'Donaar', 'Dragonborn', 'Blacksmith', 'webp', true, true, "His scales glow slightly when he gets excited about a pot."),
  createNPC('male_blacksmith_dwarf_thrak', 'Thrak', 'Dwarf', 'Blacksmith', 'webp', true, true, "A legendary smith with a very heavy betting hand."),
  createNPC('male_blacksmith_mountain_dwarf', 'Tordek', 'Mountain Dwarf', 'Blacksmith', 'webp', true, true, "Honest and straightforward, he plays by the book."),
  createNPC('male_captain_moon_elf', 'Captain Zylos', 'Moon Elf', 'Captain', 'webp', true, true, "Used to commanding ships, he commands the table with ease."),
  createNPC('male_captain_water_genasi', 'Flow', 'Water Genasi', 'Captain', 'webp', true, true, "Unpredictable and fluid, his strategy changes like the tide."),
  createNPC('male_commoner_drow', 'Jarlaxle', 'Drow', 'Commoner', 'webp', true, true, "A 'simple commoner' with a very expensive-looking hat."),
  createNPC('male_fighter_human', 'Keth', 'Human', 'Fighter', 'webp', true, true, "He treats the game like a duel of wits."),
  createNPC('male_fighter_mountain_dwarf', 'Bruenor', 'Mountain Dwarf', 'Fighter', 'webp', true, true, "He plays with a grim determination to win."),
  createNPC('male_fighter_tabaxi', 'Raiding Talon', 'Tabaxi', 'Fighter', 'webp', true, true, "His reflexes are sharp, and so is his betting."),
  createNPC('male_innkeeper_half-orc', 'Grog', 'Half-Orc', 'Innkeeper', 'webp', true, true, "The host with the most cards in his hand."),
  createNPC('male_innkeeper_human_durnan', 'Durnan', 'Human', 'Innkeeper', 'webp', true, true, "The owner of the Yawning Portal himself."),
  createNPC('male_king_yuan-ti', 'Sssilas', 'Yuan-ti', 'King', 'webp', true, true, "Cold and calculating, he rarely bluffs but often wins."),
  createNPC('male_lord_moon_elf', 'Lord Elrond', 'Moon Elf', 'Lord', 'webp', true, true, "Wise and patient, he plays the long game."),
  createNPC('male_mage_mountain_dwarf', 'Adrik', 'Mountain Dwarf', 'Mage', 'webp', true, true, "He mixes magic and math for a formidable strategy."),
  createNPC('male_merchant_human', 'Barnaby', 'Human', 'Merchant', 'webp', true, true, "He knows the value of every gold piece in the pot."),
  createNPC('male_merchant_human_mirt', 'Mirt', 'Human', 'Merchant', 'webp', true, true, "A wealthy merchant who doesn't mind losing a few gold for a good game."),
  createNPC('male_paladin_high_elf', 'Hadrian', 'High Elf', 'Paladin', 'webp', true, true, "He plays with honor and expects the same from you."),
];
