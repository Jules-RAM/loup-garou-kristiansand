import { createClient } from "@supabase/supabase-js";
import {
  GameState,
  GameComposition,
  Phase,
  Vote,
  ChatMessage,
} from "@/types/game";
import {
  createGame,
  addPlayer,
  removePlayer,
  distributeRoles,
  processVoyanteAction,
  processLoupsVote,
  processSorciereAction,
  processCupidonAction,
  processHunterShot,
  resolveDawn,
  processVotes,
  checkVictory,
  getClientState,
  getNextPhase,
} from "./engine";
import { validateComposition } from "./roles";

// Server-side Supabase client (lazy init to avoid build errors without env vars)
function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// In-memory game store (for MVP — migrate to Redis/DB for production)
const games = new Map<string, GameState>();
const nightVotes = new Map<string, Vote[]>(); // gameCode -> wolf votes this night
const chatHistory = new Map<string, ChatMessage[]>();

// Timer references
const phaseTimers = new Map<string, NodeJS.Timeout>();

// ============================================================
// Public API
// ============================================================

export function getGame(code: string): GameState | undefined {
  return games.get(code);
}

export function createNewGame(hostId: string, hostPseudo: string): GameState {
  const game = createGame(hostId, hostPseudo);
  games.set(game.code, game);
  chatHistory.set(game.code, []);
  return game;
}

export function joinGame(code: string, playerId: string, pseudo: string): GameState | null {
  const game = games.get(code);
  if (!game) return null;
  if (game.status !== "lobby") return null;

  // If player already in game, just reconnect
  const existing = game.players.find((p) => p.id === playerId);
  if (existing) {
    existing.isConnected = true;
    broadcastState(game);
    return game;
  }

  const updated = addPlayer(game, playerId, pseudo);
  games.set(code, updated);
  broadcastState(updated);
  return updated;
}

export function leaveGame(code: string, playerId: string): void {
  const game = games.get(code);
  if (!game) return;

  if (game.status === "lobby") {
    const updated = removePlayer(game, playerId);
    games.set(code, updated);
    if (updated.players.length === 0) {
      games.delete(code);
      return;
    }
    broadcastState(updated);
  } else {
    // Mark as disconnected during game
    const player = game.players.find((p) => p.id === playerId);
    if (player) player.isConnected = false;
    broadcastState(game);
  }
}

export async function startGame(
  code: string,
  hostId: string,
  composition: GameComposition
): Promise<{ success: boolean; error?: string }> {
  const game = games.get(code);
  if (!game) return { success: false, error: "Game not found" };
  if (game.status !== "lobby") return { success: false, error: "Game already started" };

  const host = game.players.find((p) => p.id === hostId);
  if (!host?.isHost) return { success: false, error: "Only host can start" };

  const validation = validateComposition(composition, game.players.length);
  if (!validation.valid) return { success: false, error: validation.error };

  game.composition = composition;
  const distributed = distributeRoles(game);
  games.set(code, distributed);

  broadcastState(distributed);

  // After distribution, auto-advance to first night phase after a delay
  schedulePhaseAdvance(code, 5000);

  return { success: true };
}

