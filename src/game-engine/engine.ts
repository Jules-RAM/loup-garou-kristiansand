import {
  GameState,
  Phase,
  Player,
  Role,
  Vote,
  NightAction,
  Winner,
  ClientGameState,
  ClientPlayer,
  PhaseData,
  GameComposition,
} from "@/types/game";
import { getRoleCamp } from "./roles";

// ============================================================
// Game state factory
// ============================================================

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createGame(hostId: string, hostPseudo: string): GameState {
  return {
    id: crypto.randomUUID(),
    code: generateCode(),
    status: "lobby",
    phase: "lobby",
    nightNumber: 0,
    players: [
      createPlayer(hostId, hostPseudo, true),
    ],
    composition: {},
    nightKillTargetId: null,
    sorciereSaveUsed: false,
    sorciereKillUsed: false,
    protectedPlayerId: null,
    loversIds: null,
    votes: [],
    winner: null,
    debateDurationSec: 180,
    voteDurationSec: 60,
    createdAt: Date.now(),
  };
}

function createPlayer(id: string, pseudo: string, isHost: boolean): Player {
  return {
    id,
    gameId: "",
    pseudo,
    role: null,
    alive: true,
    isHost,
    isLover: false,
    isConnected: true,
    hasUsedHealPotion: false,
    hasUsedKillPotion: false,
  };
}

// ============================================================
// Player management
// ============================================================

export function addPlayer(game: GameState, playerId: string, pseudo: string): GameState {
  if (game.status !== "lobby") return game;
  if (game.players.find((p) => p.id === playerId)) return game;

  return {
    ...game,
    players: [...game.players, createPlayer(playerId, pseudo, false)],
  };
}

export function removePlayer(game: GameState, playerId: string): GameState {
  const newPlayers = game.players.filter((p) => p.id !== playerId);
  // Transfer host if needed
  if (newPlayers.length > 0 && !newPlayers.some((p) => p.isHost)) {
    newPlayers[0].isHost = true;
  }
  return { ...game, players: newPlayers };
}

// ============================================================
// Role distribution
// ============================================================

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function distributeRoles(game: GameState): GameState {
  const roles: Role[] = [];
  for (const [role, count] of Object.entries(game.composition)) {
    for (let i = 0; i < count; i++) {
      roles.push(role as Role);
    }
  }

  const shuffled = shuffle(roles);
  const players = game.players.map((p, i) => ({
    ...p,
    role: shuffled[i],
  }));

  const hasCupidon = players.some((p) => p.role === "cupidon");

  return {
    ...game,
    status: "in_progress",
    phase: "distribution",
    players,
    nightNumber: hasCupidon ? 0 : 1,
  };
}

// ============================================================
// Phase transitions
// ============================================================

export function getNextPhase(game: GameState): Phase {
  const { phase, nightNumber } = game;
  const alivePlayers = game.players.filter((p) => p.alive);
  const hasCupidon = alivePlayers.some((p) => p.role === "cupidon");
  const hasVoyante = alivePlayers.some((p) => p.role === "voyante");
  const hasSorciere = alivePlayers.some((p) => p.role === "sorciere");

  switch (phase) {
    case "distribution":
      // First night: cupidon goes first if present
      if (hasCupidon && nightNumber === 0) return "night_cupidon";
      return hasVoyante ? "night_voyante" : "night_loups";

    case "night_cupidon":
      return "night_lovers_reveal";

    case "night_lovers_reveal":
      // Continue to normal night
      return hasVoyante ? "night_voyante" : "night_loups";

    case "night_voyante":
      return "night_loups";

    case "night_loups":
      if (hasSorciere && canSorciereAct(game)) return "night_sorciere";
      return "dawn";

    case "night_sorciere":
      return "dawn";

    case "dawn":
      return "day_debate";

    case "day_debate":
      return "day_vote";

    case "day_vote":
      return "day_elimination";

    case "day_elimination": {
      const winner = checkVictory(game);
      if (winner !== null) return "game_over";
      return hasVoyante && alivePlayers.some((p) => p.role === "voyante")
        ? "night_voyante"
        : "night_loups";
    }

    case "hunter_shot": {
      const winner = checkVictory(game);
      if (winner !== null) return "game_over";
      // Return to wherever we were headed
      if (game.nightNumber > 0 && phase === "hunter_shot") {
        // If hunter died during the day, continue to night
        return hasVoyante && alivePlayers.some((p) => p.role === "voyante")
          ? "night_voyante"
          : "night_loups";
      }
      return "dawn";
    }

    default:
      return "game_over";
  }
}

