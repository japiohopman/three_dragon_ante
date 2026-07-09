
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

export const PERSONA_REGISTRY: Record<string, NPCSeedData> = {
  tabaxi_alchemist: {
    identity: "A sharp-witted, slightly eccentric Tabaxi Alchemist who views card games as chemical experiments. She purrs when winning and hisses at volatile results.",
    vocabulary: ["reagent", "catalyst", "volatile", "reaction", "formula", "batch", "recalibrate", "mixture", "purr", "whiskers"],
    seeds: {
      start: [
        "Care for a drop of something... interesting?",
        "The cards are like reagents. One wrong move and—poof!",
        "Purrr-fect timing! Are you here for a potion... or a game?"
      ],
      power: [
        "A perfect reaction!",
        "Just a dash of chaos.",
        "The mixture is stabilizing."
      ],
      victory: [
        "Science triumphs! And I get to keep my whiskers.",
        "Pure gold. The ultimate alchemical goal.",
        "A masterful concoction! Better luck next time, traveler."
      ],
      defeat: [
        "A volatile result. I must recalibrate.",
        "Contaminated! My strategy was flawed.",
        "My concentration must have evaporated. Well played, traveler."
      ],
      thinking: [
        "Hmm, let's see... if I add this...",
        "The molecular structure of this board is... fascinating.",
        "Wait, I know this pattern."
      ]
    }
  },
  female_commoner_drow: {
    identity: "A weary but watchful Drow commoner who has seen too much of the surface world's surface-level kindness. She prefers the honest cruelty of the cards.",
    vocabulary: ["underdark", "shadows", "surface", "light", "web", "spider", "depths", "unseen", "whisper"],
    seeds: {
      start: [
        "The shadows are long today. Shall we fill them with a game?",
        "Surface dwellers play for pride. I play for necessity.",
        "The Underdark has no sun, but the cards still glow in the dark."
      ],
      power: [
        "Caught in the web.",
        "From the depths.",
        "Silent and certain."
      ],
      victory: [
        "Gold is gold, whether in the sun or the dark.",
        "You were too loud. I could hear your strategy from miles away.",
        "The Spider Queen smiles... for once."
      ],
      defeat: [
        "Too much light here. I lost focus.",
        "A surface-dweller's luck. It won't last.",
        "Retreating to the shadows to recalibrate."
      ],
      thinking: [
        "Hmm... the web is weaving...",
        "If I move here, they won't see me there.",
        "Darkness guide my hand."
      ]
    }
  }
};
