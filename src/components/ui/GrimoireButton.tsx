"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GrimoireButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

const VARIANTS = {
  primary: "bg-burgundy text-parchment hover:bg-burgundy-light border-gold",
  secondary: "bg-parchment-dark text-ink hover:bg-parchment border-gold/50",
  danger: "bg-blood text-parchment hover:bg-burgundy border-blood",
};

export function GrimoireButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
}: GrimoireButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-title text-sm uppercase tracking-wider
        px-6 py-3 rounded border-2 transition-colors
        ${VARIANTS[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
