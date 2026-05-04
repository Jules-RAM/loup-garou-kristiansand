"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { ClientGameState, Role } from "@/types/game";
import { GrimoireButton } from "@/components/ui/GrimoireButton";
import { ALL_ROLES, ROLE_CONFIGS, getDefaultComposition } from "@/game-engine/roles";
import { TranslationKey } from "@/i18n/translations";

interface LobbyViewProps {
  gameCode: string;
  playerId: string;
  gameState: ClientGameState | null;
  onStartGame: (composition: Record<string, number>) => Promise<boolean>;
}

export function LobbyView({ gameCode, playerId, gameState, onStartGame }: LobbyViewProps) {
  const { t } = useI18n();
  const players = gameState?.players ?? [];
  const isHost = gameState?.players.find((p) => p.id === playerId)?.isHost ?? false;
  const [composition, setComposition] = useState<Record<string, number>>(() =>
    getDefaultComposition(Math.max(players.length, 4))
  );
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const totalRoles = Object.values(composition).reduce((a, b) => a + b, 0);
  const isBalanced = totalRoles === players.length;

  const updateRole = (role: string, delta: number) => {
    setComposition((prev) => {
      const current = prev[role] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [role]: next };
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/game/${gameCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (!isBalanced) return;
    setStarting(true);
    setError("");
    const ok = await onStartGame(composition);
    if (!ok) setError("Erreur au lancement");
    setStarting(false);
  };

  return (
    <div className="min-h-screen parchment-bg flex flex-col items-center pt-16 px-4">
      {/* Game code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-parchment-dark/40 border-2 border-gold rounded-lg px-8 py-4 mb-6 text-center"
      >
        <div className="text-xs font-ui text-ink-soft uppercase tracking-wider mb-1">Code</div>
        <div className="font-title text-4xl tracking-[0.4em] text-ink font-bold">{gameCode}</div>
        <button
          onClick={handleCopyLink}
          className="mt-2 text-xs font-ui text-gold hover:text-gold-bright transition-colors"
        >
          {copied ? "Copie !" : t("lobby.copy_link")}
        </button>
      </motion.div>

      {/* Players list */}
      <div className="w-full max-w-md mb-8">
        <h2 className="font-title text-lg mb-3 text-center">
          {t("lobby.players")} ({players.length})
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {players.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-2 px-3 py-2 rounded border
                ${p.id === playerId ? "border-gold bg-gold/10" : "border-gold/20 bg-parchment-dark/20"}
              `}
            >
              <div className={`w-2 h-2 rounded-full ${p.isConnected ? "bg-forest" : "bg-ink-soft/30"}`} />
              <span className="font-body text-sm truncate">{p.pseudo}</span>
              {p.isHost && <span className="text-xs text-gold ml-auto">host</span>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Composition editor (host only) */}
      {isHost && (
        <div className="w-full max-w-md mb-8">
          <h2 className="font-title text-lg mb-3 text-center">{t("lobby.composition")}</h2>
          <div className="space-y-2">
            {ALL_ROLES.map((role) => (
              <div
                key={role}
                className="flex items-center justify-between px-3 py-2 bg-parchment-dark/20 rounded border border-gold/10"
              >
                <span className="font-body text-sm">
                  {t(`role.${role}` as TranslationKey)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateRole(role, -1)}
                    className="w-7 h-7 rounded border border-gold/30 text-ink font-ui text-sm hover:bg-gold/10 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-title text-sm">
                    {composition[role] ?? 0}
                  </span>
                  <button
                    onClick={() => updateRole(role, 1)}
                    className="w-7 h-7 rounded border border-gold/30 text-ink font-ui text-sm hover:bg-gold/10 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Balance indicator */}
          <div className={`mt-3 text-center text-sm font-ui ${isBalanced ? "text-forest" : "text-burgundy"}`}>
            {totalRoles} / {players.length} roles
            {!isBalanced && ` (${totalRoles > players.length ? "trop" : "pas assez"})`}
          </div>
        </div>
      )}

      {/* Start button */}
      {isHost && (
        <GrimoireButton
          onClick={handleStart}
          disabled={!isBalanced || players.length < 4 || starting}
        >
          {starting ? "..." : t("lobby.start")}
        </GrimoireButton>
      )}

      {!isHost && (
        <p className="text-ink-soft italic font-body text-sm">{t("lobby.waiting")}</p>
      )}

      {error && <p className="text-burgundy text-sm mt-3 font-ui">{error}</p>}
    </div>
  );
}
