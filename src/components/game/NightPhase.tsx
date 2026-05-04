"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { ClientGameState, Role } from "@/types/game";
import { TranslationKey } from "@/i18n/translations";
import { GrimoireButton } from "@/components/ui/GrimoireButton";

interface NightPhaseProps {
  gameState: ClientGameState;
  playerId: string;
  onNightAction: (targetId: string | null, extra?: Record<string, unknown>) => Promise<boolean>;
}

export function NightPhase({ gameState, playerId, onNightAction }: NightPhaseProps) {
  const { t } = useI18n();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [secondTarget, setSecondTarget] = useState<string | null>(null);
  const [acted, setActed] = useState(false);

  const me = gameState.players.find((p) => p.id === playerId);
  const alivePlayers = gameState.players.filter((p) => p.alive && p.id !== playerId);
  const allAlive = gameState.players.filter((p) => p.alive);

  const isMyTurn =
    (gameState.phase === "night_voyante" && me?.role === "voyante") ||
    (gameState.phase === "night_loups" && me?.role === "loup_garou") ||
    (gameState.phase === "night_sorciere" && me?.role === "sorciere") ||
    (gameState.phase === "night_cupidon" && me?.role === "cupidon") ||
    (gameState.phase === "hunter_shot" && me?.role === "chasseur");

  if (acted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mt-8"
      >
        <p className="text-moonlight/70 italic font-body">En attente des autres joueurs...</p>
      </motion.div>
    );
  }

  if (!isMyTurn) {
    // Show narration based on phase
    const narrationKey = getNarrationKey(gameState.phase);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-8"
      >
        <div className="text-4xl mb-4">🌙</div>
        <p className="text-moonlight/70 italic font-body typing-cursor">
          {narrationKey ? t(narrationKey) : "La nuit suit son cours..."}
        </p>
      </motion.div>
    );
  }

  // Active player view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mt-4"
    >
      {/* Phase-specific narration */}
      <p className="text-center text-moonlight italic font-body mb-4 text-sm">
        {getNarrationText(gameState.phase, t)}
      </p>

      {/* Sorciere special UI */}
      {gameState.phase === "night_sorciere" && gameState.phaseData?.type === "sorciere_info" && (
        <div className="mb-4 text-center">
          {gameState.phaseData.victimId && (
            <p className="text-burgundy-light text-sm mb-2">
              Victime des loups : {gameState.players.find((p) => gameState.phaseData?.type === "sorciere_info" && p.id === gameState.phaseData.victimId)?.pseudo ?? "???"}
            </p>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            {gameState.phaseData.canHeal && gameState.phaseData.victimId && (
              <GrimoireButton
                variant="secondary"
                onClick={async () => {
                  await onNightAction(null, { sorciereAction: "heal" });
                  setActed(true);
                }}
              >
                {t("action.heal")} 💚
              </GrimoireButton>
            )}
            {gameState.phaseData.canKill && (
              <GrimoireButton
                variant="danger"
                onClick={async () => {
                  if (!selectedTarget) return;
                  await onNightAction(selectedTarget, { sorciereAction: "kill" });
                  setActed(true);
                }}
                disabled={!selectedTarget}
              >
                {t("action.kill")} ☠️
              </GrimoireButton>
            )}
            <GrimoireButton
              variant="secondary"
              onClick={async () => {
                await onNightAction(null, { sorciereAction: "skip" });
                setActed(true);
              }}
            >
              {t("action.skip")}
            </GrimoireButton>
          </div>
        </div>
      )}

      {/* Cupidon: select 2 targets */}
      {gameState.phase === "night_cupidon" && (
        <p className="text-center text-xs text-moonlight/60 mb-2">
          Choisissez 2 joueurs
        </p>
      )}

      {/* Target selection grid */}
      {gameState.phase !== "night_sorciere" && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(gameState.phase === "night_cupidon" ? allAlive : alivePlayers)
              .filter((p) => {
                // Wolves can't target wolves
                if (gameState.phase === "night_loups" && me?.role === "loup_garou") {
                  const isWolf = gameState.players.find((pl) => pl.id === p.id);
                  // We don't know other players' roles client-side during night
                  // The server will reject invalid targets
                }
                return true;
              })
              .map((player) => {
                const isSelected = selectedTarget === player.id || secondTarget === player.id;
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      if (gameState.phase === "night_cupidon") {
                        if (selectedTarget === player.id) {
                          setSelectedTarget(null);
                        } else if (secondTarget === player.id) {
                          setSecondTarget(null);
                        } else if (!selectedTarget) {
                          setSelectedTarget(player.id);
                        } else if (!secondTarget) {
                          setSecondTarget(player.id);
                        }
                      } else {
                        setSelectedTarget(player.id === selectedTarget ? null : player.id);
                      }
                    }}
                    className={`px-3 py-2 rounded border text-sm font-ui transition-all
                      ${isSelected
                        ? "border-gold bg-gold/20 text-gold scale-105"
                        : "border-moonlight/20 text-moonlight/80 hover:border-moonlight/50"
                      }
                    `}
                  >
                    {player.pseudo}
                  </button>
                );
              })}
          </div>

          {/* Confirm button */}
          <div className="flex justify-center">
            <GrimoireButton
              onClick={async () => {
                if (gameState.phase === "night_cupidon") {
                  if (selectedTarget && secondTarget) {
                    await onNightAction(selectedTarget, { target2Id: secondTarget });
                    setActed(true);
                  }
                } else if (selectedTarget) {
                  await onNightAction(selectedTarget);
                  setActed(true);
                }
              }}
              disabled={
                gameState.phase === "night_cupidon"
                  ? !selectedTarget || !secondTarget
                  : !selectedTarget
              }
            >
              {t("action.confirm")}
            </GrimoireButton>
          </div>
        </>
      )}
    </motion.div>
  );
}

function getNarrationKey(phase: string): TranslationKey | null {
  switch (phase) {
    case "night_voyante":
      return "narration.voyante_wake";
    case "night_loups":
      return "narration.loups_wake";
    case "night_sorciere":
      return "narration.sorciere_wake";
    case "night_cupidon":
      return "narration.cupidon_wake";
    case "dawn":
      return "narration.dawn";
    default:
      return "narration.night_falls";
  }
}

function getNarrationText(phase: string, t: (key: TranslationKey) => string): string {
  const key = getNarrationKey(phase);
  return key ? t(key) : "";
}
