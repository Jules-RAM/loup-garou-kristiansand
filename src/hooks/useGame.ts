"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ClientGameState, Vote } from "@/types/game";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseGameOptions {
  gameCode: string;
  playerId: string;
}

type GameEvent =
  | { type: "state_update"; state: ClientGameState }
  | { type: "chat_message"; message: { authorPseudo: string; content: string; channel: string; isSystem: boolean } }
  | { type: "error"; message: string };

export function useGame({ gameCode, playerId }: UseGameOptions) {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`game:${gameCode}`, {
      config: { presence: { key: playerId } },
    });

    channel
      .on("broadcast", { event: "game_state" }, ({ payload }) => {
        const state = payload as ClientGameState;
        if (state.myPlayerId === playerId) {
          setGameState(state);
        }
      })
      .on("broadcast", { event: "game_event" }, ({ payload }) => {
        // Handle specific events like chat messages
        const event = payload as GameEvent;
        if (event.type === "state_update") {
          setGameState(event.state);
        }
      })
      .on("presence", { event: "sync" }, () => {
        setConnected(true);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ playerId, online_at: new Date().toISOString() });
          setConnected(true);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [gameCode, playerId]);

  const sendAction = useCallback(
    async (action: string, data: Record<string, unknown> = {}) => {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameCode,
          playerId,
          action,
          ...data,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Action failed:", err);
        return false;
      }
      return true;
    },
    [gameCode, playerId]
  );

  const vote = useCallback(
    (targetId: string) => sendAction("vote", { targetId }),
    [sendAction]
  );

  const nightAction = useCallback(
    (targetId: string | null, extra?: Record<string, unknown>) =>
      sendAction("night_action", { targetId, ...extra }),
    [sendAction]
  );

  const sendChat = useCallback(
    (content: string, channel: string = "public") =>
      sendAction("chat", { content, channel }),
    [sendAction]
  );

  const startGame = useCallback(
    (composition: Record<string, number>) =>
      sendAction("start_game", { composition }),
    [sendAction]
  );

  return {
    gameState,
    connected,
    vote,
    nightAction,
    sendChat,
    startGame,
    sendAction,
  };
}
