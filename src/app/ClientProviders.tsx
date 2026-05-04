"use client";

import { I18nProvider } from "@/i18n/context";
import { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
