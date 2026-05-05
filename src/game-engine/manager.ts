import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  GameState,
  GameComposition,
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
  getNextPhase,
} from "./engine";
import { validateComposition } from "./roles";

// Server-side Supabase client
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Wolf votes stored per game (ephemeral, only matters during a single night phase)
// Since serverless can lose this, wolves must all vote within one function invocation
// or we store in DB too
const nightVotes = new Map<string, Vote[]>();

// ============================================================
// DB helpers
// ============================================================

async function loadGame(code: string): Promise<GameState | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("games")
    .select("state")
    .eq("code", code)
    .single();
  if (error || !data) return null;
  return data.state as GameState;
}

async function saveGame(game: GameState): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("games")
    .upsert({
      code: game.code,
      state: game,
      updated_at: new Date().toISOString(),
    }, { onConflict: "code" });
}

// ============================================================
// Public API
// ============================================================

export async function createNewGame(hostId: string, hostPseudo: string): Promise<GameState> {
  const game = createGame(hostId, hostPseudo);
  await saveGame(game);
  return game;
}

export async function joinGame(code: string, playerId: string, pseudo: string): Promise<GameState | null> {
  const game = await loadGame(code);
  if (!game) return null;
  if (game.status !== "lobby") return null;

  // If player already in game, just reconnect
  const existing = game.players.find((p) => p.id === playerId);
  if (existing) {
    existing.isConnected = true;
    await saveGame(game);
    return game;
  }

  const updated = addPlayer(game, playerId, pseudo);
  await saveGame(updated);
  return updated;
}

export async function leaveGame(code: string, playerId: string): Promise<void> {
  const game = await loadGame(code);
  if (!game) return;

  if (game.status === "lobby") {
    const updated = removePlayer(game, playerId);
    if (updated.players.length === 0) {
      const supabase = getSupabase();
      if (supabase) await supabase.from("games").delete().eq("code", code);
      return;
    }
    await saveGame(updated);
  } else {
    const player = game.players.find((p) => p.id === playerId);
    if (player) player.isConnected = false;
    await saveGame(game);
  }
}

export async function startGame(
  code: string,
  hostId: string,
  composition: GameComposition
): Promise<{ success: boolean; error?: string }> {
  const game = await loadGame(code);
  if (!game) return { success: false, error: "Game not found" };
  if (game.status !== "lobby") return { success: false, error: "Game already started" };

  const host = game.players.find((p) => p.id === hostId);
  if (!host?.isHost) return { success: false, error: "Only host can start" };

  const validation = validateComposition(composition, game.players.length);
  if (!validation.valid) return { success: false, error: validation.error };

  game.composition = composition;
  const distributed = distributeRoles(game);
  await saveGame(distributed);

  // Schedule auto-advance to first night phase
  // On serverless we can't use setTimeout reliably, so the client will poll
  // and we advance phase when the client signals readiness
  return { success: true };
}

export async function advanceFromDistribution(code: string): Promise<void> {
  const game = await loadGame(code);
  if (!game || game.phase !== "distribution") return;
  game.phase = getNextPhase(game);
  if (game.phase === "night_voyante" || game.phase === "night_loups" || game.phase === "night_cupidon") {
    game.nightNumber = Math.max(game.nightNumber, 1);
  }
  await saveGame(game);
}

export async function handleNightAction(
  code: string,
  playerId: string,
  targetId: string | null,
  extra?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; reveal?: { targetId: string; targetRole: string } }> {
  const game = await loadGame(code);
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
      // Auto-advance past lovers reveal to next night phase
      updated.phase = getNextPhase(updated); // -> night_lovers_reveal
      // Then advance again to actual night
      updated.phase = getNextPhase(updated); // -> night_voyante or night_loups
      if (updated.nightNumber === 0) updated.nightNumber = 1;
      await saveGame(updated);
      break;
    }

    case "night_voyante": {
      if (player.role !== "voyante") return { success: false, error: "Not voyante" };
      if (!targetId) return { success: false, error: "Need target" };
      const target = game.players.find((p) => p.id === targetId);
      if (!target) return { success: false, error: "Invalid target" };

      updated = processVoyanteAction(game, targetId);
      await saveGame(updated);
      return { success: true, reveal: { targetId, targetRole: target.role! } };
    }

    case "night_loups": {
      if (player.role !== "loup_garou") return { success: false, error: "Not a wolf" };
      if (!targetId) return { success: false, error: "Need target" };

      const target = game.players.find((p) => p.id === targetId);
      if (!target || !target.alive || target.role === "loup_garou") {
        return { success: false, error: "Invalid target" };
      }

      // For wolves, we need consensus. Store vote in DB state.
      const wolfVotes: Vote[] = game.votes || [];
      const existingIdx = wolfVotes.findIndex((v) => v.voterId === playerId);
      if (existingIdx >= 0) wolfVotes[existingIdx].targetId = targetId;
      else wolfVotes.push({ voterId: playerId, targetId });

      const wolves = game.players.filter((p) => p.role === "loup_garou" && p.alive);

      // Check if all wolves voted for the same target
      if (wolfVotes.length >= wolves.length) {
        const allSame = wolfVotes.every((v) => v.targetId === wolfVotes[0].targetId);
        if (allSame) {
          updated = processLoupsVote(game, wolfVotes);
          updated.votes = []; // clear wolf votes
          await saveGame(updated);

          // If next phase is dawn (no sorciere), resolve dawn immediately
          if (updated.phase === "dawn") {
            await resolveDawnPhase(code);
          }
          break;
        }
      }

      // Not all agreed yet — save votes in game state
      game.votes = wolfVotes;
      await saveGame(game);
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
      await saveGame(updated);

      // If dawn, resolve
      if (updated.phase === "dawn") {
        await resolveDawnPhase(code);
      }
      break;
    }

    case "hunter_shot": {
      if (player.role !== "chasseur") return { success: false, error: "Not hunter" };
      if (!targetId) return { success: false, error: "Need target" };
      updated = processHunterShot(game, targetId);

      const winner = checkVictory(updated);
      if (winner !== null) {
        updated.winner = winner;
        updated.phase = "game_over";
        updated.status = "finished";
      } else {
        // Move to next appropriate phase
        const hasVoyante = updated.players.some((p) => p.role === "voyante" && p.alive);
        updated.phase = hasVoyante ? "night_voyante" : "night_loups";
      }
      await saveGame(updated);
      break;
    }

    default:
      return { success: false, error: "Not a night action phase" };
  }

  return { success: true };
}

