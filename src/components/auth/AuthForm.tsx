'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [secteur, setSecteur] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nom, entreprise, secteur },
          },
        });
        if (signUpError) throw signUpError;

        // Créer le profil client
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('clients').upsert({
            id: user.id,
            email,
            nom,
            entreprise,
            secteur,
          });
        }

        router.push('/espace-client');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/espace-client');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRegister && (
        <>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Entreprise</label>
            <input
              type="text"
              value={entreprise}
              onChange={(e) => setEntreprise(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Secteur</label>
            <select
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="">Sélectionnez</option>
              <option value="restaurateur">Restauration</option>
              <option value="hotelier">Hôtellerie</option>
              <option value="btp">BTP / Chantier</option>
              <option value="entreprise">Entreprise</option>
              <option value="association">Association</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </>
      )}

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

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {loading ? '...' : isRegister ? 'Créer mon compte' : 'Se connecter'}
      </button>
    </form>
  );
}
