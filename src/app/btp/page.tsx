import Link from 'next/link';

export default function BTPPage() {
  const metiers = [
    { href: '/btp/electriciens', label: 'Électriciens', norme: 'EN 1149-5', desc: 'Protection antistatique obligatoire' },
    { href: '/btp/chantier', label: 'Chantier / Voirie', norme: 'EN ISO 20471', desc: 'Haute visibilité classe 2 minimum' },
  ];

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
          Vêtements de chantier conformes et à vos couleurs
        </h1>
        <p className="mt-4 text-lg text-neutral-500 max-w-2xl mx-auto">
          EN 1149, EN ISO 20471, EN ISO 11612 — livrés sous 7 jours.
          <br />Personnalisés avec votre logo d&apos;entreprise.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Trouvez les normes de votre corps de métier
        </h2>
        <div className="space-y-4">
          {metiers.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center justify-between p-5 border border-neutral-200 rounded-xl hover:border-neutral-400 hover:shadow-sm transition-all"
            >
              <div>
                <h3 className="text-base font-medium text-neutral-900">{m.label}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{m.desc}</p>
              </div>
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg">
                {m.norme}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/configurateur"
            className="inline-flex items-center px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Vérifier ma conformité
          </Link>
        </div>
      </section>

      {/* Guide normes */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <h2 className="text-2xl font-bold text-neutral-900">Guide des normes vestimentaires BTP</h2>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">EN ISO 20471 — Haute visibilité</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Obligatoire pour tout travailleur exposé au trafic routier ou aux engins de chantier.
              Classe 2 minimum pour le torse, classe 3 recommandée pour les zones à haut risque.
              Le vêtement doit combiner un matériau fluorescent et des bandes rétro-réfléchissantes.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">EN 1149-5 — Antistatique</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Obligatoire en environnement ATEX (atmosphères explosives) et pour les électriciens.
              Le tissu doit dissiper les charges électrostatiques pour éviter les étincelles.
              Souvent combiné avec d&apos;autres normes de protection.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">EN ISO 11612 — Chaleur et flammes</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Obligatoire pour les soudeurs et les métiers exposés à la chaleur radiante ou aux projections
              de métal en fusion. Le vêtement ne doit pas fondre, s&apos;enflammer ou se rétrécir au contact de la chaleur.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
