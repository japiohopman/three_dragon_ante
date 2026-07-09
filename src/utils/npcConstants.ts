
import { NPCData } from '../types';

const BASE_NPC_URL = 'https://raw.githubusercontent.com/japiohopman/artificer/main/public/assets/atlas/characters/npc/images/';
const BASE_BG_URL = 'https://raw.githubusercontent.com/japiohopman/artificer/main/public/assets/images/shop_location_backgrounds/';

const createNPC = (
  id: string,
  name: string,
  race: string,
  role: string,
  ext: 'webp' | 'png' = 'png',
  willingToPlay: boolean = true,
  isGambler: boolean = true,
  personality: string = "A mysterious traveler in the tavern."
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
    strength: 10 + Math.floor(Math.random() * 5),
    dexterity: 10 + Math.floor(Math.random() * 5),
    intelligence: 10 + Math.floor(Math.random() * 5),
    wisdom: 10 + Math.floor(Math.random() * 5),
    charisma: 10 + Math.floor(Math.random() * 5)
  }
});

export const NPC_LIST: NPCData[] = [
  createNPC('female_commoner_drow', 'Viconia', 'Drow', 'Commoner', 'webp', true, true, "A Drow on the run from her past, she enjoys a strategic game of Three-Dragon Ante."),
  createNPC('female_alchemist_tabaxi', 'Seed of the West', 'Tabaxi', 'Alchemist', 'webp', true, true, "Constantly smelling of sulfur and herbs, she treats gambling like a chemical experiment."),
  createNPC('female_archmage_moon_elf', 'Amlaruil Stormrider', 'Moon Elf', 'Archmage', 'png', true, true, "An elven noble who plays for the thrill of high stakes and ancient lore."),
  createNPC('female_commoner_moon_elf', 'Moon Elf Commoner', 'Moon Elf', 'Commoner', 'png', false, false),
  createNPC('female_druid_high_elf', 'High Elf Druid', 'High Elf', 'Druid', 'png', true, true),
  createNPC('female_guard_high_elf', 'High Elf Guard', 'High Elf', 'Guard', 'png', false, false),
  createNPC('female_innkeeper_half-orc', 'Half-Orc Innkeeper', 'Half-Orc', 'Innkeeper', 'png', true, true),
  createNPC('female_mage_high_elf', 'High Elf Mage', 'High Elf', 'Mage', 'png', true, true),
  createNPC('female_mage_tiefling', 'Tiefling Mage', 'Tiefling', 'Mage', 'webp', true, true),
  createNPC('female_paladin_mountain_dwarf', 'Mountain Dwarf Paladin', 'Mountain Dwarf', 'Paladin', 'png', true, true),
  createNPC('female_ranger_high_elf', 'High Elf Ranger', 'High Elf', 'Ranger', 'png', true, true),
  createNPC('female_ranger_wood_elf', 'Wood Elf Ranger', 'Wood Elf', 'Ranger', 'png', true, true),
  createNPC('female_rogue_tiefling', 'Tiefling Rogue', 'Tiefling', 'Rogue', 'png', true, true),
  createNPC('male_artificer_tiefling', 'Tiefling Artificer', 'Tiefling', 'Artificer', 'png', true, true),
  createNPC('male_blacksmith_mountain_dwarf', 'Mountain Dwarf Blacksmith', 'Mountain Dwarf', 'Blacksmith', 'png', true, true),
  createNPC('male_captain_high_elf', 'High Elf Captain', 'High Elf', 'Captain', 'webp', true, true),
  createNPC('male_commoner_half-orc', 'Half-Orc Commoner', 'Half-Orc', 'Commoner', 'png', false, false),
  createNPC('male_fighter_tabaxi', 'Tabaxi Fighter', 'Tabaxi', 'Fighter', 'webp', true, true),
  createNPC('male_guard_high_elf', 'High Elf Guard', 'High Elf', 'Guard', 'png', false, false),
  createNPC('male_guard_mountain_dwarf', 'Mountain Dwarf Guard', 'Mountain Dwarf', 'Guard', 'png', false, false),
  createNPC('male_king_half-orc', 'Half-Orc King', 'Half-Orc', 'King', 'png', true, true),
  createNPC('male_mage_high_elf', 'High Elf Mage', 'High Elf', 'Mage', 'webp', true, true),
  createNPC('male_paladin_high_elf', 'High Elf Paladin', 'High Elf', 'Paladin', 'png', true, true),
  createNPC('male_paladin_mountain_dwarf', 'Mountain Dwarf Paladin', 'Mountain Dwarf', 'Paladin', 'png', true, true),
  createNPC('male_rogue_tiefling', 'Tiefling Rogue', 'Tiefling', 'Rogue', 'webp', true, true),
  createNPC('male_scholar_rock_gnome', 'Rock Gnome Scholar', 'Rock Gnome', 'Scholar', 'png', true, true),
];
