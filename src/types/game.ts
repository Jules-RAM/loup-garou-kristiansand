// ============================================================
// Core game types for Loup-Garou de Kristiansand
// ============================================================

export type Role =
  | "villageois"
  | "loup_garou"
  | "voyante"
  | "sorciere"
  | "chasseur"
  | "cupidon";

export type Camp = "village" | "loups" | "solo";

export type Phase =
  | "lobby"
  | "distribution"
  | "night_cupidon"
  | "night_lovers_reveal"
  | "night_voyante"
  | "night_loups"
  | "night_sorciere"
  | "dawn"
  | "day_debate"
  | "day_vote"
  | "day_elimination"
  | "hunter_shot"
  | "game_over";

export type GameStatus = "lobby" | "in_progress" | "finished";

export type Winner = "village" | "loups" | "lovers" | null;

export type ChatChannel = "public" | "loups" | "dead" | "lovers" | "system";

export interface RoleConfig {
  id: Role;
  camp: Camp;
  maxPerGame: number | null; // null = unlimited (villageois)
  nightOrder: number | null; // null = no night action
  nameKeys: { fr: string; no: string; en: string };
  descriptionKeys: { fr: string; no: string; en: string };
}

export interface Player {
  id: string;
  gameId: string;
  pseudo: string;
  role: Role | null; // null before distribution
  alive: boolean;
  isHost: boolean;
  isLover: boolean;
  isConnected: boolean;
  // Sorciere state
  hasUsedHealPotion: boolean;
  hasUsedKillPotion: boolean;
  // Voyante knowledge (client-side only, for the voyante player)
  revealedRoles?: Record<string, Role>;
}

export interface GameComposition {
  [role: string]: number; // e.g. { villageois: 3, loup_garou: 2, voyante: 1 }
}

export interface NightAction {
  playerId: string;
  role: Role;
  action: string; // "see", "kill", "heal", "poison", "couple", "shoot"
  targetId: string | null;
  nightNumber: number;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export interface ChatMessage {
  id: string;
  gameId: string;
  channel: ChatChannel;
  authorId: string;
  authorPseudo: string;
  content: string;
  timestamp: number;
  isSystem: boolean;
}

export interface GameState {
  id: string;
  code: string;
  status: GameStatus;
  phase: Phase;
  nightNumber: number;
  players: Player[];
  composition: GameComposition;
  // Night state (server-managed, partially revealed to clients)
  nightKillTargetId: string | null; // who the wolves chose
  sorciereSaveUsed: boolean;
  sorciereKillUsed: boolean;
  protectedPlayerId: string | null; // salvateur (future)
  loversIds: [string, string] | null;
  // Day state
  votes: Vote[];
  // Result
  winner: Winner;
  // Settings
  debateDurationSec: number;
  voteDurationSec: number;
  createdAt: number;
}

// What the server sends to each client (filtered view)
export interface ClientGameState {
  id: string;
  code: string;
  status: GameStatus;
  phase: Phase;
  nightNumber: number;
  players: ClientPlayer[];
  composition: GameComposition;
  myPlayerId: string;
  myRole: Role | null;
  // Phase-specific data (only what this player should see)
  phaseData: PhaseData | null;
  votes: Vote[]; // only during day_vote
  winner: Winner;
  debateDurationSec: number;
  voteDurationSec: number;
}

export interface ClientPlayer {
  id: string;
  pseudo: string;
  alive: boolean;
  isHost: boolean;
  isConnected: boolean;
  // Only revealed after death or game over
  role: Role | null;
  isLover: boolean;
}

export type PhaseData =
  | { type: "voyante_reveal"; targetId: string; targetRole: Role }
  | { type: "sorciere_info"; victimId: string | null; canHeal: boolean; canKill: boolean }
  | { type: "loups_vote"; currentVotes: Vote[] }
  | { type: "cupidon_pick"; selected: string[] }
  | { type: "lovers_reveal"; partnerId: string; partnerPseudo: string }
  | { type: "hunter_shot" }
  | { type: "dawn_deaths"; deaths: { playerId: string; pseudo: string; role: Role; cause: string }[] }
  | { type: "elimination"; playerId: string; pseudo: string; role: Role }
  | { type: "game_over"; winner: Winner; allPlayers: { id: string; pseudo: string; role: Role; alive: boolean }[] };
