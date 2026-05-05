import { NextRequest, NextResponse } from "next/server";
import { getGameState } from "@/game-engine/manager";
import { createClient } from "@supabase/supabase-js";
import { GameState } from "@/types/game";

export async function POST(req: NextRequest) {
  const { gameCode, playerId } = await req.json();

  if (!gameCode || !playerId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const game = await getGameState(gameCode);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Reset the game to lobby state, keeping all players
  const resetGame: GameState = {
    ...game,
    status: "lobby",
    phase: "lobby",
    nightNumber: 0,
    nightKillTargetId: null,
    sorciereSaveUsed: false,
    sorciereKillUsed: false,
    protectedPlayerId: null,
    loversIds: null,
    votes: [],
    winner: null,
    composition: {},
    players: game.players.map((p) => ({
      ...p,
      role: null,
      alive: true,
      isLover: false,
      isConnected: true,
      hasUsedHealPotion: false,
      hasUsedKillPotion: false,
    })),
  };

  // Save to DB
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const supabase = createClient(url, key);
  await supabase
    .from("games")
    .upsert({ code: gameCode, state: resetGame, updated_at: new Date().toISOString() }, { onConflict: "code" });

  return NextResponse.json({ success: true, code: gameCode });
}
