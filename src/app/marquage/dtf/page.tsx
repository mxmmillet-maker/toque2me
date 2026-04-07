import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transfert DTF — Impression textile petites séries | Toque2Me',
  description:
    'Impression DTF (Direct to Film) sur t-shirts, sweats, sacs. Idéal pour les petites séries et les visuels multi-couleurs. Devis gratuit en 3 minutes.',
  openGraph: {
    title: 'Transfert DTF textile — Toque2Me',
    description: 'DTF : impression polyvalente pour petites séries. Multi-couleurs, dégradés, tous textiles.',
  },
};

const FAQ = [
  {
    q: 'Qu\'est-ce que le DTF exactement ?',
    a: 'DTF signifie "Direct to Film". Le visuel est d\'abord imprimé sur un film PET transparent, puis recouvert d\'une poudre adhésive thermofusible. Le transfert est ensuite pressé à chaud sur le textile. Le résultat : un marquage opaque, détaillé et souple.',
  },
  {
    q: 'Le DTF tient-il au lavage ?',
    a: 'Oui, le DTF de qualité professionnelle résiste à 40-60°C en machine. La durabilité est comparable à la sérigraphie. Il est recommandé de laver à l\'envers et d\'éviter le sèche-linge pour maximiser la longévité.',
  },
  {
    q: 'Sur quels textiles peut-on appliquer du DTF ?',
    a: 'C\'est le grand avantage du DTF : il adhère sur pratiquement tous les textiles — coton, polyester, mélanges, nylon, jean, toile de sac. C\'est la technique la plus polyvalente pour les supports difficiles.',
  },
  {
    q: 'DTF ou DTG, quelle différence ?',
    a: 'Le DTF imprime sur un film puis transfère sur le textile. Le DTG imprime directement sur le tissu. Le DTF est plus polyvalent (tous textiles) et moins cher. Le DTG offre un toucher plus doux (pas de film) mais ne fonctionne bien que sur le coton.',
  },
  {
    q: 'Quel est le minimum de commande en DTF ?',
    a: 'À partir de 10 pièces. C\'est l\'un des avantages du DTF : pas de frais fixes (pas d\'écran comme en sérigraphie, pas de digitalisation comme en broderie). Le prix unitaire est le même que vous commandiez 10 ou 100 pièces.',
  },
];

export default function DTFPage() {
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
        <span className="text-slate-600">Transfert DTF</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎨</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            Transfert DTF
          </h1>
        </div>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          La technique la plus polyvalente. Multi-couleurs, dégradés, photos —
          le DTF imprime tout, sur presque tout, sans minimum élevé.
        </p>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">10+</p>
              <p className="text-xs text-slate-500 mt-1">pièces minimum</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">7-10j</p>
              <p className="text-xs text-slate-500 mt-1">délai moyen</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">Illimité</p>
              <p className="text-xs text-slate-500 mt-1">nombre de couleurs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">~3,50€</p>
              <p className="text-xs text-slate-500 mt-1">/ pièce (format A5)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Comment fonctionne le DTF ?</h2>
            <p>
              Le processus DTF se déroule en 3 étapes : <strong>impression</strong> du visuel en CMJN + blanc
              sur un film PET transparent, <strong>poudrage</strong> d&apos;une colle thermofusible sur l&apos;encre
              encore humide, puis <strong>pressage à chaud</strong> (160°C, 15 secondes) sur le textile.
            </p>
            <p className="mt-3">
              La couche de blanc sous les couleurs garantit l&apos;opacité du visuel même sur les textiles foncés.
              C&apos;est ce qui rend le DTF si polyvalent : contrairement à la sérigraphie qui nécessite des
              encres spéciales pour le textile noir, le DTF rend aussi bien sur un t-shirt blanc que marine.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Quand choisir le DTF ?</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Petites séries</strong> (10-50 pièces) — pas de frais fixes</li>
              <li><strong>Visuels complexes</strong> — dégradés, photos, logos multi-couleurs</li>
              <li><strong>Textiles variés</strong> — coton, polyester, nylon, jean, même les sacs</li>
              <li><strong>Textile foncé</strong> — sous-couche blanche intégrée</li>
              <li><strong>Tests / prototypes</strong> — avant de passer en sérigraphie pour les gros volumes</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">DTF vs sérigraphie</h2>
            <p>
              Le <strong>DTF</strong> l&apos;emporte en dessous de 50 pièces et pour les visuels multi-couleurs.
              La <strong><Link href="/marquage/serigraphie" className="text-neutral-900 underline underline-offset-2">sérigraphie</Link></strong> reste
              imbattable au-delà de 100 pièces avec des visuels simples (1-3 couleurs).
            </p>
            <p className="mt-3">
              En termes de rendu, la sérigraphie offre un toucher plus &quot;fondu dans le tissu&quot;
              tandis que le DTF laisse un léger film en surface (comparable au flocage, mais plus fin et plus souple).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Tarification</h2>
            <p>Le prix du DTF dépend principalement de la <strong>surface imprimée</strong> :</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Format coeur (A6, ~10×15 cm) : <strong>2,50 à 3,50 € HT / pièce</strong></li>
              <li>Format A5 (~15×21 cm) : <strong>3,50 à 5,00 € HT / pièce</strong></li>
              <li>Format A4 (~21×30 cm) : <strong>5,00 à 7,00 € HT / pièce</strong></li>
              <li>Format dos A3 (~30×42 cm) : <strong>7,00 à 10,00 € HT / pièce</strong></li>
            </ul>
            <p className="mt-3">
              Pas de frais d&apos;écran ni de digitalisation. Le prix est le même quelle que soit la quantité —
              c&apos;est ce qui rend le DTF idéal pour les petites séries.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl font-bold text-neutral-900 mb-8">Questions fréquentes — DTF</h2>
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
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Un projet en DTF ?</h2>
        <p className="text-slate-500 mb-8">Devis gratuit en 3 minutes, à partir de 10 pièces.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/configurateur" className="px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            Demander un devis DTF
          </Link>
          <Link href="/marquage" className="px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Comparer les techniques
          </Link>
        </div>
      </section>
    </main>
  );
}
