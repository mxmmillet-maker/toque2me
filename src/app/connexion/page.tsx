'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

type Mode = 'login' | 'signup' | 'magic';

export default function ConnexionPage() {
  const supabase = createSupabaseBrowser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect') || '/espace-client';

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        data: {
          nom,
          entreprise,
        },
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Si l'utilisateur est directement confirmé (pas de confirmation email requise)
    if (data.user && data.session) {
      // Créer la ligne dans la table clients
      await supabase.from('clients').upsert({
        id: data.user.id,
        email,
        nom,
        entreprise,
      });
      router.push(redirect);
      router.refresh();
      return;
    }

    setMessage('Un email de confirmation a été envoyé. Vérifiez votre boîte mail.');
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setMessage('Un lien de connexion a été envoyé à votre adresse email.');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Retour */}
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold text-neutral-900">
            Toque2Me
          </Link>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-neutral-200 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); setMessage(''); }}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'text-neutral-900 border-b-2 border-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              mode === 'signup'
                ? 'text-neutral-900 border-b-2 border-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Formulaire Connexion */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="vous@entreprise.com"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('magic'); setError(''); setMessage(''); }}
              className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Connexion par lien magique
            </button>
          </form>
        )}

        {/* Formulaire Inscription */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="vous@entreprise.com"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="6 caractères minimum"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Entreprise</label>
              <input
                type="text"
                value={entreprise}
                onChange={(e) => setEntreprise(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="Mon Restaurant"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>
        )}

        {/* Formulaire Magic Link */}
        {mode === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <p className="text-sm text-neutral-500">
              Entrez votre email, on vous envoie un lien de connexion.
            </p>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="vous@entreprise.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Retour à la connexion classique
            </button>
          </form>
        )}

        {/* Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}
      </div>
    </main>
  );
}
