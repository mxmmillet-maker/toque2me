import Link from 'next/link';

export default function ElectriciensPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <nav className="mb-8 text-sm text-neutral-400">
          <Link href="/btp" className="hover:text-neutral-700 transition-colors">BTP</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">Électriciens</span>
        </nav>

        <h1 className="text-3xl font-bold text-neutral-900 mb-4">
          Vêtements pour électriciens — norme EN 1149-5
        </h1>
        <p className="text-neutral-500 mb-8">
          Protection antistatique obligatoire en environnement ATEX.
          Tous nos produits sont conformes et personnalisables avec votre logo.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-amber-900 mb-2">Norme EN 1149-5 — Ce qu&apos;il faut savoir</h2>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Dissipation des charges électrostatiques pour prévenir les étincelles</li>
            <li>Obligatoire en zone ATEX (atmosphères explosives)</li>
            <li>Le tissu doit être testé selon EN 1149-1 (résistivité de surface)</li>
            <li>Ne pas porter de vêtements synthétiques en dessous</li>
          </ul>
        </div>

        <Link
          href="/configurateur"
          className="inline-flex items-center px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Configurer mes vêtements conformes EN 1149-5
        </Link>
      </div>
    </main>
  );
}
