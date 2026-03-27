import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
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
  openGraph: {
    title: "Toque2Me — Textile & objets personnalisés pour professionnels",
    description: "Configurez et commandez vos vêtements pro personnalisés. Devis en 3 minutes, conformité réglementaire incluse.",
    siteName: "Toque2Me",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toque2Me — Textile pro personnalisé",
    description: "Devis en 3 minutes, conformité réglementaire incluse.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-bold tracking-tight text-neutral-900">
          Toque2Me
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          <Link href="/catalogue" className="text-sm text-slate-600 hover:text-neutral-900 transition-colors">
            Catalogue
          </Link>
          <Link href="/configurateur" className="text-sm text-slate-600 hover:text-neutral-900 transition-colors">
            Configurateur
          </Link>
          <Link href="/restaurateurs" className="text-sm text-slate-600 hover:text-neutral-900 transition-colors">
            Restaurateurs
          </Link>
          <Link href="/btp" className="text-sm text-slate-600 hover:text-neutral-900 transition-colors">
            BTP
          </Link>
        </div>

        <Link
          href="/configurateur"
          className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Demander un devis
        </Link>
      </nav>
    </header>
  );
}

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
        <Navbar />
        {children}
        <ChatBubble />
        <Analytics />
      </body>
    </html>
  );
}
