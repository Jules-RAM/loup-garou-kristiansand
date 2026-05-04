import { NextRequest, NextResponse } from "next/server";
import { createNewGame } from "@/game-engine/manager";

export async function POST(req: NextRequest) {
  const { playerId, pseudo } = await req.json();

  if (!playerId || !pseudo) {
    return NextResponse.json({ error: "Missing playerId or pseudo" }, { status: 400 });
  }

  const game = createNewGame(playerId, pseudo);
  return NextResponse.json({ code: game.code, gameId: game.id });
}
