"use client";

import { use, useEffect, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { LobbyView } from "@/components/lobby/LobbyView";
import { GameView } from "@/components/game/GameView";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("lgk-player-id") || "";
}

function getPseudo(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("lgk-pseudo") || "Anonyme";
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [playerId, setPlayerId] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    setPlayerId(getPlayerId());
    setPseudo(getPseudo());
  }, []);

  const { gameState, connected, vote, nightAction, sendChat, startGame, sendAction } = useGame({
    gameCode: code,
    playerId,
  });

  // Auto-join on mount
  useEffect(() => {
    if (!playerId || !pseudo || joined) return;
    fetch("/api/game/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, playerId, pseudo }),
    }).then(() => setJoined(true));
  }, [playerId, pseudo, code, joined]);

  if (!playerId) {
    return (
      <div className="min-h-screen parchment-bg flex items-center justify-center">
        <p className="font-title text-ink-soft">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Connection indicator */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-forest" : "bg-burgundy"}`} />
        <span className="text-xs font-ui text-ink-soft">
          {connected ? "Connecte" : "Connexion..."}
        </span>
      </div>

      {/* Game content */}
      {!gameState || gameState.status === "lobby" ? (
        <LobbyView
          gameCode={code}
          playerId={playerId}
          gameState={gameState}
          onStartGame={startGame}
        />
      ) : (
        <GameView
          gameState={gameState}
          playerId={playerId}
          onVote={vote}
          onNightAction={nightAction}
          onSendChat={sendChat}
          onSendAction={sendAction}
        />
      )}
    </div>
  );
}
