import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impression numérique DTG — Impression directe textile | Toque2Me',
  description:
    'Impression DTG (Direct to Garment) sur t-shirts et sweats coton. Qualité photo, toucher invisible, idéal pour pièces uniques et prototypes. Devis gratuit.',
  openGraph: {
    title: 'Impression DTG textile — Toque2Me',
    description: 'Impression directe sur textile. Qualité photo-réaliste, toucher invisible.',
  },
};

const FAQ = [
  {
    q: 'Qu\'est-ce que l\'impression DTG ?',
    a: 'DTG signifie "Direct to Garment". L\'encre est projetée directement dans les fibres du textile par une imprimante à jet d\'encre spécialisée. Le résultat : un toucher quasi-invisible (pas de film en surface) et une qualité photo-réaliste.',
  },
  {
    q: 'Le DTG convient-il aux grandes séries ?',
    a: 'Non, le DTG est lent (2-3 minutes par pièce) et donc cher en volume. Au-delà de 50 pièces, la sérigraphie ou le DTF sont plus économiques. Le DTG est idéal pour les pièces uniques, prototypes et petites séries premium (1-30 pièces).',
  },
  {
    q: 'Sur quels textiles fonctionne le DTG ?',
    a: 'Le DTG fonctionne principalement sur le coton (idéalement 100% coton ou 80/20). Les textiles synthétiques (polyester, nylon) ne retiennent pas bien l\'encre DTG. Pour ces supports, le DTF est plus adapté.',
  },
  {
    q: 'Quelle est la durabilité du DTG ?',
    a: 'Correcte mais inférieure à la broderie et à la sérigraphie. L\'impression DTG résiste à 30-40 lavages en machine à 30°C. Au-delà, le visuel peut commencer à s\'estomper. Laver à l\'envers et à froid prolonge significativement la durée de vie.',
  },
  {
    q: 'Peut-on imprimer des photos en DTG ?',
    a: 'Oui, c\'est la grande force du DTG. Contrairement à la broderie (limité aux aplats) et à la sérigraphie (1 écran par couleur), le DTG imprime en CMJN et peut reproduire des photos, dégradés, aquarelles et illustrations complexes avec fidélité.',
  },
];

export default function ImpressionNumeriquePage() {
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
        <span className="text-slate-600">Impression numérique (DTG)</span>
      </nav>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🖨️</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            Impression numérique DTG
          </h1>
        </div>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          L&apos;encre directement dans la fibre. Zéro film, toucher invisible,
          qualité photo — la Rolls de l&apos;impression textile pour les petites quantités.
        </p>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">1+</p>
              <p className="text-xs text-slate-500 mt-1">pièce minimum</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">5-8j</p>
              <p className="text-xs text-slate-500 mt-1">délai moyen</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">CMJN</p>
              <p className="text-xs text-slate-500 mt-1">couleurs illimitées</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">Coton</p>
              <p className="text-xs text-slate-500 mt-1">support idéal</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Comment fonctionne le DTG ?</h2>
            <p>
              Le textile est d&apos;abord pré-traité avec un fixateur (surtout sur les tissus foncés
              pour permettre à la couche de blanc de tenir). Il est ensuite posé à plat sur le plateau
              de l&apos;imprimante qui projette l&apos;encre directement dans les fibres, exactement comme
              une imprimante jet d&apos;encre classique — mais avec des encres textile spéciales.
            </p>
            <p className="mt-3">
              Après impression, le textile passe au tunnel de séchage ou à la presse à chaud
              pour fixer l&apos;encre. Le résultat est un marquage <strong>sans épaisseur</strong> :
              au toucher, on ne sent pas l&apos;impression, contrairement au DTF ou au flocage.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Quand choisir le DTG ?</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Pièces uniques</strong> — merch artiste, cadeau personnalisé, prototype</li>
              <li><strong>Visuels photo-réalistes</strong> — illustrations détaillées, aquarelles, photos</li>
              <li><strong>T-shirts coton premium</strong> — le toucher invisible est un vrai plus</li>
              <li><strong>Tests avant production</strong> — valider un rendu avant de passer en sérigraphie</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">DTG vs DTF : le match</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4 text-slate-400 font-medium">Critère</th>
                    <th className="py-2 pr-4 font-medium">DTG</th>
                    <th className="py-2 font-medium">DTF</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-400">Toucher</td>
                    <td className="py-2 pr-4">Invisible</td>
                    <td className="py-2">Léger film</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-400">Supports</td>
                    <td className="py-2 pr-4">Coton uniquement</td>
                    <td className="py-2">Tous textiles</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-400">Durabilité</td>
                    <td className="py-2 pr-4">Moyenne</td>
                    <td className="py-2">Bonne</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-400">Prix (10 pcs)</td>
                    <td className="py-2 pr-4">~8-12 € / pièce</td>
                    <td className="py-2">~3-5 € / pièce</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-slate-400">Minimum</td>
                    <td className="py-2 pr-4">1 pièce</td>
                    <td className="py-2">10 pièces</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Tarification</h2>
            <p>Le DTG est la technique la plus chère à l&apos;unité, compensée par l&apos;absence de minimum :</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>T-shirt blanc, visuel A4 : <strong>8 à 10 € HT / pièce</strong></li>
              <li>T-shirt foncé, visuel A4 : <strong>10 à 14 € HT / pièce</strong> (pré-traitement + blanc)</li>
              <li>Sweat, visuel dos A3 : <strong>14 à 18 € HT / pièce</strong></li>
            </ul>
            <p className="mt-3">
              Pour les budgets serrés avec des visuels complexes,
              le <Link href="/marquage/dtf" className="text-neutral-900 underline underline-offset-2">DTF</Link> est
              souvent le meilleur compromis qualité/prix.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl font-bold text-neutral-900 mb-8">Questions fréquentes — DTG</h2>
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
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Un projet d&apos;impression DTG ?</h2>
        <p className="text-slate-500 mb-8">Même pour une seule pièce, on vous fait un devis.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/configurateur" className="px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            Demander un devis DTG
          </Link>
          <Link href="/marquage" className="px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Comparer les techniques
          </Link>
        </div>
      </section>
    </main>
  );
}
