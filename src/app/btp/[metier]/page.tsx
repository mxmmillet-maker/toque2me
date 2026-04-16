import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OpenChatWithContextButton } from '@/components/home/OpenChatWithContextButton';

interface MetierConfig {
  label: string;
  metier_key: string;  // clé dans normes.ts
  normes: { code: string; label: string; details: string[] }[];
  description: string;
  icon: string;
}

const METIERS: Record<string, MetierConfig> = {
  maconnerie: {
    label: 'Maçonnerie / Gros œuvre',
    metier_key: 'macon',
    icon: '🧱',
    description: 'Vêtements robustes pour chantier — haute visibilité et protection générale.',
    normes: [
      { code: 'EN ISO 20471', label: 'Haute visibilité', details: ['Classe 2 minimum sur chantier', 'Bandes rétro-réfléchissantes obligatoires'] },
      { code: 'EN ISO 13688', label: 'Protection générale', details: ['Confort, innocuité, solidité des coutures', 'Résistance aux accrocs et à l\'abrasion'] },
    ],
  },
  couverture: {
    label: 'Couverture / Charpente',
    metier_key: 'couvreur',
    icon: '🏠',
    description: 'Travail en hauteur — harnais antichute et haute visibilité obligatoires.',
    normes: [
      { code: 'EN 361', label: 'Harnais antichute', details: ['Obligatoire pour tout travail en hauteur > 3m', 'Vérification annuelle obligatoire'] },
      { code: 'EN ISO 20471', label: 'Haute visibilité', details: ['Classe 2 recommandée sur toit'] },
    ],
  },
  plomberie: {
    label: 'Plomberie / Chauffage',
    metier_key: 'plombier',
    icon: '🔧',
    description: 'Vêtements techniques résistants aux contraintes du chantier.',
    normes: [
      { code: 'EN ISO 13688', label: 'Protection générale', details: ['Résistance abrasion et accrocs', 'Nombreuses poches utilitaires'] },
    ],
  },
  peinture: {
    label: 'Peinture / Plâtrerie',
    metier_key: 'peintre',
    icon: '🎨',
    description: 'Protection contre les éclaboussures de peinture et produits liquides.',
    normes: [
      { code: 'EN 13034', label: 'Protection chimique Type 6', details: ['Protection contre éclaboussures et brouillards', 'Résistance aux produits liquides'] },
      { code: 'EN ISO 13688', label: 'Protection générale', details: ['Confort et durabilité'] },
    ],
  },
  soudure: {
    label: 'Soudure / Métallerie',
    metier_key: 'soudeur',
    icon: '🔥',
    description: 'Protection contre la chaleur, les flammes et les projections de métal fondu.',
    normes: [
      { code: 'EN ISO 11612', label: 'Chaleur et flammes', details: ['Ne fond pas, ne s\'enflamme pas', 'Ne se rétracte pas sous la chaleur'] },
      { code: 'EN ISO 11611', label: 'Protection soudeur', details: ['Classe 1 : soudure manuelle légère', 'Classe 2 : soudure lourde / conditions agressives'] },
    ],
  },
  menuiserie: {
    label: 'Menuiserie / Charpentier',
    metier_key: 'menuisier',
    icon: '🪵',
    description: 'Vêtements robustes pour le travail du bois — confort et résistance aux accrocs.',
    normes: [
      { code: 'EN ISO 13688', label: 'Protection générale', details: ['Solidité des coutures renforcées', 'Résistance aux accrocs et abrasions'] },
    ],
  },
  'conducteur-engins': {
    label: 'Conducteur d\'engins',
    metier_key: 'conducteur_engins',
    icon: '🚜',
    description: 'Haute visibilité pour descendre de l\'engin en sécurité sur chantier.',
    normes: [
      { code: 'EN ISO 20471', label: 'Haute visibilité', details: ['Classe 2 minimum', 'Obligatoire à chaque descente de cabine'] },
    ],
  },
  paysagiste: {
    label: 'Paysagiste / Espaces verts',
    metier_key: 'paysagiste',
    icon: '🌳',
    description: 'Haute visibilité + protection tronçonneuse si utilisation d\'outils coupants.',
    normes: [
      { code: 'EN ISO 20471', label: 'Haute visibilité', details: ['Bord de route et zones publiques'] },
      { code: 'EN 381', label: 'Protection tronçonneuse', details: ['Classe 1 : 20 m/s', 'Classe 2 : 24 m/s'] },
    ],
  },
};

export default function BTPMetierPage({ params }: { params: { metier: string } }) {
  const config = METIERS[params.metier];
  if (!config) return notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <nav className="mb-8 text-sm text-neutral-400">
          <Link href="/btp" className="hover:text-neutral-700 transition-colors">BTP</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">{config.label}</span>
        </nav>

        <div className="flex items-start gap-4 mb-6">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              {config.label}
            </h1>
            <p className="text-neutral-500 mt-2">{config.description}</p>
          </div>
        </div>

        {/* Normes applicables */}
        <div className="space-y-4 mb-8">
          {config.normes.map((n) => (
            <div key={n.code} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-amber-900 px-2 py-0.5 bg-amber-100 rounded">{n.code}</span>
                <h2 className="text-sm font-semibold text-amber-900">{n.label}</h2>
              </div>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                {n.details.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <OpenChatWithContextButton
          label={`Configurer mes vêtements ${config.label.toLowerCase()}`}
          secteur="btp"
          metier={config.metier_key}
          occasion="workwear"
        />
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return Object.keys(METIERS).map(metier => ({ metier }));
}

export const dynamicParams = false;
