'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EspaceClientPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [editingSecteur, setEditingSecteur] = useState(false);
  const [secteur, setSecteur] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        // Le middleware devrait déjà rediriger, mais double sécurité
        router.push('/connexion?redirect=/espace-client');
        return;
      }

      setUser(data.user);

      supabase
        .from('clients')
        .select('*')
        .eq('id', data.user.id)
        .single()
        .then(({ data: c }) => {
          setClient(c);
          setSecteur(c?.secteur || '');
        });

      supabase
        .from('quotes')
        .select('id, created_at, statut, total_ht, share_token, lignes')
        .eq('client_id', data.user.id)
        .order('created_at', { ascending: false })
        .then(({ data: q }) => setQuotes(q || []));

      setLoading(false);
    });
  }, []);

  const updateSecteur = async (newSecteur: string) => {
    if (!user) return;
    await supabase.from('clients').update({ secteur: newSecteur }).eq('id', user.id);
    setSecteur(newSecteur);
    setEditingSecteur(false);
  };

  const reorder = (quote: any) => {
    const lignes = quote.lignes || [];
    if (lignes.length > 0) {
      window.location.href = `/calculateur?ref=${lignes[0].ref}`;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Mon espace</h1>
            <p className="text-sm text-neutral-500">{user?.email}</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
              router.refresh();
            }}
            className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
          >
            Déconnexion
          </button>
        </div>

        {/* Profil */}
        <div className="bg-neutral-50 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">Mon profil</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Nom</span>
              <p className="font-medium text-neutral-900">{client?.nom || '—'}</p>
            </div>
            <div>
              <span className="text-neutral-500">Entreprise</span>
              <p className="font-medium text-neutral-900">{client?.entreprise || '—'}</p>
            </div>
            <div>
              <span className="text-neutral-500">Secteur</span>
              {editingSecteur ? (
                <div className="flex gap-2 mt-1">
                  <select
                    value={secteur}
                    onChange={(e) => setSecteur(e.target.value)}
                    className="text-sm border border-neutral-200 rounded-lg px-2 py-1"
                  >
                    <option value="">—</option>
                    <option value="restaurateur">Restauration</option>
                    <option value="hotelier">Hôtellerie</option>
                    <option value="btp">BTP</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="association">Association</option>
                  </select>
                  <button onClick={() => updateSecteur(secteur)} className="text-xs text-neutral-900 underline">OK</button>
                </div>
              ) : (
                <p className="font-medium text-neutral-900">
                  {secteur || '—'}
                  <button onClick={() => setEditingSecteur(true)} className="ml-2 text-xs text-neutral-400 underline">modifier</button>
                </p>
              )}
            </div>
            <div>
              <span className="text-neutral-500">Logo</span>
              {client?.logo_url ? (
                <img src={client.logo_url} alt="Logo" className="w-12 h-12 object-contain mt-1" />
              ) : (
                <p className="text-xs text-neutral-400 mt-1">Pas encore de logo</p>
              )}
            </div>
          </div>
        </div>

        {/* Devis */}
        <h2 className="text-lg font-medium text-neutral-900 mb-4">Mes devis</h2>

        {quotes.length === 0 ? (
          <div className="py-12 text-center border border-neutral-100 rounded-xl">
            <p className="text-neutral-400 text-sm mb-4">Aucun devis pour le moment</p>
            <Link
              href="/catalogue"
              className="text-sm text-neutral-900 font-medium underline underline-offset-2"
            >
              Parcourir le catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => {
              const lignes = q.lignes || [];
              const premierProduit = lignes[0]?.nom || 'Devis';
              const nbProduits = lignes.length;
              return (
                <div key={q.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {premierProduit}
                      {nbProduits > 1 && <span className="text-neutral-400"> +{nbProduits - 1} autre{nbProduits > 2 ? 's' : ''}</span>}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(q.created_at).toLocaleDateString('fr-FR')} — {q.statut}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                      {(Number(q.total_ht) * 1.2).toFixed(2)} € TTC
                    </span>
                    <a
                      href={`/api/devis/pdf?token=${q.share_token}`}
                      target="_blank"
                      className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      PDF
                    </a>
                    <button
                      onClick={() => reorder(q)}
                      className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      Recommander
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