export async function handleNightAction(
  code: string,
  playerId: string,
  targetId: string | null,
  extra?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const game = games.get(code);
  if (!game) return { success: false, error: "Game not found" };

  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.alive) return { success: false, error: "Invalid player" };

  let updated: GameState;

  switch (game.phase) {
    case "night_cupidon": {
      if (player.role !== "cupidon") return { success: false, error: "Not cupidon" };
      const target2 = extra?.target2Id as string;
      if (!targetId || !target2) return { success: false, error: "Need 2 targets" };
      updated = processCupidonAction(game, targetId, target2);
      games.set(code, updated);
      broadcastState(updated);
      // Auto-advance from lovers reveal after delay
      if (updated.phase === "night_lovers_reveal") {
        schedulePhaseAdvance(code, 4000);
      }
      break;
    }

    case "night_voyante": {
      if (player.role !== "voyante") return { success: false, error: "Not voyante" };
      if (!targetId) return { success: false, error: "Need target" };
      // Send the reveal to the voyante specifically
      const target = game.players.find((p) => p.id === targetId);
      if (!target) return { success: false, error: "Invalid target" };

      updated = processVoyanteAction(game, targetId);
      games.set(code, updated);

      // Send reveal to voyante before broadcasting next phase
      await broadcastToPlayer(code, playerId, {
        type: "voyante_reveal",
        targetId,
        targetRole: target.role,
      });

      // Small delay then advance
      schedulePhaseAdvance(code, 3000);
      break;
    }

    case "night_loups": {
      if (player.role !== "loup_garou") return { success: false, error: "Not a wolf" };
      if (!targetId) return { success: false, error: "Need target" };

      const target = game.players.find((p) => p.id === targetId);
      if (!target || !target.alive || target.role === "loup_garou") {
        return { success: false, error: "Invalid target" };
      }

      // Collect wolf votes
      const key = code;
      const votes = nightVotes.get(key) || [];
      const existingVote = votes.findIndex((v) => v.voterId === playerId);
      if (existingVote >= 0) votes[existingVote].targetId = targetId;
      else votes.push({ voterId: playerId, targetId });
      nightVotes.set(key, votes);

      // Broadcast wolf votes to all wolves
      const wolves = game.players.filter((p) => p.role === "loup_garou" && p.alive);
      for (const wolf of wolves) {
        await broadcastToPlayer(code, wolf.id, {
          type: "loups_vote",
          currentVotes: votes,
        });
      }

      // Check if all wolves voted
      if (votes.length >= wolves.length) {
        // Check if unanimous
        const allSameTarget = votes.every((v) => v.targetId === votes[0].targetId);
        if (allSameTarget) {
          updated = processLoupsVote(game, votes);
          nightVotes.delete(key);
          games.set(code, updated);
          broadcastState(updated);
        }
        // If not unanimous, they need to keep voting
      }
      break;
    }

    case "night_sorciere": {
      if (player.role !== "sorciere") return { success: false, error: "Not sorciere" };
      const action = (extra?.sorciereAction as string) || "skip";
      updated = processSorciereAction(
        game,
        action as "heal" | "kill" | "skip",
        targetId ?? undefined
      );
      games.set(code, updated);

      // Dawn resolution
      if (updated.phase === "dawn") {
        handleDawn(code);
      }
      break;
    }

    case "hunter_shot": {
      if (player.role !== "chasseur") return { success: false, error: "Not hunter" };
      if (!targetId) return { success: false, error: "Need target" };
      updated = processHunterShot(game, targetId);
      games.set(code, updated);
      broadcastState(updated);

      if (updated.phase === "game_over") {
        updated.winner = checkVictory(updated);
        updated.status = "finished";
        games.set(code, updated);
        broadcastState(updated);
      }
      break;
    }

    default:
      return { success: false, error: "Not a night action phase" };
  }

  return { success: true };
}

export async function handleVote(
  code: string,
  playerId: string,
  targetId: string
): Promise<{ success: boolean; error?: string }> {
  const game = games.get(code);
  if (!game || game.phase !== "day_vote") return { success: false, error: "Not vote phase" };

  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.alive) return { success: false, error: "Cannot vote" };

  // Update or add vote
  const existing = game.votes.findIndex((v) => v.voterId === playerId);
  if (existing >= 0) game.votes[existing].targetId = targetId;
  else game.votes.push({ voterId: playerId, targetId });

  broadcastState(game);
  return { success: true };
}

export async function handleChat(
  code: string,
  playerId: string,
  content: string,
  channel: string
): Promise<{ success: boolean; error?: string }> {
  const game = games.get(code);
  if (!game) return { success: false, error: "Game not found" };

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: "Not in game" };

  // Validate channel access
  if (channel === "loups" && player.role !== "loup_garou") {
    return { success: false, error: "Not a wolf" };
  }
  if (channel === "dead" && player.alive) {
    return { success: false, error: "Not dead yet" };
  }
  if (channel === "lovers" && !player.isLover) {
    return { success: false, error: "Not a lover" };
  }
  if (channel === "public" && !player.alive) {
    return { success: false, error: "Dead players cannot chat publicly" };
  }

  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    gameId: game.id,
    channel: channel as ChatMessage["channel"],
    authorId: playerId,
    authorPseudo: player.pseudo,
    content,
    timestamp: Date.now(),
    isSystem: false,
  };

  const history = chatHistory.get(code) || [];
  history.push(msg);
  chatHistory.set(code, history);

  // Broadcast to appropriate players
  await broadcastChat(code, msg);

  return { success: true };
}

// ============================================================
// Internal helpers
// ============================================================