async function resolveDawnPhase(code: string): Promise<void> {
  const game = await loadGame(code);
  if (!game) return;

  const { game: updated, deaths } = resolveDawn(game);

  // Check for hunter death
  const hunterDeath = deaths.find((d) => {
    const p = updated.players.find((pl) => pl.id === d.playerId);
    return p?.role === "chasseur";
  });

  if (hunterDeath) {
    updated.phase = "hunter_shot";
    await saveGame(updated);
    return;
  }

  // Check victory
  const winner = checkVictory(updated);
  if (winner !== null) {
    updated.winner = winner;
    updated.phase = "game_over";
    updated.status = "finished";
  } else {
    updated.phase = "day_debate";
  }
  await saveGame(updated);
}

export async function handleVote(
  code: string,
  playerId: string,
  targetId: string
): Promise<{ success: boolean; error?: string }> {
  const game = await loadGame(code);
  if (!game || game.phase !== "day_vote") return { success: false, error: "Not vote phase" };

  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.alive) return { success: false, error: "Cannot vote" };

  const existing = game.votes.findIndex((v) => v.voterId === playerId);
  if (existing >= 0) game.votes[existing].targetId = targetId;
  else game.votes.push({ voterId: playerId, targetId });

  await saveGame(game);
  return { success: true };
}

export async function resolveVotes(code: string): Promise<{ success: boolean; error?: string }> {
  const game = await loadGame(code);
  if (!game || game.phase !== "day_vote") return { success: false, error: "Not vote phase" };

  const { game: updated, eliminatedId } = processVotes(game);

  // Check hunter
  if (eliminatedId) {
    const eliminated = updated.players.find((p) => p.id === eliminatedId);
    if (eliminated?.role === "chasseur") {
      updated.phase = "hunter_shot";
      await saveGame(updated);
      return { success: true };
    }
  }

  // Check victory
  const winner = checkVictory(updated);
  if (winner !== null) {
    updated.winner = winner;
    updated.phase = "game_over";
    updated.status = "finished";
  } else {
    const hasVoyante = updated.players.some((p) => p.role === "voyante" && p.alive);
    updated.phase = hasVoyante ? "night_voyante" : "night_loups";
    updated.votes = [];
  }
  await saveGame(updated);
  return { success: true };
}

export async function advanceToVote(code: string): Promise<{ success: boolean; error?: string }> {
  const game = await loadGame(code);
  if (!game || game.phase !== "day_debate") return { success: false, error: "Not debate phase" };
  game.phase = "day_vote";
  game.votes = [];
  await saveGame(game);
  return { success: true };
}

export async function handleChat(
  code: string,
  playerId: string,
  content: string,
  channel: string
): Promise<{ success: boolean; error?: string }> {
  // Chat is not stored in game state for now — we use Supabase Broadcast directly
  const game = await loadGame(code);
  if (!game) return { success: false, error: "Game not found" };

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: "Not in game" };

  if (channel === "loups" && player.role !== "loup_garou") return { success: false, error: "Not a wolf" };
  if (channel === "dead" && player.alive) return { success: false, error: "Not dead" };
  if (channel === "public" && !player.alive) return { success: false, error: "Dead" };

  // Broadcast chat via Supabase Realtime Broadcast
  const supabase = getSupabase();
  if (supabase) {
    const ch = supabase.channel(`chat:${code}`);
    await ch.send({
      type: "broadcast",
      event: "chat",
      payload: { authorId: playerId, authorPseudo: player.pseudo, content, channel },
    });
  }

  return { success: true };
}

export async function getGameState(code: string): Promise<GameState | null> {
  return loadGame(code);
}
