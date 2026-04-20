'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function MotDePasseOubliePage() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/compte/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-sm px-4 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Email envoyé</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Si un compte existe avec cette adresse, vous recevrez un lien pour réinitialiser votre mot de passe.
          </p>
          <Link href="/compte/connexion" className="text-sm text-neutral-900 font-medium underline underline-offset-2">
            Retour à la connexion
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Entrez votre email, nous vous envoyons un lien de réinitialisation.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link href="/compte/connexion" className="text-neutral-900 font-medium underline underline-offset-2">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