function handleDawn(code: string) {
  const game = games.get(code);
  if (!game) return;

  const { game: updated, deaths } = resolveDawn(game);
  games.set(code, updated);

  // Check for hunter death
  const hunterDeath = deaths.find((d) => {
    const p = updated.players.find((pl) => pl.id === d.playerId);
    return p?.role === "chasseur";
  });

  if (hunterDeath) {
    updated.phase = "hunter_shot";
    games.set(code, updated);
    broadcastState(updated);
    // Give hunter 30 seconds
    schedulePhaseAdvance(code, 30000);
    return;
  }

  // Check victory
  const winner = checkVictory(updated);
  if (winner !== null) {
    updated.winner = winner;
    updated.phase = "game_over";
    updated.status = "finished";
    games.set(code, updated);
    broadcastState(updated);
    return;
  }

  broadcastState(updated);
  // Move to debate after showing deaths
  schedulePhaseAdvance(code, 5000);
}

function schedulePhaseAdvance(code: string, delayMs: number) {
  // Clear existing timer
  const existing = phaseTimers.get(code);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    const game = games.get(code);
    if (!game || game.status === "finished") return;

    const nextPhase = getNextPhase(game);
    game.phase = nextPhase;
    games.set(code, game);

    if (nextPhase === "dawn") {
      handleDawn(code);
    } else if (nextPhase === "day_vote") {
      broadcastState(game);
      // Auto-resolve votes after voteDuration
      scheduleVoteResolution(code, game.voteDurationSec * 1000);
    } else if (nextPhase === "day_debate") {
      broadcastState(game);
      // Auto-advance to vote after debate duration
      schedulePhaseAdvance(code, game.debateDurationSec * 1000);
    } else {
      broadcastState(game);
    }

    phaseTimers.delete(code);
  }, delayMs);

  phaseTimers.set(code, timer);
}

function scheduleVoteResolution(code: string, delayMs: number) {
  const timer = setTimeout(() => {
    const game = games.get(code);
    if (!game || game.phase !== "day_vote") return;

    const { game: updated, eliminatedId } = processVotes(game);
    games.set(code, updated);

    // Check hunter
    if (eliminatedId) {
      const eliminated = updated.players.find((p) => p.id === eliminatedId);
      if (eliminated?.role === "chasseur") {
        updated.phase = "hunter_shot";
        games.set(code, updated);
        broadcastState(updated);
        schedulePhaseAdvance(code, 30000);
        return;
      }
    }

    // Check victory
    const winner = checkVictory(updated);
    if (winner !== null) {
      updated.winner = winner;
      updated.phase = "game_over";
      updated.status = "finished";
    } else {
      updated.phase = "day_elimination";
      // Transition to night
      const hasVoyante = updated.players.some((p) => p.role === "voyante" && p.alive);
      updated.phase = hasVoyante ? "night_voyante" : "night_loups";
    }
    games.set(code, updated);
    broadcastState(updated);
  }, delayMs);

  phaseTimers.set(code, timer);
}

// ============================================================
// Broadcasting via Supabase Realtime
// ============================================================

async function broadcastState(game: GameState) {
  const supabase = getSupabaseServer();
  if (!supabase) return;
  const channel = supabase.channel(`game:${game.code}`);

  // Send personalized state to each player
  for (const player of game.players) {
    const clientState = getClientState(game, player.id);
    await channel.send({
      type: "broadcast",
      event: "game_state",
      payload: clientState,
    });
  }
}

async function broadcastToPlayer(
  code: string,
  playerId: string,
  data: Record<string, unknown>
) {
  const supabase = getSupabaseServer();
  if (!supabase) return;
  const channel = supabase.channel(`game:${code}`);
  await channel.send({
    type: "broadcast",
    event: "game_event",
    payload: {
      type: "state_update",
      targetPlayerId: playerId,
      ...data,
    },
  });
}

async function broadcastChat(code: string, msg: ChatMessage) {
  const game = games.get(code);
  if (!game) return;

  const supabase = getSupabaseServer();
  if (!supabase) return;
  const channel = supabase.channel(`game:${code}`);

  // Determine recipients based on channel
  let recipients = game.players;
  if (msg.channel === "loups") {
    recipients = game.players.filter((p) => p.role === "loup_garou");
  } else if (msg.channel === "dead") {
    recipients = game.players.filter((p) => !p.alive);
  } else if (msg.channel === "lovers" && game.loversIds) {
    recipients = game.players.filter((p) => game.loversIds!.includes(p.id));
  }

  await channel.send({
    type: "broadcast",
    event: "chat_message",
    payload: {
      authorPseudo: msg.authorPseudo,
      content: msg.content,
      channel: msg.channel,
      isSystem: msg.isSystem,
      recipientIds: recipients.map((p) => p.id),
    },
  });
}
