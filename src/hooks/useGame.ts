"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ClientGameState } from "@/types/game";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseGameOptions {
  gameCode: string;
  playerId: string;
}

export function useGame({ gameCode, playerId }: UseGameOptions) {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch state from API
  const fetchState = useCallback(async () => {
    if (!gameCode || !playerId) return;
    try {
      const res = await fetch(`/api/game/state?code=${gameCode}&playerId=${playerId}`);
      if (res.ok) {
        const state = await res.json();
        setGameState(state);
        setConnected(true);
      }
    } catch {
      // Network error, will retry on next poll
    }
  }, [gameCode, playerId]);

  useEffect(() => {
    if (!gameCode || !playerId) return;

    // Initial fetch
    fetchState();

    // Subscribe to Supabase Realtime (DB changes on games table)
    const channel = supabase.channel(`db-game-${gameCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `code=eq.${gameCode}`,
        },
        () => {
          // When the game row changes, fetch fresh state
          fetchState();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
        }
      });

    channelRef.current = channel;

    // Polling fallback every 2 seconds (in case Realtime misses something)
    pollRef.current = setInterval(fetchState, 2000);

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [gameCode, playerId, fetchState]);

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
        return { success: false, ...err };
      }
      const result = await res.json();
      // Refetch state after action
      fetchState();
      return result;
    },
    [gameCode, playerId, fetchState]
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
