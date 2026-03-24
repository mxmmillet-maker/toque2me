import Link from 'next/link';

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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">
          Toque2Me
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
          Vos vêtements pro,<br />
          conformes et à vos couleurs
        </h1>
        <p className="mt-6 text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
          Devis en 3 minutes — Conformité HACCP, EN 1149, EN ISO 20471 incluse.
          Personnalisés avec votre logo.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/catalogue"
            className="px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Voir le catalogue
          </Link>
          <Link
            href="/configurateur"
            className="px-8 py-3.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Configurer mon pack
          </Link>
        </div>
      </section>

      {/* Entrées métier */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {METIERS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group p-6 border border-neutral-100 rounded-2xl hover:border-neutral-300 hover:shadow-sm transition-all"
            >
              <span className="text-3xl block mb-3">{m.icon}</span>
              <h2 className="text-base font-semibold text-neutral-900 group-hover:underline underline-offset-2">
                {m.label}
              </h2>
              <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                {m.sub}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-3 gap-8 text-center">
            {CHIFFRES.map((c) => (
              <div key={c.label}>
                <p className="text-3xl sm:text-4xl font-bold text-neutral-900 tabular-nums">
                  {c.value}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Conformité garantie</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Chaque produit est vérifié selon les normes de votre secteur. HACCP, EN 1149, EN ISO 20471 — aucun compromis.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Personnalisation complète</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Logo brodé ou imprimé, choix des coloris, mix de pièces sur-mesure pour chaque membre de votre équipe.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Prix dégressifs transparents</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Grilles tarifaires visibles, prix qui baissent avec la quantité, livraison offerte dès 150 € HT.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">
            Toque2Me — Textile & objets personnalisés pour professionnels
          </p>
          <div className="flex gap-6 text-xs text-neutral-400">
            <Link href="/catalogue" className="hover:text-neutral-700 transition-colors">Catalogue</Link>
            <Link href="/configurateur" className="hover:text-neutral-700 transition-colors">Configurateur</Link>
            <Link href="/restaurateurs" className="hover:text-neutral-700 transition-colors">Restaurateurs</Link>
            <Link href="/btp" className="hover:text-neutral-700 transition-colors">BTP</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
