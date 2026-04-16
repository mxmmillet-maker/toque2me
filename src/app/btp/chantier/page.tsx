import Link from 'next/link';
import { OpenChatWithContextButton } from '@/components/home/OpenChatWithContextButton';

export default function ChantierPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <nav className="mb-8 text-sm text-neutral-400">
          <Link href="/btp" className="hover:text-neutral-700 transition-colors">BTP</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">Chantier & Voirie</span>
        </nav>

        <h1 className="text-3xl font-bold text-neutral-900 mb-4">
          Haute visibilité chantier — norme EN ISO 20471
        </h1>
        <p className="text-neutral-500 mb-8">
          Classe 2 minimum pour le torse. Personnalisés avec votre logo d&apos;entreprise.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-amber-900 mb-2">Norme EN ISO 20471 — Ce qu&apos;il faut savoir</h2>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Classe 1 : accessoires (brassards) — surface réfléchissante minimale</li>
            <li>Classe 2 : gilets, polos HV — obligatoire sur chantier</li>
            <li>Classe 3 : combinaisons complètes — zones à haut risque routier</li>
            <li>Le matériau fluorescent doit couvrir au minimum 0,50 m² (classe 2)</li>
            <li>Les bandes rétro-réfléchissantes doivent encercler le torse</li>
          </ul>
        </div>

        <OpenChatWithContextButton
          label="Configurer mes vêtements haute visibilité"
          secteur="btp"
          metier="conducteur_engins"
          occasion="workwear"
        />
      </div>
    </main>
  );
}
