"use client";

import { motion } from "framer-motion";
import { Role } from "@/types/game";
import { useI18n } from "@/i18n/context";
import { TranslationKey } from "@/i18n/translations";

interface RoleCardProps {
  role: Role | null;
  revealed: boolean;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  dead?: boolean;
  onClick?: () => void;
  className?: string;
}

const ROLE_SYMBOLS: Record<Role, string> = {
  villageois: "🏠",
  loup_garou: "🐺",
  voyante: "🔮",
  sorciere: "🧪",
  chasseur: "🏹",
  cupidon: "💘",
};

const ROLE_COLORS: Record<Role, string> = {
  villageois: "border-forest",
  loup_garou: "border-burgundy",
  voyante: "border-purple-600",
  sorciere: "border-purple-800",
  chasseur: "border-forest",
  cupidon: "border-pink-500",
};

const SIZE_CLASSES = {
  sm: "w-16 h-24",
  md: "w-24 h-36",
  lg: "w-40 h-60",
};

export function RoleCard({
  role,
  revealed,
  size = "md",
  selected = false,
  dead = false,
  onClick,
  className = "",
}: RoleCardProps) {
  const { t } = useI18n();

  return (
    <motion.div
      className={`card-container ${SIZE_CLASSES[size]} ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05, y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className={`card-inner w-full h-full ${revealed ? "flipped" : ""}`}>
        {/* Back of card */}
        <div className="card-back w-full h-full rounded-lg overflow-hidden">
          <div
            className={`w-full h-full flex flex-col items-center justify-center
              bg-night-deep border-2 border-gold rounded-lg
              ${selected ? "pulse-gold" : ""}
              ${dead ? "opacity-40 grayscale rotate-6" : ""}
            `}
          >
            <div className="text-2xl mb-2">🌕</div>
            <div className="text-gold text-[8px] font-title uppercase tracking-widest">
              Loup-Garou
            </div>
            {/* Ornamental border */}
            <div className="absolute inset-2 border border-gold/30 rounded pointer-events-none" />
          </div>
        </div>

        {/* Front of card */}
        <div className="card-front w-full h-full rounded-lg overflow-hidden">
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-2
              bg-parchment border-2 ${role ? ROLE_COLORS[role] : "border-gold"} rounded-lg
              ${dead ? "opacity-40 grayscale" : ""}
            `}
          >
            {role && (
              <>
                {/* Placeholder illustration area */}
                <div className="flex-1 flex items-center justify-center w-full bg-parchment-dark/30 rounded mb-2">
                  <span className={size === "lg" ? "text-5xl" : size === "md" ? "text-3xl" : "text-xl"}>
                    {ROLE_SYMBOLS[role]}
                  </span>
                </div>

                {/* Role name */}
                <div className={`font-title text-center leading-tight ${
                  size === "lg" ? "text-sm" : size === "md" ? "text-[10px]" : "text-[8px]"
                }`}>
                  {t(`role.${role}` as TranslationKey)}
                </div>

                {/* Description (lg only) */}
                {size === "lg" && (
                  <div className="text-[9px] text-ink-soft text-center mt-1 italic font-body">
                    {t(`role.${role}.desc` as TranslationKey)}
                  </div>
                )}

                {/* Ornamental border */}
                <div className="absolute inset-1.5 border border-gold/40 rounded pointer-events-none" />
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
