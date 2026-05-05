"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { ClientGameState } from "@/types/game";
import { TranslationKey } from "@/i18n/translations";
import { RoleCard } from "@/components/cards/RoleCard";
import { GrimoireButton } from "@/components/ui/GrimoireButton";
import { VillageIcon, WolfIcon, HeartArrowIcon } from "@/components/ui/Icons";

interface GameOverViewProps {
  gameState: ClientGameState;
  onReplay: () => void;
}

export function GameOverView({ gameState, onReplay }: GameOverViewProps) {
  const { t } = useI18n();

  const winnerKey =
    gameState.winner === "village"
      ? "victory.village"
      : gameState.winner === "loups"
        ? "victory.loups"
        : "victory.lovers";

  const bgClass =
    gameState.winner === "village"
      ? "from-forest/80 to-forest"
      : gameState.winner === "loups"
        ? "from-burgundy/80 to-blood"
        : "from-pink-600/80 to-pink-800";

  return (
    <div className="min-h-screen parchment-bg flex flex-col items-center justify-center px-4">
      {/* Victory banner */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className={`bg-gradient-to-b ${bgClass} text-parchment px-8 py-6 rounded-lg text-center mb-8 shadow-lg`}
      >
        <h1 className="font-title text-2xl md:text-3xl font-bold mb-2">
          {t(winnerKey as TranslationKey)}
        </h1>
        <div className="flex justify-center mt-2 text-parchment/80">
          {gameState.winner === "village" ? <VillageIcon size={28} /> : gameState.winner === "loups" ? <WolfIcon size={28} /> : <HeartArrowIcon size={28} />}
        </div>
      </motion.div>

      {/* All players revealed */}
      <div className="w-full max-w-lg">
        <h2 className="font-title text-lg text-center mb-4">{t("gameover.final_roles")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gameState.players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, rotateY: 180 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="flex flex-col items-center gap-1"
            >
              <RoleCard
                role={player.role}
                revealed={true}
                size="md"
                dead={!player.alive}
              />
              <span className={`text-xs font-ui ${player.alive ? "text-ink" : "text-ink-soft/50 line-through"}`}>
                {player.pseudo}
              </span>
              {player.role && (
                <span className="text-[10px] font-body text-ink-soft">
                  {t(`role.${player.role}` as TranslationKey)}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <GrimoireButton onClick={onReplay}>
          {t("gameover.play_again")}
        </GrimoireButton>
        <GrimoireButton
          variant="secondary"
          onClick={() => window.location.href = "/"}
        >
          {t("gameover.new_game")}
        </GrimoireButton>
      </div>
    </div>
  );
}
