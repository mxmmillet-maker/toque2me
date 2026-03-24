import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

const GUIDES: Record<string, { title: string; secteur: string; normes: string[]; content: string[] }> = {
  restauration: {
    title: 'Guide des normes vestimentaires en restauration',
    secteur: 'restaurateur',
    normes: ['HACCP'],
    content: [
      'La méthode HACCP (Hazard Analysis Critical Control Point) impose des règles strictes sur les vêtements portés en zone de préparation alimentaire.',
      'Les vêtements doivent être de couleur claire pour détecter les salissures, lavables à 60°C minimum, et changés quotidiennement. Les tabliers doivent résister aux projections et être facilement nettoyables.',
      'Le port de bijoux, montres et bagues est interdit en cuisine. Les chaussures doivent être fermées et antidérapantes.',
      'Les coiffes (toques, calots, charlottes) sont obligatoires pour tout le personnel en contact avec les aliments.',
    ],
  },
  electricien: {
    title: 'Guide des normes vestimentaires pour électriciens',
    secteur: 'electricien',
    normes: ['EN 1149-5'],
    content: [
      'La norme EN 1149-5 impose le port de vêtements antistatiques pour tout travail en atmosphère explosible (ATEX) ou à proximité d\'installations électriques sous tension.',
      'Le tissu doit dissiper les charges électrostatiques pour prévenir tout risque d\'étincelle. Il est testé selon la norme EN 1149-1 (résistivité de surface).',
      'Les vêtements synthétiques sont proscrits sous les équipements antistatiques — ils peuvent générer des charges et annuler la protection.',
      'L\'employeur est responsable de fournir des EPI conformes et de s\'assurer de leur bon état. Un contrôle régulier est obligatoire.',
    ],
  },
  chantier: {
    title: 'Guide haute visibilité pour le BTP',
    secteur: 'btp',
    normes: ['EN ISO 20471'],
    content: [
      'La norme EN ISO 20471 définit 3 classes de visibilité. En BTP, la classe 2 minimum est requise pour le torse — la classe 3 est recommandée en bord de route.',
      'Le matériau fluorescent (jaune, orange ou rouge) doit couvrir une surface minimale : 0,50 m² pour la classe 2, 0,80 m² pour la classe 3.',
      'Les bandes rétro-réfléchissantes doivent encercler le torse et être visibles à 360°. Elles perdent leur efficacité après environ 50 lavages industriels.',
      'Attention : la personnalisation (logo, broderie) ne doit pas réduire la surface de matériau fluorescent ou réfléchissant en dessous des seuils normatifs.',
    ],
  },
};

export async function generateMetadata({ params }: { params: { metier: string } }): Promise<Metadata> {
  const guide = GUIDES[params.metier];
  if (!guide) return { title: 'Guide introuvable — Toque2Me' };
  return {
    title: `${guide.title} — Toque2Me`,
    description: guide.content[0],
  };
}

export function generateStaticParams() {
  return Object.keys(GUIDES).map((metier) => ({ metier }));
}

export default function GuidePage({ params }: { params: { metier: string } }) {
  const guide = GUIDES[params.metier];
  if (!guide) return notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <nav className="mb-8 text-sm text-neutral-400">
          <Link href="/" className="hover:text-neutral-700 transition-colors">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">Guide {params.metier}</span>
        </nav>

        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{guide.title}</h1>
        <div className="flex gap-2 mb-8">
          {guide.normes.map((n) => (
            <span key={n} className="px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded">{n}</span>
          ))}
        </div>

        <div className="space-y-6 text-neutral-600 leading-relaxed">
          {guide.content.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-12 p-6 bg-neutral-50 rounded-2xl text-center">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Besoin de vêtements conformes ?
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Configurez votre commande en 3 minutes, conformité incluse.
          </p>
          <Link
            href={`/configurateur`}
            className="inline-flex items-center px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Configurer maintenant
          </Link>
        </div>
      </div>
    </main>
  );
}
