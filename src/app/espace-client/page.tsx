'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Tab = 'devis' | 'profil' | 'projets' | 'adresses';

interface Adresse {
  id: string;
  label: string;
  nom: string;
  rue: string;
  complement: string;
  cp: string;
  ville: string;
  pays: string;
  telephone: string;
  instructions: string;
  par_defaut: boolean;
  created_at: string;
}

export default function EspaceClientPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [adresses, setAdresses] = useState<Adresse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('devis');

  // Profil form
  const [form, setForm] = useState({ nom: '', entreprise: '', secteur: '', telephone: '', siret: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Projet form
  const [newProject, setNewProject] = useState({ nom: '', secteur: '', notes: '' });
  const [creatingProject, setCreatingProject] = useState(false);

  // Adresse form
  const emptyAdresse = { label: '', nom: '', rue: '', complement: '', cp: '', ville: '', pays: 'France', telephone: '', instructions: '' };
  const [newAdresse, setNewAdresse] = useState(emptyAdresse);
  const [showAdresseForm, setShowAdresseForm] = useState(false);
  const [savingAdresse, setSavingAdresse] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
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
          if (c) setForm({
            nom: c.nom || '',
            entreprise: c.entreprise || '',
            secteur: c.secteur || '',
            telephone: c.telephone || '',
            siret: c.siret || '',
          });
        });

      supabase
        .from('quotes')
        .select('id, created_at, statut, total_ht, share_token, lignes')
        .eq('client_id', data.user.id)
        .order('created_at', { ascending: false })
        .then(({ data: q }) => setQuotes(q || []));

      supabase
        .from('client_projects')
        .select('*')
        .eq('client_id', data.user.id)
        .order('created_at', { ascending: false })
        .then(({ data: p }) => setProjects(p || []));

      supabase
        .from('client_adresses')
        .select('*')
        .eq('client_id', data.user.id)
        .order('par_defaut', { ascending: false })
        .order('created_at', { ascending: false })
        .then(({ data: a }) => setAdresses((a as Adresse[]) || []));

      setLoading(false);
    });
  }, []);

  const saveProfil = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('clients').update({
      nom: form.nom,
      entreprise: form.entreprise,
      secteur: form.secteur,
      telephone: form.telephone,
      siret: form.siret,
    }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const createProject = async () => {
    if (!user || !newProject.nom.trim()) return;
    setCreatingProject(true);
    const { data } = await supabase
      .from('client_projects')
      .insert({ client_id: user.id, nom: newProject.nom, secteur: newProject.secteur, notes: newProject.notes })
      .select()
      .single();
    if (data) setProjects(prev => [data, ...prev]);
    setNewProject({ nom: '', secteur: '', notes: '' });
    setCreatingProject(false);
  };

  const deleteProject = async (id: string) => {
    await supabase.from('client_projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const createAdresse = async () => {
    if (!user || !newAdresse.label.trim() || !newAdresse.rue.trim() || !newAdresse.cp.trim() || !newAdresse.ville.trim()) return;
    setSavingAdresse(true);
    const isFirst = adresses.length === 0;
    const { data } = await supabase
      .from('client_adresses')
      .insert({ client_id: user.id, ...newAdresse, par_defaut: isFirst })
      .select()
      .single();
    if (data) setAdresses(prev => [data as Adresse, ...prev]);
    setNewAdresse(emptyAdresse);
    setShowAdresseForm(false);
    setSavingAdresse(false);
  };

  const deleteAdresse = async (id: string) => {
    await supabase.from('client_adresses').delete().eq('id', id);
    setAdresses(prev => prev.filter(a => a.id !== id));
  };

  const setDefaultAdresse = async (id: string) => {
    if (!user) return;
    // Reset all, then set the chosen one
    await supabase.from('client_adresses').update({ par_defaut: false }).eq('client_id', user.id);
    await supabase.from('client_adresses').update({ par_defaut: true }).eq('id', id);
    setAdresses(prev => prev.map(a => ({ ...a, par_defaut: a.id === id })));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Chargement...</p>
      </main>
    );
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'devis', label: 'Mes devis', count: quotes.length },
    { key: 'projets', label: 'Mes projets', count: projects.length },
    { key: 'adresses', label: 'Adresses', count: adresses.length },
    { key: 'profil', label: 'Mon profil' },
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-neutral-100">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-neutral-100 text-neutral-500 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ TAB: DEVIS ═══ */}
        {tab === 'devis' && (
          <>
            {quotes.length === 0 ? (
              <div className="py-16 text-center border border-neutral-100 rounded-xl">
                <svg className="mx-auto h-10 w-10 text-neutral-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-neutral-400 text-sm mb-4">Aucun devis pour le moment</p>
                <Link href="/catalogue" className="text-sm text-neutral-900 font-medium underline underline-offset-2">
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
                        <Link
                          href={`/devis/${q.share_token}`}
                          className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                        >
                          Voir
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══ TAB: PROFIL ═══ */}
        {tab === 'profil' && (
          <div className="max-w-lg space-y-5">
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Nom complet</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Entreprise</label>
              <input
                value={form.entreprise}
                onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Secteur</label>
                <select
                  value={form.secteur}
                  onChange={(e) => setForm({ ...form, secteur: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="">—</option>
                  <option value="restaurateur">Restauration / CHR</option>
                  <option value="hotelier">Hôtellerie</option>
                  <option value="btp">BTP / Artisan</option>
                  <option value="entreprise">Entreprise / Corporate</option>
                  <option value="association">Association / Club</option>
                  <option value="evenementiel">Événementiel</option>
                  <option value="sante">Santé / Beauté</option>
                  <option value="commerce">Commerce / Retail</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Téléphone</label>
                <input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">SIRET</label>
              <input
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                placeholder="123 456 789 00012"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <button
              onClick={saveProfil}
              disabled={saving}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              } disabled:opacity-50`}
            >
              {saved ? 'Enregistré' : saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>

            <div className="pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400">
                Email : {user?.email} — <span className="text-neutral-300">non modifiable</span>
              </p>
            </div>
          </div>
        )}

        {/* ═══ TAB: PROJETS ═══ */}
        {tab === 'projets' && (
          <div className="space-y-6">
            {/* Créer un projet */}
            <div className="bg-neutral-50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-neutral-900 mb-3">Nouveau projet / client final</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={newProject.nom}
                  onChange={(e) => setNewProject({ ...newProject, nom: e.target.value })}
                  placeholder="Nom du projet ou client"
                  className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <select
                  value={newProject.secteur}
                  onChange={(e) => setNewProject({ ...newProject, secteur: e.target.value })}
                  className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="">Secteur</option>
                  <option value="restauration">Restauration</option>
                  <option value="hotellerie">Hôtellerie</option>
                  <option value="btp">BTP</option>
                  <option value="corporate">Corporate</option>
                  <option value="evenementiel">Événementiel</option>
                  <option value="sport">Sport / Club</option>
                  <option value="autre">Autre</option>
                </select>
                <button
                  onClick={createProject}
                  disabled={creatingProject || !newProject.nom.trim()}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingProject ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>

            {/* Liste projets */}
            {projects.length === 0 ? (
              <div className="py-12 text-center border border-neutral-100 rounded-xl">
                <p className="text-neutral-400 text-sm">
                  Créez votre premier projet pour organiser vos commandes par client final.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{p.nom}</p>
                      <p className="text-xs text-neutral-400">
                        {p.secteur && <span className="capitalize">{p.secteur}</span>}
                        {p.secteur && ' — '}
                        {new Date(p.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      {p.notes && <p className="text-xs text-neutral-500 mt-1">{p.notes}</p>}
                    </div>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="text-xs text-neutral-400 hover:text-red-500 transition-colors p-2"
                      title="Supprimer"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: ADRESSES ═══ */}
        {tab === 'adresses' && (
          <div className="space-y-6">
            {/* Bouton ajouter */}
            {!showAdresseForm && (
              <button
                onClick={() => setShowAdresseForm(true)}
                className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                + Ajouter une adresse
              </button>
            )}

            {/* Formulaire */}
            {showAdresseForm && (
              <div className="bg-neutral-50 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-neutral-900">Nouvelle adresse de livraison</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Nom de l'adresse *</label>
                    <input
                      value={newAdresse.label}
                      onChange={(e) => setNewAdresse({ ...newAdresse, label: e.target.value })}
                      placeholder="Ex: Siège, Restaurant Bordeaux, Entrepôt..."
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Destinataire</label>
                    <input
                      value={newAdresse.nom}
                      onChange={(e) => setNewAdresse({ ...newAdresse, nom: e.target.value })}
                      placeholder="Nom du destinataire"
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Adresse *</label>
                  <input
                    value={newAdresse.rue}
                    onChange={(e) => setNewAdresse({ ...newAdresse, rue: e.target.value })}
                    placeholder="Numéro et nom de rue"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Complément</label>
                  <input
                    value={newAdresse.complement}
                    onChange={(e) => setNewAdresse({ ...newAdresse, complement: e.target.value })}
                    placeholder="Bâtiment, étage, code d'accès..."
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Code postal *</label>
                    <input
                      value={newAdresse.cp}
                      onChange={(e) => setNewAdresse({ ...newAdresse, cp: e.target.value })}
                      placeholder="33000"
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Ville *</label>
                    <input
                      value={newAdresse.ville}
                      onChange={(e) => setNewAdresse({ ...newAdresse, ville: e.target.value })}
                      placeholder="Bordeaux"
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Pays</label>
                    <input
                      value={newAdresse.pays}
                      onChange={(e) => setNewAdresse({ ...newAdresse, pays: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Téléphone livraison</label>
                    <input
                      value={newAdresse.telephone}
                      onChange={(e) => setNewAdresse({ ...newAdresse, telephone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Instructions de livraison</label>
                    <input
                      value={newAdresse.instructions}
                      onChange={(e) => setNewAdresse({ ...newAdresse, instructions: e.target.value })}
                      placeholder="Sonner au 2e, livrer avant 10h..."
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createAdresse}
                    disabled={savingAdresse || !newAdresse.label.trim() || !newAdresse.rue.trim() || !newAdresse.cp.trim() || !newAdresse.ville.trim()}
                    className="px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                  >
                    {savingAdresse ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => { setShowAdresseForm(false); setNewAdresse(emptyAdresse); }}
                    className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Liste adresses */}
            {adresses.length === 0 && !showAdresseForm ? (
              <div className="py-12 text-center border border-neutral-100 rounded-xl">
                <p className="text-neutral-400 text-sm">
                  Enregistrez vos adresses de livraison pour gagner du temps sur vos prochaines commandes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {adresses.map((a) => (
                  <div key={a.id} className={`p-4 border rounded-xl transition-colors ${a.par_defaut ? 'border-neutral-900 bg-neutral-50/50' : 'border-neutral-100 hover:border-neutral-200'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {a.label}
                          {a.par_defaut && (
                            <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-neutral-900 text-white rounded-full">
                              Par défaut
                            </span>
                          )}
                        </p>
                        {a.nom && <p className="text-xs text-neutral-500 mt-0.5">{a.nom}</p>}
                        <p className="text-sm text-neutral-600 mt-1">
                          {a.rue}
                          {a.complement && <span>, {a.complement}</span>}
                        </p>
                        <p className="text-sm text-neutral-600">{a.cp} {a.ville}{a.pays !== 'France' ? `, ${a.pays}` : ''}</p>
                        {a.telephone && <p className="text-xs text-neutral-400 mt-1">{a.telephone}</p>}
                        {a.instructions && <p className="text-xs text-neutral-400 italic">{a.instructions}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!a.par_defaut && (
                          <button
                            onClick={() => setDefaultAdresse(a.id)}
                            className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
                          >
                            Par défaut
                          </button>
                        )}
                        <button
                          onClick={() => deleteAdresse(a.id)}
                          className="text-neutral-400 hover:text-red-500 p-1"
                          title="Supprimer"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
