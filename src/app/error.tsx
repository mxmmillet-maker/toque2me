'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md text-center px-4">
        <p className="text-6xl font-bold text-neutral-200 mb-4">500</p>
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Une erreur est survenue</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Nous nous en excusons. Réessayez ou contactez-nous si le problème persiste.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
