import Link from 'next/link';

export default function PaiementAnnulePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md text-center px-4">
        <div className="w-16 h-16 mx-auto mb-6 bg-amber-50 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Paiement annulé</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Votre paiement n&apos;a pas été finalisé. Votre devis reste disponible — vous pouvez
          réessayer à tout moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {searchParams.token && (
            <Link
              href={`/devis/${searchParams.token}`}
              className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Retour au devis
            </Link>
          )}
          <Link
            href="/catalogue"
            className="px-6 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Parcourir le catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
