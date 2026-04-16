import Link from 'next/link';

const METIERS = [
  { href: '/btp/electriciens', label: 'Électriciens', normes: ['EN 1149-5'], desc: 'Protection antistatique obligatoire en environnement ATEX', icon: '⚡' },
  { href: '/btp/chantier', label: 'Chantier / Voirie', normes: ['EN ISO 20471'], desc: 'Haute visibilité classe 2 minimum', icon: '🚧' },
  { href: '/btp/maconnerie', label: 'Maçonnerie / Gros œuvre', normes: ['EN ISO 20471', 'EN ISO 13688'], desc: 'Haute visibilité + protection générale', icon: '🧱' },
  { href: '/btp/couverture', label: 'Couverture / Charpente', normes: ['EN 361', 'EN ISO 20471'], desc: 'Harnais antichute + haute visibilité', icon: '🏠' },
  { href: '/btp/plomberie', label: 'Plomberie / Chauffage', normes: ['EN ISO 13688'], desc: 'Vêtement de protection générale', icon: '🔧' },
  { href: '/btp/peinture', label: 'Peinture / Plâtrerie', normes: ['EN 13034'], desc: 'Protection contre éclaboussures de produits liquides', icon: '🎨' },
  { href: '/btp/soudure', label: 'Soudure / Métallerie', normes: ['EN ISO 11612', 'EN ISO 11611'], desc: 'Résistance chaleur, flammes, projections de métal fondu', icon: '🔥' },
  { href: '/btp/menuiserie', label: 'Menuiserie / Charpentier', normes: ['EN ISO 13688'], desc: 'Vêtement de travail robuste, résistant aux accrocs', icon: '🪵' },
  { href: '/btp/conducteur-engins', label: 'Conducteur d\'engins', normes: ['EN ISO 20471'], desc: 'Haute visibilité pour descendre de l\'engin sur chantier', icon: '🚜' },
  { href: '/btp/paysagiste', label: 'Paysagiste / Espaces verts', normes: ['EN ISO 20471', 'EN 381'], desc: 'Haute visibilité + protection tronçonneuse si besoin', icon: '🌳' },
];

export default function BTPPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
          Vêtements de chantier conformes et à vos couleurs
        </h1>
        <p className="mt-4 text-lg text-neutral-500 max-w-2xl mx-auto">
          EN 1149, EN ISO 20471, EN ISO 11612, EN 13034 — livrés sous 7 jours.
          <br />Personnalisés avec votre logo d&apos;entreprise.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Trouvez les normes de votre corps de métier
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {METIERS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-start gap-3 p-4 border border-neutral-200 rounded-xl hover:border-neutral-400 hover:shadow-sm transition-all"
            >
              <span className="text-2xl flex-shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-neutral-900">{m.label}</h3>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{m.desc}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.normes.map(n => (
                    <span key={n} className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-medium rounded">{n}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
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
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">EN 1149-5 — Antistatique</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Obligatoire en environnement ATEX (atmosphères explosives) et pour les électriciens.
              Le tissu doit dissiper les charges électrostatiques pour éviter les étincelles.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">EN ISO 11612 — Chaleur et flammes</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Obligatoire pour les soudeurs et métiers exposés à la chaleur radiante ou aux projections
              de métal en fusion. Le vêtement ne doit pas fondre, s&apos;enflammer ou se rétrécir.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">EN 13034 — Protection chimique limitée</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Protection contre les éclaboussures de produits chimiques liquides (peintres, agriculteurs).
              Type 6 : protection limitée contre les brouillards et petites projections.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">EN ISO 13688 — Vêtement de protection</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Exigences générales pour tout vêtement de protection professionnel. Confort, innocuité, solidité des coutures.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
