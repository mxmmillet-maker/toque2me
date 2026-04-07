import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marquage textile : broderie, sérigraphie, DTF, DTG | Toque2Me',
  description:
    'Comparez les techniques de personnalisation textile : broderie, sérigraphie, transfert DTF, impression numérique DTG. Guide complet pour choisir la bonne méthode.',
  openGraph: {
    title: 'Marquage textile — Guide complet | Toque2Me',
    description:
      'Broderie, sérigraphie, DTF, DTG : quelle technique pour quel projet ? Comparatif durabilité, rendu, prix.',
  },
};

const TECHNIQUES = [
  {
    slug: 'broderie',
    label: 'Broderie',
    icon: '🧵',
    desc: 'La référence pour les polos, vestes et casquettes. Rendu premium, très durable.',
    best: 'Logos simples, tenues corporate, restauration',
    durabilite: 5,
    rendu: 5,
    prix: 3,
    minQty: '10 pièces',
  },
  {
    slug: 'serigraphie',
    label: 'Sérigraphie',
    icon: '🖌️',
    desc: 'Technique historique pour les grands volumes. Couleurs éclatantes, coût unitaire très bas.',
    best: 'T-shirts événementiels, grandes séries, visuel 1-4 couleurs',
    durabilite: 4,
    rendu: 4,
    prix: 5,
    minQty: '50 pièces',
  },
  {
    slug: 'dtf',
    label: 'Transfert DTF',
    icon: '🎨',
    desc: 'Transfert numérique polyvalent. Idéal pour les petites séries avec des visuels complexes.',
    best: 'Petites séries, logos multi-couleurs, photos, dégradés',
    durabilite: 4,
    rendu: 4,
    prix: 4,
    minQty: '10 pièces',
  },
  {
    slug: 'impression-numerique',
    label: 'Impression numérique (DTG)',
    icon: '🖨️',
    desc: 'Impression directe sur textile. Qualité photo, idéal pour les visuels très détaillés.',
    best: 'Visuels photo-réalistes, prototypes, pièces uniques',
    durabilite: 3,
    rendu: 5,
    prix: 2,
    minQty: '1 pièce',
  },
];

function Dots({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`inline-block w-2 h-2 rounded-full ${i < count ? 'bg-neutral-900' : 'bg-slate-200'}`}
        />
      ))}
    </span>
  );
}

export default function MarquagePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50/80 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-5">
            Guide marquage textile
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
            Quelle technique de<br />personnalisation choisir ?
          </h1>
          <p className="mt-6 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Broderie, sérigraphie, DTF, DTG — chaque technique a ses avantages.
            Voici comment choisir en fonction de votre projet.
          </p>
        </div>
      </section>

      {/* Comparatif */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-xl font-bold text-neutral-900 mb-8">Comparatif rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TECHNIQUES.map((t) => (
            <Link
              key={t.slug}
              href={`/marquage/${t.slug}`}
              className="group p-6 border border-slate-100 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 group-hover:underline underline-offset-2">
                    {t.label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 mb-1">Durabilité</p>
                  <Dots count={t.durabilite} />
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Rendu</p>
                  <Dots count={t.rendu} />
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Prix</p>
                  <Dots count={t.prix} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-400">Min. {t.minQty}</p>
                <p className="text-xs text-slate-400">Idéal : {t.best}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Guide de choix */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Comment choisir ?</h2>
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">1. Quelle quantité ?</h3>
              <p>
                Moins de 50 pièces : privilégiez la <strong>broderie</strong> ou le <strong>DTF</strong>.
                Plus de 50 pièces : la <strong>sérigraphie</strong> devient la plus rentable.
                Pièce unique ou prototype : <strong>DTG</strong>.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">2. Quel visuel ?</h3>
              <p>
                Logo simple (1-3 couleurs) : <strong>broderie</strong> ou <strong>sérigraphie</strong>.
                Visuel complexe, dégradés, photo : <strong>DTF</strong> ou <strong>DTG</strong>.
                Texte fin ou très petit : <strong>DTF</strong> (meilleure précision que la broderie sur les détails fins).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">3. Quel support ?</h3>
              <p>
                Coton épais (polos, sweats, vestes) : <strong>broderie</strong>.
                T-shirts fins : <strong>sérigraphie</strong> ou <strong>DTG</strong>.
                Textiles techniques ou synthétiques : <strong>DTF</strong> (adhère sur presque tout).
                Casquettes : <strong>broderie</strong> quasi-exclusivement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">4. Quel budget ?</h3>
              <p>
                Du moins cher au plus cher à l&apos;unité (pour 100 pièces) :
                sérigraphie &lt; DTF &lt; broderie &lt; DTG.
                Mais en dessous de 50 pièces, le DTF et la broderie deviennent plus compétitifs
                car la sérigraphie a des frais fixes élevés (création des écrans).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Pas sûr de la technique ?
        </h2>
        <p className="text-slate-500 mb-8">
          Décrivez votre projet, on vous recommande la meilleure option avec un devis chiffré.
        </p>
        <Link
          href="/configurateur"
          className="inline-flex items-center px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
        >
          Demander un devis gratuit
        </Link>
      </section>
    </main>
  );
}
