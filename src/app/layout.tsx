import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/react";

const ChatBubble = dynamic(() => import("@/components/agent/ChatBubble").then(m => m.ChatBubble), { ssr: false });

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Toque2Me — Textile & objets personnalisés pour professionnels",
  description: "Configurez et commandez vos vêtements pro personnalisés. Devis en 3 minutes, conformité réglementaire incluse.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("font-sans", geistSans.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ChatBubble />
        <Analytics />
      </body>
    </html>
  );
}
