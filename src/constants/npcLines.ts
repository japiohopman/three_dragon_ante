
export interface NPCSeedData {
  identity: string;
  vocabulary: string[];
  seeds: {
    start: string[];
    power: string[];
    victory: string[];
    defeat: string[];
    thinking: string[];
  };
}

export const ARCHETYPES: Record<string, NPCSeedData> = {
  sage: {
    identity: "Sage: Calm, measured, philosophical, slightly gravelly. Slow and deliberate pacing.",
    vocabulary: ["fate", "stars", "patience", "flow", "balance", "wisdom", "cosmos"],
    seeds: {
      start: ["The cards, like the stars, reveal much to those who listen."],
      power: ["A moment of clarity in a sea of chance."],
      victory: ["Patience is the greatest hand one can play."],
      defeat: ["Even the oldest trees must shed their leaves."],
      thinking: ["Hmm... the flow of fate is shifting."]
    }
  },
  warrior: {
    identity: "Warrior: Low-pitched, gritty, authoritative, no-nonsense. Steady pacing, clipping consonants.",
    vocabulary: ["strength", "victory", "tactical", "defense", "strike", "gold", "battle"],
    seeds: {
      start: ["Ready your gold. This will be a short fight."],
      power: ["Victory through strength!"],
      victory: ["A decisive blow. The pot is mine."],
      defeat: ["A tactical error... I will not make it again."],
      thinking: ["Analyzing your defenses..."]
    }
  },
  noble: {
    identity: "Noble: Formal, posh, condescending but elegant. Flowing pacing, slightly enunciated.",
    vocabulary: ["excellence", "commoner", "absurd", "flawed", "bore", "grace", "pedigree"],
    seeds: {
      start: ["I suppose I can spare a moment for a commoner's game."],
      power: ["Excellence is rarely a matter of luck."],
      victory: ["Naturally. The outcome was never in doubt."],
      defeat: ["Absurd! This deck must be flawed."],
      thinking: ["Do try not to bore me with your slow play."]
    }
  },
  scoundrel: {
    identity: "Scoundrel: Whispering, fast-talking, street-smart, raspy. Erratic pacing, quick bursts.",
    vocabulary: ["purse", "game", "tell", "cheater", "luck", "shadows", "gold"],
    seeds: {
      start: ["Watch your purse, traveler. The game is afoot."],
      power: ["Now you see it, now you don't."],
      victory: ["Easy gold. Don't take it personally."],
      defeat: ["Cheater! No... wait, I just had a bad hand."],
      thinking: ["Looking for the tell... there it is."]
    }
  },
  worker: {
    identity: "Worker: Boisterous, warm, thick regional accents, earthy. Energetic, rhythmic pacing.",
    vocabulary: ["honest", "coin", "anvil", "measure", "cut", "round", "sweat"],
    seeds: {
      start: ["A honest game for a honest coin! Pull up a chair."],
      power: ["Hard work pays off!"],
      victory: ["Ha! That's a round of drinks on me!"],
      defeat: ["Back to the anvil. I need to earn that back."],
      thinking: ["Measure twice, cut once..."]
    }
  },
  host: {
    identity: "Host: Deep, hearty, resonant, inviting. Smooth, theatrical pacing.",
    vocabulary: ["welcome", "flagon", "magic", "tavern", "friend", "house", "hospitality"],
    seeds: {
      start: ["Welcome to the Flagon! Shall we see what the dragons say?"],
      power: ["A bit of tavern magic for the table!"],
      victory: ["The house always... well, I always win!"],
      defeat: ["A fine display! You've earned this win, friend."],
      thinking: ["Let's keep the game moving, shall we?"]
    }
  },
  stalker: {
    identity: "Stalker: Breathy, soft, observant, almost monotone. Very slow pacing, pauses between sentences.",
    vocabulary: ["watching", "silence", "missing", "waiting", "shadow", "stillness"],
    seeds: {
      start: ["...I am watching."],
      power: ["...I saw that coming."],
      victory: ["...The silence is broken by the sound of gold."],
      defeat: ["...Interesting. I missed that."],
      thinking: ["..."]
    }
  },
  adept: {
    identity: "Adept: Analytical, energetic, technical, high-pitched. Fast pacing, overlapping thoughts.",
    vocabulary: ["probability", "calculating", "logic", "formula", "variance", "outcome", "optimal"],
    seeds: {
      start: ["The probability of your success is... negligible. Let's begin."],
      power: ["Calculating optimal outcome... achieved."],
      victory: ["Logic wins again. It's a simple formula, really."],
      defeat: ["Variance! It's the only explanation for this loss."],
      thinking: ["If P equals X, then the dragon is..."]
    }
  },
  wild: {
    identity: "Wild: Ethereal, raspy, eccentric, growling or melodic. Unpredictable pacing, changing volume.",
    vocabulary: ["spirits", "chaos", "dance", "winds", "whisper", "wild", "echo"],
    seeds: {
      start: ["The spirits are humming... do you hear them?"],
      power: ["A spark of chaos!"],
      victory: ["The cards dance to my tune today!"],
      defeat: ["The winds have changed. I must follow them."],
      thinking: ["Shhh... the dragons are whispering."]
    }
  }
};

