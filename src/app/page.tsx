import Link from 'next/link';
import { AnimatedCounter } from '@/components/home/AnimatedCounter';
import { HeroSlider } from '@/components/home/HeroSlider';

const KITS = [
  {
    label: 'Kit Séminaire',
    desc: 'Polo + veste softshell + casquette',
    icon: '🏢',
    href: '/configurateur?occasion=evenement&typologies=Polos,Vestes,Casquettes',
    color: 'border-blue-100 hover:border-blue-300',
  },
  {
    label: 'Kit Restauration',
    desc: 'Tablier + veste cuisine + pantalon',
    icon: '👨‍🍳',
    href: '/configurateur?secteur=restauration&occasion=workwear&typologies=Tabliers,Vestes,Pantalons',
    color: 'border-amber-100 hover:border-amber-300',
  },
  {
    label: 'Kit Team Building',
    desc: 'T-shirt + sweat + tote bag',
    icon: '🎉',
    href: '/configurateur?occasion=evenement&typologies=T-shirts,Sweats,Bagagerie',
    color: 'border-emerald-100 hover:border-emerald-300',
  },
];

const UNIVERS = [
  { icon: '🍽️', label: 'Restauration', href: '/restaurateurs' },
  { icon: '🦺', label: 'BTP & Artisans', href: '/btp' },
  { icon: '🏥', label: 'Santé', href: '/sante' },
  { icon: '🎉', label: 'Événementiel', href: '/catalogue?univers=evenementiel' },
  { icon: '⚽', label: 'Sportswear', href: '/catalogue?univers=sportswear' },
  { icon: '🛡️', label: 'EPI / Sécurité', href: '/catalogue?univers=epi' },
];

const CATEGORIES = [
  { label: 'T-shirts', href: '/catalogue?categorie=T-shirts' },
  { label: 'Polos', href: '/catalogue?categorie=Polos' },
  { label: 'Sweats', href: '/catalogue?categorie=Sweats' },
  { label: 'Vestes', href: '/catalogue?categorie=Vestes' },
  { label: 'Pantalons', href: '/catalogue?categorie=Pantalons' },
  { label: 'Chemises', href: '/catalogue?categorie=Chemises' },
  { label: 'Tabliers', href: '/catalogue?categorie=Tabliers' },
  { label: 'Accessoires', href: '/catalogue?categorie=Accessoires' },
  { label: 'Bagagerie', href: '/catalogue?categorie=Bagagerie' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero animé — slider */}
      <HeroSlider />

      {/* Process en 3 étapes */}
      <section className="bg-neutral-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { num: '30s', label: 'Configurez', desc: 'Quelques clics pour cibler vos besoins' },
              { num: '10s', label: 'Sélection IA', desc: 'Produits adaptés + prix dégressifs' },
              { num: '1 clic', label: 'Commandez', desc: 'Paiement sécurisé, production lancée' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums mb-1">{s.num}</p>
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-0.5">{s.label}</h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed hidden sm:block">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kits du moment */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">Kits du moment</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Packs pré-configurés, prêts à personnaliser</p>
          </div>
          <Link href="/configurateur" className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2">
            Créer le mien →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {KITS.map(k => (
            <Link key={k.label} href={k.href} className={`group p-5 border-2 rounded-lg hover:shadow-md transition-all ${k.color}`}>
              <span className="text-2xl block mb-2">{k.icon}</span>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:underline underline-offset-2">{k.label}</h3>
              <p className="text-xs text-neutral-500 mt-1">{k.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Univers populaires */}
      <section className="bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-6 text-center">Par secteur & usage</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {UNIVERS.map(u => (
              <Link key={u.label} href={u.href} className="group flex flex-col items-center p-4 bg-white border border-neutral-100 rounded-lg hover:border-neutral-300 hover:shadow-sm transition-all">
                <span className="text-2xl mb-2">{u.icon}</span>
                <span className="text-xs font-medium text-neutral-700 group-hover:text-neutral-900 text-center">{u.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories produits */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/catalogue" className="px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors">
            Tout voir
          </Link>
          {CATEGORIES.map(cat => (
            <Link key={cat.label} href={cat.href} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-full hover:border-slate-400 hover:text-neutral-900 transition-colors">
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Brief rapide — CTA moteur IA */}
      <section className="bg-neutral-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Décrivez votre besoin, on fait le reste</h2>
          <p className="text-sm text-neutral-400 mb-8 max-w-lg mx-auto">
            &ldquo;80 polos marine brodés pour un salon dans 3 semaines&rdquo; — notre IA vous propose 2 options chiffrées avec date de livraison garantie.
          </p>
          <Link
            href="/configurateur"
            className="inline-flex px-8 py-3.5 bg-white text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Lancer mon brief — 30s
          </Link>
        </div>
      </section>

      {/* Réassurance avec compteurs */}
      <section className="border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <AnimatedCounter value={2937} className="block text-3xl font-bold text-neutral-900 mb-1 tabular-nums" />
              <p className="text-xs text-neutral-500">produits disponibles</p>
            </div>
            <div>
              <AnimatedCounter value={5} className="block text-3xl font-bold text-neutral-900 mb-1 tabular-nums" />
              <p className="text-xs text-neutral-500">fournisseurs référencés</p>
            </div>
            <div>
              <AnimatedCounter value={100} suffix="%" className="block text-3xl font-bold text-neutral-900 mb-1 tabular-nums" />
              <p className="text-xs text-neutral-500">conforme secteur</p>
            </div>
            <div>
              <AnimatedCounter value={0} suffix="€" className="block text-3xl font-bold text-neutral-900 mb-1 tabular-nums" />
              <p className="text-xs text-neutral-500">port dès 150€ HT</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Toque2Me</p>
              <p className="text-xs text-slate-400 mt-0.5">Textile & objets personnalisés pour professionnels</p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <Link href="/catalogue" className="hover:text-neutral-900 transition-colors">Catalogue</Link>
              <Link href="/configurateur" className="hover:text-neutral-900 transition-colors">Configurateur</Link>
              <Link href="/restaurateurs" className="hover:text-neutral-900 transition-colors">Restaurateurs</Link>
              <Link href="/btp" className="hover:text-neutral-900 transition-colors">BTP</Link>
              <Link href="/sante" className="hover:text-neutral-900 transition-colors">Santé</Link>
              <Link href="/marquage" className="hover:text-neutral-900 transition-colors">Marquage</Link>
              <Link href="/bordeaux" className="hover:text-neutral-900 transition-colors">Bordeaux</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} Toque2Me. Tous droits réservés.
            </p>
            <div className="flex gap-5 text-[11px] text-slate-400">
              <Link href="/cgv" className="hover:text-neutral-900 transition-colors">CGV</Link>
              <Link href="/mentions-legales" className="hover:text-neutral-900 transition-colors">Mentions légales</Link>
              <Link href="/confidentialite" className="hover:text-neutral-900 transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
