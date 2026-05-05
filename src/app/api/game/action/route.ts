import { NextRequest, NextResponse } from "next/server";
import {
  startGame,
  handleNightAction,
  handleVote,
  handleChat,
  advanceFromDistribution,
  advanceToVote,
  resolveVotes,
} from "@/game-engine/manager";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gameCode, playerId, action } = body;

  if (!gameCode || !playerId || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  let result: { success: boolean; error?: string; reveal?: unknown };

  switch (action) {
    case "start_game":
      result = await startGame(gameCode, playerId, body.composition);
      break;

    case "ready":
      // Player acknowledged role distribution — advance phase
      await advanceFromDistribution(gameCode);
      result = { success: true };
      break;

    case "night_action":
      result = await handleNightAction(gameCode, playerId, body.targetId, body);
      break;

    case "vote":
      result = await handleVote(gameCode, playerId, body.targetId);
      break;

    case "advance_to_vote":
      result = await advanceToVote(gameCode);
      break;

    case "resolve_votes":
      result = await resolveVotes(gameCode);
      break;

    case "chat":
      result = await handleChat(gameCode, playerId, body.content, body.channel || "public");
      break;

    default:
      result = { success: false, error: "Unknown action" };
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
