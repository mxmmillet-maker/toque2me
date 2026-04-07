import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sérigraphie textile — Impression grands volumes | Toque2Me',
  description:
    'Sérigraphie sur t-shirts, sweats et sacs. La technique la plus économique pour les grandes séries. Couleurs éclatantes, tenue excellente. Devis gratuit.',
  openGraph: {
    title: 'Sérigraphie textile pro — Toque2Me',
    description: 'Impression sérigraphie pour grandes séries. Couleurs vives, prix imbattables.',
  },
};

const FAQ = [
  {
    q: 'À partir de combien de pièces la sérigraphie est-elle intéressante ?',
    a: 'La sérigraphie devient compétitive à partir de 50 pièces. En dessous, les frais fixes (création des écrans : ~30 € par couleur) pèsent trop sur le prix unitaire. Pour les petites séries, le DTF est plus adapté.',
  },
  {
    q: 'Combien de couleurs peut-on imprimer en sérigraphie ?',
    a: 'En théorie, autant qu\'on veut — chaque couleur nécessite un écran dédié. En pratique, les visuels de 1 à 4 couleurs sont les plus courants et les plus économiques. Au-delà de 6 couleurs, le DTF devient plus rentable.',
  },
  {
    q: 'La sérigraphie résiste-t-elle aux lavages ?',
    a: 'Oui, très bien. L\'encre pénètre dans la fibre du tissu, ce qui donne une excellente tenue au lavage (40-60°C). La durabilité est comparable à la broderie, bien supérieure au transfert classique.',
  },
  {
    q: 'Peut-on faire de la sérigraphie sur du polyester ?',
    a: 'Oui, mais avec des encres spéciales (base eau ou plastisol basse température). Le coton et les mélanges coton/polyester donnent les meilleurs résultats. Les textiles 100% polyester techniques nécessitent un test préalable.',
  },
  {
    q: 'Quel délai pour une commande en sérigraphie ?',
    a: 'Comptez 8 à 12 jours ouvrés après validation du BAT. La création des écrans prend 24-48h. Pour les réassorts avec des écrans existants, le délai peut descendre à 5-7 jours.',
  },
];

export default function SerigraphiePage() {
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

      <nav className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 text-sm text-slate-400">
        <Link href="/marquage" className="hover:text-neutral-700 transition-colors">Marquage</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Sérigraphie</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🖌️</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            Sérigraphie textile
          </h1>
        </div>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          La technique historique pour les grands volumes. Un écran par couleur, une encre
          poussée dans la maille du tissu, un résultat vibrant et durable.
        </p>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">50+</p>
              <p className="text-xs text-slate-500 mt-1">pièces minimum recommandé</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">8-12j</p>
              <p className="text-xs text-slate-500 mt-1">délai moyen</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">1-6</p>
              <p className="text-xs text-slate-500 mt-1">couleurs optimales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">~1,50€</p>
              <p className="text-xs text-slate-500 mt-1">/ pièce (100+ pcs, 1 couleur)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Comment fonctionne la sérigraphie ?</h2>
            <p>
              La sérigraphie utilise un écran (cadre tendu d&apos;un tissu à maille fine) pour chaque couleur
              du visuel. L&apos;encre est poussée à travers l&apos;écran par une raclette, ne passant qu&apos;aux
              endroits où le motif a été &quot;ouvert&quot; par insolation. Chaque couleur est imprimée
              séparément, l&apos;une après l&apos;autre, avec un séchage intermédiaire.
            </p>
            <p className="mt-3">
              C&apos;est ce procédé qui explique le coût fixe par couleur (un écran = ~30 € HT)
              et le prix unitaire très bas en grande série : une fois l&apos;écran créé,
              chaque impression ne prend que quelques secondes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Pour quels projets ?</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>T-shirts événementiels</strong> — marathon, festival, salon, team building</li>
              <li><strong>Uniformes d&apos;équipe</strong> — logo 1-2 couleurs sur polo ou sweat</li>
              <li><strong>Goodies</strong> — tote bags, sacs en coton, tabliers</li>
              <li><strong>Merchandising</strong> — séries de 100 à 10 000 pièces</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Sérigraphie vs DTF : lequel choisir ?</h2>
            <p>
              <strong>Sérigraphie</strong> pour les grandes séries (50+) avec peu de couleurs (1-4) :
              prix unitaire imbattable, couleurs très opaques, excellent toucher.
            </p>
            <p className="mt-3">
              <strong><Link href="/marquage/dtf" className="text-neutral-900 underline underline-offset-2">DTF</Link></strong> pour
              les petites séries (&lt; 50) ou les visuels multi-couleurs / dégradés :
              pas de frais d&apos;écran, rendu photo-qualité, mais prix unitaire plus élevé.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Tarification</h2>
            <p>Le prix de la sérigraphie se décompose en :</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong>Frais d&apos;écran</strong> : ~30 € HT par couleur (une fois)</li>
              <li><strong>Impression</strong> : de 3,50 € (10 pcs) à 1,20 € (500+ pcs) par pièce et par couleur</li>
              <li><strong>Frais de calage</strong> : inclus dans le prix à partir de 50 pièces</li>
            </ul>
            <p className="mt-3">
              Exemple : 200 t-shirts, logo 2 couleurs face =
              2 écrans (60 €) + 200 × 2,40 € = <strong>~540 € HT soit 2,70 € / pièce</strong>.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl font-bold text-neutral-900 mb-8">Questions fréquentes — Sérigraphie</h2>
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

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Un projet de sérigraphie ?</h2>
        <p className="text-slate-500 mb-8">Devis gratuit en 3 minutes, tarif dégressif garanti.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/configurateur" className="px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            Demander un devis sérigraphie
          </Link>
          <Link href="/marquage" className="px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Comparer les techniques
          </Link>
        </div>
      </section>
    </main>
  );
}
