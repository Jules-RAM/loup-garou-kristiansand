import { NextRequest, NextResponse } from "next/server";
import { joinGame } from "@/game-engine/manager";

export async function POST(req: NextRequest) {
  const { code, playerId, pseudo } = await req.json();

  if (!code || !playerId || !pseudo) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const game = await joinGame(code.toUpperCase(), playerId, pseudo);
  if (!game) {
    return NextResponse.json({ error: "Game not found or already started" }, { status: 404 });
  }

  return NextResponse.json({ gameId: game.id, code: game.code });
}
