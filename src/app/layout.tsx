import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ScrollLockGuard } from "@/components/shared/scroll-lock-guard";
import { ScrollRestorationGuard } from "@/components/shared/scroll-restoration-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonte de destaque para títulos e Hero — dá ao site público um tom mais
// "imobiliária de alto padrão" do que a Geist sozinha (que fica só no
// corpo de texto e no painel administrativo).
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bebiano Imóveis",
    template: "%s | Bebiano Imóveis",
  },
  description: "Imobiliária em Mogi das Cruzes, São Paulo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ScrollLockGuard />
        <ScrollRestorationGuard />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
