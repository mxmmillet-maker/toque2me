import Link from 'next/link';

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
  { icon: '🏢', label: 'Entreprises', sub: 'T-shirts, sweats, polos — à votre image', href: '/configurateur' },
];

const CHIFFRES = [
  { value: '2 937', label: 'produits disponibles' },
  { value: '5', label: 'fournisseurs référencés' },
  { value: '3 min', label: 'pour un devis PDF' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 text-center">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-5">
            Toque2Me
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.08]">
            Vos vêtements pro,<br />
            conformes et à vos couleurs
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
            Devis en 3 minutes — Conformité HACCP, EN 1149, EN ISO 20471 incluse.
            Personnalisés avec votre logo.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalogue"
              className="px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Voir le catalogue
            </Link>
            <Link
              href="/configurateur"
              className="px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Configurer mon pack
            </Link>
          </div>
        </div>
      </section>

      {/* Catégories produits */}
      <section className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Chiffres clés */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-3 gap-8 text-center">
            {CHIFFRES.map((c) => (
              <div key={c.label}>
                <p className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tabular-nums tracking-tight">
                  {c.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">Conformité garantie</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Chaque produit est vérifié selon les normes de votre secteur. HACCP, EN 1149, EN ISO 20471 — aucun compromis.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">Personnalisation complète</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Logo brodé ou imprimé, choix des coloris, mix de pièces sur-mesure pour chaque membre de votre équipe.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">Prix dégressifs transparents</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Grilles tarifaires visibles, prix qui baissent avec la quantité, livraison offerte dès 150 € HT.
            </p>
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
