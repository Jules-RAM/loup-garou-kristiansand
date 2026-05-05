"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { GrimoireButton } from "@/components/ui/GrimoireButton";
import { MoonIcon, WolfIcon } from "@/components/ui/Icons";

function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("lgk-player-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("lgk-player-id", id);
  }
  return id;
}

export default function LandingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "join" | "create">("idle");
  const [pseudo, setPseudo] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("lgk-pseudo") || "" : ""
  );
  const [gameCode, setGameCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const savePseudo = (p: string) => {
    setPseudo(p);
    if (typeof window !== "undefined") localStorage.setItem("lgk-pseudo", p);
  };

  const handleCreate = async () => {
    if (!pseudo.trim()) return;
    setLoading(true);
    setError("");
    try {
      const playerId = getOrCreatePlayerId();
      const res = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, pseudo: pseudo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/game/${data.code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!pseudo.trim() || !gameCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const playerId = getOrCreatePlayerId();
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: gameCode.trim().toUpperCase(),
          playerId,
          pseudo: pseudo.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/game/${data.code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen parchment-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-parchment-dark/20" />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center px-4 max-w-lg w-full"
      >
        {/* Moon icon */}
        <motion.div
          className="mb-6 text-gold"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <MoonIcon size={64} />
        </motion.div>

        {/* Title */}
        <h1 className="font-title text-3xl md:text-4xl text-center text-ink font-bold mb-2">
          {t("app.title")}
        </h1>
        <p className="text-ink-soft italic text-center mb-10 font-body text-lg">
          {t("app.subtitle")}
        </p>

        {/* Pseudo input (always visible) */}
        <input
          type="text"
          value={pseudo}
          onChange={(e) => savePseudo(e.target.value)}
          placeholder={t("landing.pseudo_placeholder")}
          maxLength={20}
          className="w-full max-w-xs px-4 py-3 rounded border-2 border-gold/50 bg-parchment
            text-center font-title text-sm placeholder:text-ink-soft/50
            focus:outline-none focus:border-gold transition-colors mb-6"
        />

        {/* Action buttons */}
        <AnimatePresence mode="wait">
          {mode === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <GrimoireButton onClick={() => setMode("create")} disabled={!pseudo.trim()}>
                {t("landing.create")}
              </GrimoireButton>
              <GrimoireButton onClick={() => setMode("join")} variant="secondary" disabled={!pseudo.trim()}>
                {t("landing.join")}
              </GrimoireButton>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3 w-full max-w-xs items-center"
            >
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder={t("landing.code_placeholder")}
                maxLength={5}
                autoFocus
                className="w-full px-4 py-3 rounded border-2 border-gold/50 bg-parchment
                  text-center font-title text-lg tracking-[0.3em] uppercase
                  placeholder:text-ink-soft/50 placeholder:tracking-normal placeholder:text-sm
                  focus:outline-none focus:border-gold transition-colors"
              />
              <GrimoireButton
                onClick={handleJoin}
                disabled={loading || !gameCode.trim() || gameCode.length < 5}
              >
                {loading ? "..." : t("landing.join")}
              </GrimoireButton>
              <button
                onClick={() => { setMode("idle"); setError(""); }}
                className="text-ink-soft text-sm font-ui hover:text-ink transition-colors"
              >
                ← Retour
              </button>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3 w-full max-w-xs items-center"
            >
              <GrimoireButton onClick={handleCreate} disabled={loading}>
                {loading ? "..." : t("landing.create")}
              </GrimoireButton>
              <button
                onClick={() => { setMode("idle"); setError(""); }}
                className="text-ink-soft text-sm font-ui hover:text-ink transition-colors"
              >
                ← Retour
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-burgundy text-sm mt-4 font-ui"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Decorative footer line */}
      <div className="absolute bottom-8 flex items-center gap-2 text-gold/50">
        <div className="w-12 h-px bg-gold/30" />
        <WolfIcon size={16} />
        <div className="w-12 h-px bg-gold/30" />
      </div>
    </div>
  );
}
