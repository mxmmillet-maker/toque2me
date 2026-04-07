import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Broderie textile professionnelle — Logo brodé sur vêtements | Toque2Me',
  description:
    'Broderie sur polos, vestes, casquettes et tabliers. Rendu haut de gamme, ultra-durable. À partir de 10 pièces. Devis gratuit en 3 minutes.',
  openGraph: {
    title: 'Broderie textile pro — Toque2Me',
    description: 'Logo brodé sur vêtements professionnels. Rendu premium, durabilité maximale.',
  },
};

const FAQ = [
  {
    q: 'Combien coûte la broderie sur un polo ?',
    a: 'Le prix dépend du nombre de points (complexité du logo) et de la quantité. En moyenne : 4 à 6 € HT pour un logo coeur (7 cm), 8 à 13 € HT pour un logo dos (25 cm). Frais de digitalisation du logo : ~29 € HT (une seule fois, sauf réassort).',
  },
  {
    q: 'Combien de couleurs peut-on broder ?',
    a: 'La broderie n\'a pas de limite de couleurs au sens strict : chaque couleur correspond à un fil. En pratique, les logos de 1 à 8 couleurs sont les plus courants. Le prix varie peu avec le nombre de couleurs, c\'est surtout le nombre de points qui compte.',
  },
  {
    q: 'La broderie résiste-t-elle aux lavages industriels ?',
    a: 'Oui, c\'est la technique la plus durable. La broderie résiste aux lavages à 60°C et même au pressing industriel (restauration, hôtellerie). Le fil ne se décolle pas et ne craquelle pas, contrairement aux impressions.',
  },
  {
    q: 'Quels textiles sont compatibles avec la broderie ?',
    a: 'Tous les textiles épais : polos, sweats, vestes, softshells, polaires, casquettes, tabliers, chemises. Les t-shirts fins (< 160 g/m²) sont déconseillés car la broderie peut déformer le tissu.',
  },
  {
    q: 'Quel délai pour une commande brodée ?',
    a: 'Comptez 10 à 15 jours ouvrés après validation du BAT (bon à tirer). La digitalisation du logo prend 24 à 48h. Pour les réassorts avec un logo déjà digitalisé, c\'est plus rapide (7 à 10 jours).',
  },
  {
    q: 'Quelle taille de logo peut-on broder ?',
    a: 'De 3 cm (petit texte sur poignet) à 30 cm (dos complet). Les positions classiques : coeur (7-8 cm), manche (5-6 cm), dos (20-30 cm). Plus le logo est grand, plus le nombre de points augmente.',
  },
];

export default function BroderiePage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Breadcrumb */}
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 text-sm text-slate-400">
        <Link href="/marquage" className="hover:text-neutral-700 transition-colors">Marquage</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Broderie</span>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🧵</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            Broderie textile professionnelle
          </h1>
        </div>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          La technique de référence pour un rendu haut de gamme. Le fil brodé ne craquelle pas,
          ne se décolle pas et résiste à des centaines de lavages.
        </p>
      </section>

      {/* Caractéristiques */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">10+</p>
              <p className="text-xs text-slate-500 mt-1">pièces minimum</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">10-15j</p>
              <p className="text-xs text-slate-500 mt-1">délai moyen</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">60°C</p>
              <p className="text-xs text-slate-500 mt-1">lavage garanti</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">3-30cm</p>
              <p className="text-xs text-slate-500 mt-1">taille du logo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu SEO */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Comment fonctionne la broderie textile ?</h2>
            <p>
              La broderie consiste à piquer un fil directement dans le tissu à l&apos;aide d&apos;une
              machine multi-têtes (6 à 12 aiguilles). Chaque aiguille porte un fil de couleur différente.
              Le motif est d&apos;abord &quot;digitalisé&quot; : un technicien convertit votre logo en fichier
              de broderie (format .DST ou .EMB) qui indique à la machine chaque point, sa direction et sa couleur.
            </p>
            <p className="mt-3">
              C&apos;est cette étape de digitalisation qui assure la qualité du rendu. Un bon digitaliseur
              adapte la densité des points au tissu, ajuste les sous-couches pour éviter les fronces
              et optimise le parcours d&apos;aiguille pour un résultat net.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Pour quels vêtements ?</h2>
            <p>
              La broderie est idéale sur les textiles d&apos;une certaine épaisseur :
              <strong> polos</strong> (le classique corporate), <strong>vestes softshell</strong>,
              <strong> polaires</strong>, <strong>sweats</strong>, <strong>casquettes</strong>,
              <strong> tabliers</strong> et <strong>chemises</strong>.
            </p>
            <p className="mt-3">
              Elle est déconseillée sur les t-shirts très fins (&lt; 160 g/m²)
              car le poids du fil peut déformer la maille. Pour ces supports,
              préférez le <Link href="/marquage/dtf" className="text-neutral-900 underline underline-offset-2">DTF</Link> ou
              la <Link href="/marquage/serigraphie" className="text-neutral-900 underline underline-offset-2">sérigraphie</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Broderie vs impression : que choisir ?</h2>
            <p>
              La broderie offre un <strong>rendu en relief</strong>, un toucher premium et une durabilité
              inégalée. L&apos;impression (sérigraphie, DTF, DTG) permet des visuels plus détaillés,
              des photos et des dégradés que la broderie ne peut pas reproduire.
            </p>
            <p className="mt-3">
              En résumé : choisissez la broderie pour un <strong>logo d&apos;entreprise sobre</strong>
              sur un vêtement durable (polo, veste). Choisissez l&apos;impression pour un
              <strong> visuel complexe</strong> ou un textile fin.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Positions de broderie</h2>
            <p>Les positions les plus demandées :</p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
              <li><strong>Coeur gauche</strong> (7-8 cm) — la position corporate par défaut</li>
              <li><strong>Dos</strong> (20-30 cm) — impact visuel maximal</li>
              <li><strong>Manche droite</strong> (5-6 cm) — pour un deuxième logo ou un drapeau</li>
              <li><strong>Col / nuque</strong> (3-5 cm) — discret et élégant</li>
              <li><strong>Casquette face</strong> (5-8 cm) — broderie 3D possible</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Tarification</h2>
            <p>
              Le prix de la broderie se calcule en <strong>nombre de points</strong>, pas en nombre de couleurs.
              Un logo simple (texte + pictogramme) fait entre 5 000 et 15 000 points.
              Plus le nombre de points est élevé, plus le temps machine augmente et le prix avec.
            </p>
            <p className="mt-3">
              Ordres de grandeur pour 50 pièces :
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
              <li>Logo coeur 7 cm (~8 000 pts) : <strong>4 à 6 € HT / pièce</strong></li>
              <li>Logo dos 25 cm (~25 000 pts) : <strong>8 à 13 € HT / pièce</strong></li>
              <li>Frais de digitalisation : <strong>29 € HT</strong> (une fois)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl font-bold text-neutral-900 mb-8">Questions fréquentes — Broderie textile</h2>
          <div className="space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">{f.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Un projet de broderie ?
        </h2>
        <p className="text-slate-500 mb-8">
          Envoyez-nous votre logo, on vous fait un devis gratuit avec BAT sous 48h.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/configurateur"
            className="px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
          >
            Demander un devis broderie
          </Link>
          <Link
            href="/marquage"
            className="px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Comparer les techniques
          </Link>
        </div>
      </section>
    </main>
  );
}
