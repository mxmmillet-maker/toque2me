import Link from 'next/link';
import { OpenChatButton } from '@/components/home/OpenChatButton';
import { OpenChatButtonLight } from '@/components/home/OpenChatButtonLight';
import { AnimatedCounter } from '@/components/home/AnimatedCounter';

const CATEGORIES = [
  { label: 'T-shirts', href: '/catalogue?categorie=T-shirts' },
  { label: 'Polos', href: '/catalogue?categorie=Polos' },
  { label: 'Sweats', href: '/catalogue?categorie=Sweats' },
  { label: 'Vestes', href: '/catalogue?categorie=Vestes' },
  { label: 'Pantalons', href: '/catalogue?categorie=Pantalons' },
  { label: 'Chemises', href: '/catalogue?categorie=Chemises' },
  { label: 'Tabliers', href: '/catalogue?categorie=Tabliers' },
  { label: 'Chef', href: '/catalogue?categorie=Chef' },
  { label: 'Accessoires', href: '/catalogue?categorie=Accessoires' },
  { label: 'Bagagerie', href: '/catalogue?categorie=Bagagerie' },
];

const METIERS = [
  { icon: '🍽️', label: 'Restaurateurs', sub: 'Tabliers, polos, toques — conformité HACCP', href: '/restaurateurs' },
  { icon: '🦺', label: 'BTP & Artisans', sub: 'Haute visibilité, antistatique, flammes', href: '/btp' },
  { icon: '🏥', label: 'Santé & Médical', sub: 'Cabinets, cliniques, spa — tuniques, blouses, antibactérien', href: '/sante' },
  { icon: '🏢', label: 'Entreprises', sub: 'T-shirts, sweats, polos — à votre image', href: '/configurateur' },
];

const STEPS = [
  { num: '30s', label: 'Configurez', desc: '4 questions pour cibler vos besoins. Pas de formulaire, pas d\'attente.' },
  { num: '10s', label: 'Recevez votre sélection', desc: 'Produits adaptés à votre métier, prix dégressifs affichés, devis PDF instantané.' },
  { num: '1 clic', label: 'Commandez & payez', desc: 'Paiement sécurisé en ligne. On lance la production et le marquage.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full mb-6 border border-emerald-200">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Devis en 30 secondes — Paiement en ligne
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.08]">
            Vos vêtements pro<br />
            personnalisés en 3 clics
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
            Configurez, recevez votre devis, payez. Pas de va-et-vient,
            pas de délai. Votre commande part en production immédiatement.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <OpenChatButton />
            <Link
              href="/catalogue"
              className="px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* Process en 3 étapes */}
      <section className="border-y border-slate-100 bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-neutral-400 mb-10">
            Du besoin à la commande
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center sm:text-left">
                <p className="text-3xl font-extrabold text-white tabular-nums mb-2">{s.num}</p>
                <h3 className="text-sm font-semibold text-white mb-1">{s.label}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <OpenChatButtonLight />
          </div>
        </div>
      </section>

      {/* Catégories produits */}
      <section className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/catalogue"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              Tout voir
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-full hover:border-slate-400 hover:text-neutral-900 transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Entrées métier */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-400 mb-8">
          Votre secteur, nos solutions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {METIERS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group p-6 border border-slate-100 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all bg-white"
            >
              <span className="text-3xl block mb-3">{m.icon}</span>
              <h2 className="text-base font-semibold text-neutral-900 group-hover:underline underline-offset-2">
                {m.label}
              </h2>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                {m.sub}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Réassurance */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <AnimatedCounter value={2937} className="block text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 tabular-nums" />
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">produits disponibles</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                5 fournisseurs référencés. T-shirts à parkas, tabliers à EPI.
              </p>
            </div>
            <div>
              <AnimatedCounter value={100} suffix="%" className="block text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 tabular-nums" />
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">conforme</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                HACCP, EN ISO 20471, EN 1149 — chaque produit vérifié pour votre secteur.
              </p>
            </div>
            <div>
              <AnimatedCounter value={0} prefix="" suffix=" €" className="block text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 tabular-nums" />
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">de frais de port dès 150 € HT</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Prix dégressifs transparents. Broderie, sérigraphie, DTF — tout inclus dans le devis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs text-slate-400">
              Toque2Me — Textile & objets personnalisés pour professionnels
            </p>
            <div className="flex gap-6 text-xs text-slate-400">
              <Link href="/catalogue" className="hover:text-neutral-900 transition-colors">Catalogue</Link>
              <Link href="/configurateur" className="hover:text-neutral-900 transition-colors">Configurateur</Link>
              <Link href="/restaurateurs" className="hover:text-neutral-900 transition-colors">Restaurateurs</Link>
              <Link href="/btp" className="hover:text-neutral-900 transition-colors">BTP</Link>
              <Link href="/marquage" className="hover:text-neutral-900 transition-colors">Marquage</Link>
              <Link href="/bordeaux" className="hover:text-neutral-900 transition-colors">Bordeaux</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} Toque2Me. Tous droits réservés.
            </p>
            <div className="flex gap-5 text-[11px] text-slate-400">
              <Link href="/cgv" className="hover:text-neutral-900 transition-colors">CGV</Link>
              <Link href="/mentions-legales" className="hover:text-neutral-900 transition-colors">Mentions légales</Link>
              <Link href="/confidentialite" className="hover:text-neutral-900 transition-colors">Politique de confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
