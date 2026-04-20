'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) { setError('6 caractères minimum'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push('/espace-client'), 2000);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-14 h-14 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Mot de passe modifié</h1>
          <p className="text-sm text-neutral-500">Redirection vers votre espace client...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-neutral-500">Choisissez votre nouveau mot de passe.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Confirmer</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
              minLength={6}
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
            {loading ? 'Modification...' : 'Modifier mon mot de passe'}
          </button>
        </form>
      </div>
    </main>
  );
}
