import { NextRequest, NextResponse } from "next/server";
import { getGameState } from "@/game-engine/manager";
import { getClientState } from "@/game-engine/engine";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const playerId = req.nextUrl.searchParams.get("playerId");

  if (!code || !playerId) {
    return NextResponse.json({ error: "Missing code or playerId" }, { status: 400 });
  }

  const game = await getGameState(code);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const clientState = getClientState(game, playerId);
  return NextResponse.json(clientState);
}