function canSorciereAct(game: GameState): boolean {
  const sorciere = game.players.find((p) => p.role === "sorciere" && p.alive);
  if (!sorciere) return false;
  return !sorciere.hasUsedHealPotion || !sorciere.hasUsedKillPotion;
}

// ============================================================
// Night actions
// ============================================================

export function processVoyanteAction(game: GameState, targetId: string): GameState {
  // The voyante just sees — no state change needed server-side
  // The reveal is sent to the client via phaseData
  return advancePhase(game);
}

export function processLoupsVote(game: GameState, votes: Vote[]): GameState {
  // Find majority target
  const counts: Record<string, number> = {};
  for (const v of votes) {
    counts[v.targetId] = (counts[v.targetId] || 0) + 1;
  }
  const maxVotes = Math.max(...Object.values(counts));
  const targets = Object.entries(counts).filter(([, c]) => c === maxVotes);

  // If tie, pick random among tied
  const targetId = targets[Math.floor(Math.random() * targets.length)][0];

  return {
    ...advancePhase(game),
    nightKillTargetId: targetId,
  };
}

export function processSorciereAction(
  game: GameState,
  action: "heal" | "kill" | "skip",
  targetId?: string
): GameState {
  let updated = { ...game };

  if (action === "heal") {
    updated.nightKillTargetId = null; // save the victim
    updated.players = updated.players.map((p) =>
      p.role === "sorciere" ? { ...p, hasUsedHealPotion: true } : p
    );
  } else if (action === "kill" && targetId) {
    // The sorciere's kill will be applied at dawn alongside wolf kill
    updated.players = updated.players.map((p) => {
      if (p.role === "sorciere") return { ...p, hasUsedKillPotion: true };
      return p;
    });
    // Store sorciere kill target — we'll use a simple approach:
    // apply kill immediately but reveal at dawn
    updated = killPlayer(updated, targetId);
  }

  return advancePhase(updated);
}

export function processCupidonAction(game: GameState, target1: string, target2: string): GameState {
  const updated = {
    ...game,
    loversIds: [target1, target2] as [string, string],
    players: game.players.map((p) =>
      p.id === target1 || p.id === target2 ? { ...p, isLover: true } : p
    ),
  };
  return advancePhase(updated);
}

export function processHunterShot(game: GameState, targetId: string): GameState {
  let updated = killPlayer(game, targetId);
  // Check if target is a lover
  updated = processLoverDeath(updated, targetId);
  // Check if killed player is also a hunter (shouldn't happen but be safe)
  return advancePhase(updated);
}

// ============================================================
// Dawn resolution
// ============================================================

export function resolveDawn(game: GameState): { game: GameState; deaths: { playerId: string; cause: string }[] } {
  const deaths: { playerId: string; cause: string }[] = [];
  let updated = { ...game, nightNumber: game.nightNumber + 1 };

  // Apply wolf kill
  if (updated.nightKillTargetId) {
    const target = updated.players.find((p) => p.id === updated.nightKillTargetId);
    if (target && target.alive) {
      updated = killPlayer(updated, target.id);
      deaths.push({ playerId: target.id, cause: "wolves" });

      // Check lover death
      const loverDeath = getLoverOf(updated, target.id);
      if (loverDeath && updated.players.find((p) => p.id === loverDeath)?.alive) {
        updated = killPlayer(updated, loverDeath);
        deaths.push({ playerId: loverDeath, cause: "love" });
      }
    }
  }

  // Reset night state
  updated.nightKillTargetId = null;

  return { game: updated, deaths };
}

// ============================================================
// Day voting
// ============================================================

export function processVotes(game: GameState): {
  game: GameState;
  eliminatedId: string | null;
} {
  const counts: Record<string, number> = {};
  for (const v of game.votes) {
    counts[v.targetId] = (counts[v.targetId] || 0) + 1;
  }

  if (Object.keys(counts).length === 0) {
    return { game: { ...game, votes: [] }, eliminatedId: null };
  }

  const maxVotes = Math.max(...Object.values(counts));
  const topTargets = Object.entries(counts).filter(([, c]) => c === maxVotes);

  // Tie = no elimination
  if (topTargets.length > 1) {
    return { game: { ...game, votes: [] }, eliminatedId: null };
  }

  const eliminatedId = topTargets[0][0];
  let updated = killPlayer(game, eliminatedId);

  // Check lover death
  const loverDeath = getLoverOf(updated, eliminatedId);
  if (loverDeath && updated.players.find((p) => p.id === loverDeath)?.alive) {
    updated = killPlayer(updated, loverDeath);
  }

  updated.votes = [];
  return { game: updated, eliminatedId };
}