export const NPC_ARCHETYPE_MAP: Record<string, string> = {
  // Sage
  'female_cleric_goliath_obaya': 'sage',
  'female_cleric_human': 'sage',
  'female_wizard_highelf_laeral': 'sage',

  // Warrior
  'female_fighter_mountain_dwarf': 'warrior',
  'male_captain_moon_elf': 'warrior',
  'male_fighter_human': 'warrior',
  'male_fighter_mountain_dwarf': 'warrior',
  'male_fighter_tabaxi': 'warrior',
  'male_paladin_high_elf': 'warrior',

  // Noble
  'female_lord_moon_elf': 'noble',
  'female_queen_drow': 'noble',
  'male_king_yuan-ti': 'noble',
  'male_lord_moon_elf': 'noble',

  // Scoundrel
  'female_commoner_drow': 'scoundrel',
  'female_rogue_mountain_dwarf': 'scoundrel',
  'male_commoner_drow': 'scoundrel',

  // Worker
  'female_blacksmith_high_elf': 'worker',
  'female_commoner_mountain_dwarf': 'worker',
  'male_blacksmith_dragonborn': 'worker',
  'male_blacksmith_dwarf_thrak': 'worker',
  'male_blacksmith_mountain_dwarf': 'worker',
  'male_merchant_human': 'worker',

  // Host
  'male_bard_mountain_dwarf': 'host',
  'male_innkeeper_half-orc': 'host',
  'male_innkeeper_human_durnan': 'host',
  'male_merchant_human_mirt': 'host',

  // Stalker
  'female_blacksmith_owlin': 'stalker',
  'female_mercenary_tortle': 'stalker',
  'female_ranger_high_elf': 'stalker',

  // Adept
  'female_alchemist_lightfoot_halfling': 'adept',
  'female_artificer_dragonborn': 'adept',
  'female_mage_human': 'adept',
  'male_mage_mountain_dwarf': 'adept',

  // Wild
  'female_commoner_firbolg': 'wild',
  'female_mage_tiefling': 'wild',
  'female_sorcerer_human': 'wild',
  'male_captain_water_genasi': 'wild'
};

export const PERSONA_REGISTRY: Record<string, NPCSeedData> = {
  // We can still define custom overrides here if needed
  'male_commoner_drow': {
    ...ARCHETYPES.scoundrel,
    seeds: {
      ...ARCHETYPES.scoundrel.seeds,
      start: ["A simple game for a simple merchant, yes?"],
      victory: ["Oh, how fortunate! I must have the favor of the gods."]
    }
  },
  'male_innkeeper_human_durnan': {
    ...ARCHETYPES.host,
    seeds: {
      ...ARCHETYPES.host.seeds,
      start: ["I've seen kings and beggars lose it all at this table. Ready?"],
      defeat: ["Not the first time I've been cleaned out. Won't be the last."]
    }
  }
};

// Helper to get persona for an NPC
export const getNPCPersona = (npcId: string): NPCSeedData => {
  if (PERSONA_REGISTRY[npcId]) return PERSONA_REGISTRY[npcId];
  const archKey = NPC_ARCHETYPE_MAP[npcId] || 'host';
  return ARCHETYPES[archKey];
};
