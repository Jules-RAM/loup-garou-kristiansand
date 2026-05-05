import { Role, Camp, RoleConfig } from "@/types/game";

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  villageois: {
    id: "villageois",
    camp: "village",
    maxPerGame: null,
    nightOrder: null,
    nameKeys: { fr: "Villageois", no: "Landsbyboer", en: "Villager" },
    descriptionKeys: {
      fr: "Aucun pouvoir. Votez intelligemment.",
      no: "Ingen kraft. Stem klokt.",
      en: "No power. Vote wisely.",
    },
  },
  loup_garou: {
    id: "loup_garou",
    camp: "loups",
    maxPerGame: null,
    nightOrder: 3,
    nameKeys: { fr: "Loup-Garou", no: "Varulv", en: "Werewolf" },
    descriptionKeys: {
      fr: "Chaque nuit, devorez un villageois.",
      no: "Hver natt, spis en landsbyboer.",
      en: "Each night, devour a villager.",
    },
  },
  voyante: {
    id: "voyante",
    camp: "village",
    maxPerGame: 1,
    nightOrder: 2,
    nameKeys: { fr: "Voyante", no: "Synske", en: "Seer" },
    descriptionKeys: {
      fr: "Chaque nuit, decouvrez l'identite d'un joueur.",
      no: "Hver natt, avslor identiteten til en spiller.",
      en: "Each night, discover a player's identity.",
    },
  },
  sorciere: {
    id: "sorciere",
    camp: "village",
    maxPerGame: 1,
    nightOrder: 4,
    nameKeys: { fr: "Sorciere", no: "Heks", en: "Witch" },
    descriptionKeys: {
      fr: "Une potion de vie, une potion de mort.",
      no: "En livsdrikk, en dodsdrikk.",
      en: "One life potion, one death potion.",
    },
  },
  chasseur: {
    id: "chasseur",
    camp: "village",
    maxPerGame: 1,
    nightOrder: null,
    nameKeys: { fr: "Chasseur", no: "Jeger", en: "Hunter" },
    descriptionKeys: {
      fr: "En mourant, emportez quelqu'un avec vous.",
      no: "Nar du dor, ta noen med deg.",
      en: "When you die, take someone with you.",
    },
  },
  cupidon: {
    id: "cupidon",
    camp: "village",
    maxPerGame: 1,
    nightOrder: 1,
    nameKeys: { fr: "Cupidon", no: "Cupido", en: "Cupid" },
    descriptionKeys: {
      fr: "Liez deux joueurs par l'amour eternel.",
      no: "Bind to spillere med evig kjarlighet.",
      en: "Bind two players with eternal love.",
    },
  },
};

export const ALL_ROLES = Object.keys(ROLE_CONFIGS) as Role[];

export function getRoleCamp(role: Role): Camp {
  return ROLE_CONFIGS[role].camp;
}

export function getDefaultComposition(playerCount: number) {
  const wolfCount = Math.max(1, Math.floor(playerCount / 4));
  const composition: Record<string, number> = {
    loup_garou: wolfCount,
    voyante: playerCount >= 4 ? 1 : 0,
    sorciere: playerCount >= 5 ? 1 : 0,
    chasseur: playerCount >= 6 ? 1 : 0,
    cupidon: playerCount >= 8 ? 1 : 0,
  };

  const specialCount = Object.values(composition).reduce((a, b) => a + b, 0);
  composition.villageois = Math.max(0, playerCount - specialCount);

  return composition;
}

export function validateComposition(
  composition: Record<string, number>,
  playerCount: number
): { valid: boolean; error?: string } {
  const total = Object.values(composition).reduce((a, b) => a + b, 0);
  if (total !== playerCount) {
    return { valid: false, error: `Total roles (${total}) != players (${playerCount})` };
  }

  const wolfCount = composition.loup_garou ?? 0;
  if (wolfCount < 1) {
    return { valid: false, error: "At least 1 werewolf required" };
  }

  const villageCount = total - wolfCount;
  if (villageCount < 1) {
    return { valid: false, error: "At least 1 villager required" };
  }

  for (const [role, count] of Object.entries(composition)) {
    const config = ROLE_CONFIGS[role as Role];
    if (config?.maxPerGame !== null && count > config.maxPerGame) {
      return { valid: false, error: `Max ${config.maxPerGame} ${role} allowed` };
    }
  }

  return { valid: true };
}
