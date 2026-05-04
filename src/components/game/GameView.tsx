"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { ClientGameState, Phase, Role } from "@/types/game";
import { TranslationKey } from "@/i18n/translations";
import { RoleCard } from "@/components/cards/RoleCard";
import { GrimoireButton } from "@/components/ui/GrimoireButton";
import { NightPhase } from "./NightPhase";
import { DayPhase } from "./DayPhase";
import { GameOverView } from "./GameOverView";

interface GameViewProps {
  gameState: ClientGameState;
  playerId: string;
  onVote: (targetId: string) => Promise<boolean>;
  onNightAction: (targetId: string | null, extra?: Record<string, unknown>) => Promise<boolean>;
  onSendChat: (content: string, channel?: string) => Promise<boolean>;
  onSendAction: (action: string, data?: Record<string, unknown>) => Promise<boolean>;
}

const NIGHT_PHASES: Phase[] = [
  "night_cupidon",
  "night_lovers_reveal",
  "night_voyante",
  "night_loups",
  "night_sorciere",
];

export function GameView({
  gameState,
  playerId,
  onVote,
  onNightAction,
  onSendChat,
  onSendAction,
}: GameViewProps) {
  const { t } = useI18n();
  const [showMyCard, setShowMyCard] = useState(false);

  const isNight = NIGHT_PHASES.includes(gameState.phase) || gameState.phase === "dawn";
  const isDay = gameState.phase === "day_debate" || gameState.phase === "day_vote";
  const isGameOver = gameState.phase === "game_over";
  const isDistribution = gameState.phase === "distribution";

  const me = gameState.players.find((p) => p.id === playerId);
  const aliveCount = gameState.players.filter((p) => p.alive).length;

  if (isGameOver) {
    return <GameOverView gameState={gameState} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-[3000ms] ${isNight ? "night-bg" : "parchment-bg"}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/20">
        <div className="font-title text-sm">
          {isNight ? t("phase.night") : t("phase.day")} {gameState.nightNumber}
        </div>
        <div className="font-ui text-xs text-ink-soft">
          {t("misc.players_alive")}: {aliveCount}/{gameState.players.length}
        </div>
      </div>

      {/* Distribution animation */}
      <AnimatePresence>
        {isDistribution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-night-deep/90"
          >
            <motion.div
              initial={{ scale: 0.5, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ duration: 0.7, type: "spring" }}
            >
              <RoleCard role={gameState.myRole} revealed={true} size="lg" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 font-title text-xl text-gold"
            >
              {t("distribution.you_are")} {gameState.myRole && t(`role.${gameState.myRole}` as TranslationKey)}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-6"
            >
              <GrimoireButton
                onClick={() => onSendAction("ready")}
                variant="secondary"
              >
                {t("distribution.understood")}
              </GrimoireButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player circle */}
      <div className="px-4 py-6">
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {gameState.players.map((player) => {
            const isMe = player.id === playerId;
            return (
              <motion.div
                key={player.id}
                layout
                className="flex flex-col items-center gap-1"
              >
                <RoleCard
                  role={player.role}
                  revealed={isMe || !player.alive || isGameOver}
                  size="sm"
                  dead={!player.alive}
                  selected={false}
                />
                <span
                  className={`text-[10px] font-ui truncate max-w-16 ${
                    isMe ? "text-gold font-semibold" : player.alive ? "" : "text-ink-soft/50 line-through"
                  }`}
                >
                  {player.pseudo}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Center action area */}
      <div className="flex-1 flex flex-col items-center px-4">
        {isNight && (
          <NightPhase
            gameState={gameState}
            playerId={playerId}
            onNightAction={onNightAction}
          />
        )}
        {isDay && (
          <DayPhase
            gameState={gameState}
            playerId={playerId}
            onVote={onVote}
            onSendChat={onSendChat}
          />
        )}
      </div>

      {/* Bottom bar — my card peek */}
      <div className="fixed bottom-0 left-0 right-0 bg-parchment-dark/80 backdrop-blur-sm border-t border-gold/20 p-3 flex items-center justify-center gap-4 z-30">
        <button
          onClick={() => setShowMyCard(!showMyCard)}
          className="flex items-center gap-2 text-sm font-ui text-ink-soft hover:text-ink transition-colors"
        >
          <RoleCard role={gameState.myRole} revealed={showMyCard} size="sm" />
          <span>{showMyCard ? "Cacher" : "Ma carte"}</span>
        </button>
      </div>
    </div>
  );
}
