"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { ClientGameState } from "@/types/game";
import { GrimoireButton } from "@/components/ui/GrimoireButton";

interface DayPhaseProps {
  gameState: ClientGameState;
  playerId: string;
  onVote: (targetId: string) => Promise<boolean>;
  onSendChat: (content: string, channel?: string) => Promise<boolean>;
}

export function DayPhase({ gameState, playerId, onVote, onSendChat }: DayPhaseProps) {
  const { t } = useI18n();
  const [chatInput, setChatInput] = useState("");
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(
    gameState.phase === "day_debate" ? gameState.debateDurationSec : gameState.voteDurationSec
  );

  const me = gameState.players.find((p) => p.id === playerId);
  const alivePlayers = gameState.players.filter((p) => p.alive && p.id !== playerId);
  const isAlive = me?.alive ?? false;
  const isDebate = gameState.phase === "day_debate";
  const isVote = gameState.phase === "day_vote";

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Reset when phase changes
  useEffect(() => {
    setTimeLeft(isDebate ? gameState.debateDurationSec : gameState.voteDurationSec);
    setHasVoted(false);
    setSelectedVote(null);
  }, [gameState.phase, gameState.debateDurationSec, gameState.voteDurationSec, isDebate]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await onSendChat(chatInput.trim());
    setChatInput("");
  };

  const handleVote = async (targetId: string) => {
    setSelectedVote(targetId);
    const ok = await onVote(targetId);
    if (ok) setHasVoted(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-lg mx-auto mt-4 px-4"
    >
      {/* Phase title + timer */}
      <div className="text-center mb-4">
        <h2 className="font-title text-lg">
          {isDebate ? t("phase.debate") : t("phase.vote")}
        </h2>
        <div className={`font-title text-2xl mt-1 ${timeLeft < 30 ? "text-burgundy" : "text-gold"}`}>
          {formatTime(timeLeft)}
        </div>
        <p className="text-ink-soft text-sm italic mt-1">
          {isDebate ? t("narration.debate_start") : t("narration.vote_start")}
        </p>
      </div>

      {/* Vote section */}
      {isVote && isAlive && (
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {alivePlayers.map((player) => {
              const votesForThis = gameState.votes.filter((v) => v.targetId === player.id).length;
              const isSelected = selectedVote === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => handleVote(player.id)}
                  disabled={hasVoted && selectedVote !== player.id}
                  className={`relative px-3 py-2 rounded border text-sm font-ui transition-all
                    ${isSelected
                      ? "border-burgundy bg-burgundy/10 text-burgundy"
                      : "border-gold/30 hover:border-gold/60"
                    }
                    ${hasVoted && !isSelected ? "opacity-50" : ""}
                  `}
                >
                  <span>{player.pseudo}</span>
                  {votesForThis > 0 && (
                    <span className="absolute top-0.5 right-1 text-[10px] text-burgundy font-semibold">
                      {votesForThis}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {hasVoted && (
            <p className="text-center text-xs text-ink-soft font-ui">
              Vote enregistre
            </p>
          )}
        </div>
      )}

      {/* Current votes display */}
      {isVote && gameState.votes.length > 0 && (
        <div className="mb-4 p-3 bg-parchment-dark/20 rounded border border-gold/10">
          <p className="text-xs font-ui text-ink-soft mb-1">Votes:</p>
          <div className="space-y-0.5">
            {gameState.votes.map((vote, i) => {
              const voter = gameState.players.find((p) => p.id === vote.voterId);
              const target = gameState.players.find((p) => p.id === vote.targetId);
              return (
                <p key={i} className="text-xs font-body">
                  <span className="text-ink-soft">{voter?.pseudo}</span>
                  {" → "}
                  <span className="text-burgundy font-semibold">{target?.pseudo}</span>
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat section (debate phase) */}
      {isDebate && isAlive && (
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder={t("chat.placeholder")}
              className="flex-1 px-3 py-2 rounded border border-gold/30 bg-parchment text-sm font-body
                focus:outline-none focus:border-gold transition-colors"
            />
            <GrimoireButton onClick={handleSendChat} variant="secondary" className="!px-3 !py-2">
              {t("chat.send")}
            </GrimoireButton>
          </div>
        </div>
      )}

      {/* Dead player notice */}
      {!isAlive && (
        <div className="text-center mt-8">
          <p className="text-ink-soft/50 italic font-body">
            {t("misc.dead")} - Mode observateur
          </p>
        </div>
      )}
    </motion.div>
  );
}
