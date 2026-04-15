import Link from 'next/link';

export default function PaiementSuccesPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md text-center px-4">
        <div className="w-16 h-16 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Paiement confirmé</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Votre commande a été enregistrée. Vous recevrez un email de confirmation
          avec le suivi de votre production.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/espace-client"
            className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Mon espace client
          </Link>
          <Link
            href="/catalogue"
            className="px-6 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </main>
  );
}
