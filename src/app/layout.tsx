import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/ui/Toast";

const ChatBubble = dynamic(() => import("@/components/agent/ChatBubble").then(m => m.ChatBubble), { ssr: false });
const NavIcons = dynamic(() => import("@/components/nav/NavIcons").then(m => m.NavIcons), { ssr: false });

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Toque2Me — Textile & objets personnalisés pour professionnels",
  description: "Configurez et commandez vos vêtements pro personnalisés. Devis en 3 minutes, conformité réglementaire incluse.",
  metadataBase: new URL("https://toque2me.com"),
  openGraph: {
    title: "Toque2Me — Textile & objets personnalisés pour professionnels",
    description: "Configurez et commandez vos vêtements pro personnalisés. Devis en 3 minutes, conformité réglementaire incluse.",
    siteName: "Toque2Me",
    locale: "fr_FR",
    type: "website",
    url: "https://toque2me.com",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Toque2Me — Textile pro personnalisé" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toque2Me — Textile pro personnalisé",
    description: "Devis en 3 minutes, conformité réglementaire incluse.",
    images: ["/api/og"],
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

        <div className="hidden md:flex items-center gap-1">
          {/* Catalogue avec dropdown catégories */}
          <div className="relative group">
            <Link href="/catalogue" className="px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 rounded-lg hover:bg-slate-50 transition-colors">
              Catalogue
            </Link>
            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-[420px] grid grid-cols-2 gap-1">
                {[
                  { label: 'T-shirts', href: '/catalogue?categorie=T-shirts' },
                  { label: 'Polos', href: '/catalogue?categorie=Polos' },
                  { label: 'Sweats', href: '/catalogue?categorie=Sweats' },
                  { label: 'Vestes', href: '/catalogue?categorie=Vestes' },
                  { label: 'Chemises', href: '/catalogue?categorie=Chemises' },
                  { label: 'Pantalons', href: '/catalogue?categorie=Pantalons' },
                  { label: 'Tabliers', href: '/catalogue?categorie=Tabliers' },
                  { label: 'Chef / Cuisine', href: '/catalogue?categorie=Chef' },
                  { label: 'Accessoires', href: '/catalogue?categorie=Accessoires' },
                  { label: 'Bagagerie', href: '/catalogue?categorie=Bagagerie' },
                ].map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
                <div className="col-span-2 mt-2 pt-2 border-t border-slate-100">
                  <Link href="/catalogue" className="px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-slate-50 rounded-lg transition-colors block">
                    Voir tout le catalogue →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Univers avec dropdown */}
          <div className="relative group">
            <span className="px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 rounded-lg hover:bg-slate-50 transition-colors cursor-default">
              Univers
            </span>
            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2 w-64">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Par secteur</p>
                <Link href="/restaurateurs" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 hover:bg-slate-50 rounded-md transition-colors">
                  <span className="text-base">🍽️</span> Restauration / CHR
                </Link>
                <Link href="/btp" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 hover:bg-slate-50 rounded-md transition-colors">
                  <span className="text-base">🦺</span> BTP & Artisans
                </Link>
                <Link href="/sante" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 hover:bg-slate-50 rounded-md transition-colors">
                  <span className="text-base">🏥</span> Santé & Médical
                </Link>
                <div className="border-t border-slate-100 my-1.5" />
                <p className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Par usage</p>
                <Link href="/catalogue?univers=evenementiel" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 hover:bg-slate-50 rounded-md transition-colors">
                  <span className="text-base">🎉</span> Événementiel
                </Link>
                <Link href="/catalogue?univers=sportswear" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 hover:bg-slate-50 rounded-md transition-colors">
                  <span className="text-base">⚽</span> Sportswear
                </Link>
                <Link href="/catalogue?univers=epi" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 hover:bg-slate-50 rounded-md transition-colors">
                  <span className="text-base">🛡️</span> EPI / Sécurité
                </Link>
                <div className="border-t border-slate-100 my-1.5" />
                <Link href="/marquage" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 hover:bg-slate-50 rounded-md transition-colors">
                  <span className="text-base">🧵</span> Guide marquage
                </Link>
              </div>
            </div>
          </div>

          <Link href="/configurateur" className="px-3 py-2 text-sm text-slate-600 hover:text-neutral-900 rounded-lg hover:bg-slate-50 transition-colors">
            Configurateur
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/configurateur"
            className="hidden sm:inline-flex px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Demander un devis
          </Link>
          <NavIcons />
        </div>
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
    <html lang="fr" className={cn("font-sans", poppins.variable)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Toque2Me',
        description: 'Textile et objets personnalisés pour professionnels. Broderie, sérigraphie, DTF. Devis en 3 minutes.',
        url: 'https://toque2me.com',
        logo: 'https://toque2me.com/api/og',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Bordeaux',
          addressRegion: 'Nouvelle-Aquitaine',
          addressCountry: 'FR',
        },
        areaServed: { '@type': 'Country', name: 'France' },
        priceRange: '€€',
        sameAs: [],
      }) }} />
      <body
        className={`${poppins.variable} antialiased`}
      >
        <ToastProvider>
          <CartProvider>
            <Navbar />
            {children}
            <ChatBubble />
          </CartProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
