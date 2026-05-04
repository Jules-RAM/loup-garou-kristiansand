"use client";

import { useI18n } from "@/i18n/context";
import { Locale } from "@/i18n/translations";

const FLAGS: Record<Locale, string> = {
  fr: "FR",
  no: "NO",
  en: "EN",
};

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  const locales: Locale[] = ["fr", "no", "en"];

  return (
    <div className="flex gap-1 bg-parchment-dark/50 rounded-full px-2 py-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2 py-0.5 rounded-full text-xs font-ui transition-colors
            ${locale === l
              ? "bg-gold text-white font-semibold"
              : "text-ink-soft hover:text-ink"
            }`}
        >
          {FLAGS[l]}
        </button>
      ))}
    </div>
  );
}
