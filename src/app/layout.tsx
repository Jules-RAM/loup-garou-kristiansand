import type { Metadata } from "next";
import { Cinzel, Crimson_Pro, Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./ClientProviders";

const cinzel = Cinzel({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Loup-Garou de Kristiansand",
  description: "Jeu de Loup-Garou en ligne multijoueur",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cinzel.variable} ${crimsonPro.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-parchment text-ink font-body">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