// ============================================================
// Kill & victory
// ============================================================

function killPlayer(game: GameState, playerId: string): GameState {
  return {
    ...game,
    players: game.players.map((p) =>
      p.id === playerId ? { ...p, alive: false } : p
    ),
  };
}

function getLoverOf(game: GameState, playerId: string): string | null {
  if (!game.loversIds) return null;
  if (game.loversIds[0] === playerId) return game.loversIds[1];
  if (game.loversIds[1] === playerId) return game.loversIds[0];
  return null;
}

function processLoverDeath(game: GameState, deadPlayerId: string): GameState {
  const loverId = getLoverOf(game, deadPlayerId);
  if (loverId) {
    const lover = game.players.find((p) => p.id === loverId);
    if (lover?.alive) {
      return killPlayer(game, loverId);
    }
  }
  return game;
}

export function checkVictory(game: GameState): Winner {
  const alive = game.players.filter((p) => p.alive);
  const wolves = alive.filter((p) => p.role === "loup_garou");
  const villagers = alive.filter((p) => p.role !== "loup_garou");

  // Lovers win: if only 2 alive and they are both lovers
  if (alive.length === 2 && game.loversIds) {
    const ids = new Set(alive.map((p) => p.id));
    if (ids.has(game.loversIds[0]) && ids.has(game.loversIds[1])) {
      // Only if they are from different camps
      const roles = alive.map((p) => getRoleCamp(p.role!));
      if (roles.includes("village") && roles.includes("loups")) {
        return "lovers";
      }
    }
  }

  if (wolves.length === 0) return "village";
  if (wolves.length >= villagers.length) return "loups";

  return null;
}

// ============================================================
// Phase advance helper
// ============================================================

function advancePhase(game: GameState): GameState {
  return { ...game, phase: getNextPhase(game) };
}

// ============================================================
// Client state filtering (anti-cheat)
// ============================================================

export function getClientState(game: GameState, playerId: string): ClientGameState {
  const me = game.players.find((p) => p.id === playerId);
  const isGameOver = game.phase === "game_over";

  const clientPlayers: ClientPlayer[] = game.players.map((p) => ({
    id: p.id,
    pseudo: p.pseudo,
    alive: p.alive,
    isHost: p.isHost,
    isConnected: p.isConnected,
    // Only show role if: it's yourself, the player is dead, or game is over
    role: p.id === playerId || !p.alive || isGameOver ? p.role : null,
    // Only show lover status to lovers or after death/game over
    isLover: (me?.isLover && p.isLover) || !p.alive || isGameOver ? p.isLover : false,
  }));

  return {
    id: game.id,
    code: game.code,
    status: game.status,
    phase: game.phase,
    nightNumber: game.nightNumber,
    players: clientPlayers,
    composition: game.composition,
    myPlayerId: playerId,
    myRole: me?.role ?? null,
    phaseData: getPhaseData(game, playerId),
    votes: game.phase === "day_vote" ? game.votes : [],
    winner: game.winner,
    debateDurationSec: game.debateDurationSec,
    voteDurationSec: game.voteDurationSec,
  };
}

function getPhaseData(game: GameState, playerId: string): PhaseData | null {
  const me = game.players.find((p) => p.id === playerId);
  if (!me) return null;

  switch (game.phase) {
    case "night_loups":
      if (me.role === "loup_garou" && me.alive) {
        return { type: "loups_vote", currentVotes: [] };
      }
      return null;

    case "night_sorciere":
      if (me.role === "sorciere" && me.alive) {
        return {
          type: "sorciere_info",
          victimId: game.nightKillTargetId,
          canHeal: !me.hasUsedHealPotion,
          canKill: !me.hasUsedKillPotion,
        };
      }
      return null;

    case "night_cupidon":
      if (me.role === "cupidon" && me.alive) {
        return { type: "cupidon_pick", selected: [] };
      }
      return null;

    case "night_lovers_reveal":
      if (me.isLover && game.loversIds) {
        const partnerId = game.loversIds[0] === me.id ? game.loversIds[1] : game.loversIds[0];
        const partner = game.players.find((p) => p.id === partnerId);
        return {
          type: "lovers_reveal",
          partnerId,
          partnerPseudo: partner?.pseudo ?? "???",
        };
      }
      return null;

    case "hunter_shot":
      if (me.role === "chasseur" && !me.alive) {
        return { type: "hunter_shot" };
      }
      return null;

    default:
      return null;
  }
}
