'use client';

import { useState } from 'react';
import { updateMargin, updateQuoteStatut, deleteQuote, deleteClient, updateOrderStatut, updateOrderTracking } from '@/app/admin/actions';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminData {
  totalProducts: number;
  activeProducts: number;
  totalQuotes: number;
  totalClients: number;
  syncLogs: any[];
  margins: any[];
  quotes: any[];
  clients: any[];
  orders: any[];
}

type Tab = 'kpi' | 'commandes' | 'devis' | 'clients' | 'marges' | 'sync';

const TABS: { key: Tab; label: string }[] = [
  { key: 'kpi', label: 'Dashboard' },
  { key: 'commandes', label: 'Commandes' },
  { key: 'devis', label: 'Devis' },
  { key: 'clients', label: 'Clients' },
  { key: 'marges', label: 'Marges' },
  { key: 'sync', label: 'Sync logs' },
];

const ORDER_STATUTS = ['en_attente', 'commande_fournisseur', 'en_production', 'bat_envoye', 'bat_valide', 'en_marquage', 'expedie', 'livre'];

const ORDER_STATUT_COLORS: Record<string, string> = {
  en_attente: 'bg-neutral-100 text-neutral-600',
  commande_fournisseur: 'bg-blue-50 text-blue-700',
  en_production: 'bg-indigo-50 text-indigo-700',
  bat_envoye: 'bg-purple-50 text-purple-700',
  bat_valide: 'bg-violet-50 text-violet-700',
  en_marquage: 'bg-amber-50 text-amber-700',
  expedie: 'bg-cyan-50 text-cyan-700',
  livre: 'bg-emerald-50 text-emerald-700',
};

const STATUT_COLORS: Record<string, string> = {
  brouillon: 'bg-neutral-100 text-neutral-600',
  envoye: 'bg-blue-50 text-blue-700',
  accepte: 'bg-emerald-50 text-emerald-700',
  refuse: 'bg-red-50 text-red-700',
  expire: 'bg-amber-50 text-amber-700',
};

const STATUT_OPTIONS = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-semibold text-neutral-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export function AdminDashboard({ data }: { data: AdminData }) {
  const [tab, setTab] = useState<Tab>('kpi');
  const [quotes, setQuotes] = useState(data.quotes);
  const [clients, setClients] = useState(data.clients);
  const [margins, setMargins] = useState(data.margins);
  const [ordersList, setOrdersList] = useState(data.orders);
  const [saving, setSaving] = useState(false);

  // ── Actions ──

  const handleStatutChange = async (quoteId: string, statut: string) => {
    setSaving(true);
    const res = await updateQuoteStatut(quoteId, statut);
    if (res.ok) setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, statut } : q));
    setSaving(false);
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Supprimer ce devis ?')) return;
    const res = await deleteQuote(quoteId);
    if (res.ok) setQuotes(prev => prev.filter(q => q.id !== quoteId));
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Supprimer ce client et tous ses devis ?')) return;
    const res = await deleteClient(clientId);
    if (res.ok) setClients(prev => prev.filter(c => c.id !== clientId));
  };

  const handleOrderStatut = async (orderId: string, statut: string) => {
    setSaving(true);
    const res = await updateOrderStatut(orderId, statut);
    if (res.ok) setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, statut } : o));
    setSaving(false);
  };

  const handleMarginUpdate = async (id: string, field: string, value: number) => {
    setSaving(true);
    const res = await updateMargin(id, field, value);
    if (res.ok) setMargins(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    setSaving(false);
  };

  // ── KPIs calculés ──

  const devisAcceptes = quotes.filter(q => q.statut === 'accepte').length;
  const caTotal = quotes.filter(q => q.statut === 'accepte').reduce((s, q) => s + Number(q.total_ht || 0), 0);
  const devis7j = quotes.filter(q => new Date(q.created_at) > new Date(Date.now() - 7 * 86400000)).length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t.label}
            {t.key === 'commandes' && <span className="ml-1.5 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">{ordersList.length}</span>}
            {t.key === 'devis' && <span className="ml-1.5 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">{quotes.length}</span>}
            {t.key === 'clients' && <span className="ml-1.5 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">{clients.length}</span>}
          </button>
        ))}
        {saving && <span className="self-center ml-auto text-xs text-neutral-400">Sauvegarde...</span>}
      </div>

      {/* ═══ KPI ═══ */}
      {tab === 'kpi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Produits actifs" value={data.activeProducts} sub={`/ ${data.totalProducts} total`} />
            <StatCard label="Devis total" value={data.totalQuotes} sub={`${devis7j} cette semaine`} />
            <StatCard label="Devis acceptés" value={devisAcceptes} />
            <StatCard label="CA accepté" value={formatMoney(caTotal)} sub="HT" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Clients inscrits" value={data.totalClients} />
            <StatCard label="Dernier sync" value={
              data.syncLogs.length > 0 ? formatDate(data.syncLogs[0].created_at) : '—'
            } />
          </div>
        </div>
      )}

      {/* ═══ COMMANDES ═══ */}
      {tab === 'commandes' && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left bg-neutral-50">
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Date</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Client</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Produits</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Montant</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Statut</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Tracking</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400">Aucune commande</td></tr>
                ) : ordersList.map(o => {
                  const client = o.clients as any;
                  const lignes = o.lignes || [];
                  const montant = o.montant_ttc ? formatMoney(Number(o.montant_ttc)) : formatMoney(Number(o.montant_ht || 0) * 1.2);
                  return (
                    <tr key={o.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="px-4 py-3 text-neutral-500 tabular-nums whitespace-nowrap">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-900 font-medium">{client?.nom || '—'}</p>
                        <p className="text-xs text-neutral-400">{client?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        {lignes.slice(0, 2).map((l: any, i: number) => (
                          <p key={i} className="text-xs text-neutral-600">{l.nom} x{l.qty}</p>
                        ))}
                        {lignes.length > 2 && <p className="text-xs text-neutral-400">+{lignes.length - 2}</p>}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 tabular-nums">
                        {montant}
                        {o.paye && <span className="block text-[10px] text-emerald-600">Payé</span>}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={o.statut || 'en_attente'}
                          onChange={(e) => handleOrderStatut(o.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border-0 cursor-pointer ${ORDER_STATUT_COLORS[o.statut] || ORDER_STATUT_COLORS.en_attente}`}
                        >
                          {ORDER_STATUTS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {o.tracking_number ? (
                          <a href={o.tracking_url || '#'} target="_blank" className="text-neutral-600 underline">{o.tracking_number}</a>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ DEVIS ═══ */}
      {tab === 'devis' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left bg-neutral-50">
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Date</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Client</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Produits</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Montant HT</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Statut</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400">Aucun devis</td></tr>
                ) : quotes.map(q => {
                  const client = q.clients as any;
                  const lignes = q.lignes || [];
                  return (
                    <tr key={q.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                      <td className="px-4 py-3 text-neutral-500 tabular-nums whitespace-nowrap">{formatDate(q.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="text-neutral-900 font-medium">{client?.nom || '—'}</p>
                        <p className="text-xs text-neutral-400">{client?.email || 'Anonyme'}</p>
                        {client?.entreprise && <p className="text-xs text-neutral-400">{client.entreprise}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {lignes.slice(0, 2).map((l: any, i: number) => (
                          <p key={i} className="text-xs text-neutral-600">{l.nom} x{l.qty}</p>
                        ))}
                        {lignes.length > 2 && <p className="text-xs text-neutral-400">+{lignes.length - 2} autres</p>}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 tabular-nums">{formatMoney(Number(q.total_ht))}</td>
                      <td className="px-4 py-3">
                        <select
                          value={q.statut || 'brouillon'}
                          onChange={(e) => handleStatutChange(q.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${STATUT_COLORS[q.statut] || STATUT_COLORS.brouillon}`}
                        >
                          {STATUT_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/devis/pdf?token=${q.share_token}`}
                            target="_blank"
                            className="text-xs text-neutral-500 hover:text-neutral-900 underline"
                          >
                            PDF
                          </a>
                          <a
                            href={`/devis/${q.share_token}`}
                            target="_blank"
                            className="text-xs text-neutral-500 hover:text-neutral-900 underline"
                          >
                            Voir
                          </a>
                          <button
                            onClick={() => handleDeleteQuote(q.id)}
                            className="text-xs text-neutral-400 hover:text-red-500"
                            title="Supprimer"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ CLIENTS ═══ */}
      {tab === 'clients' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left bg-neutral-50">
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Inscrit le</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Nom</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Email</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Entreprise</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Secteur</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Téléphone</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">SIRET</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-400">Aucun client inscrit</td></tr>
                ) : clients.map(c => (
                  <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                    <td className="px-4 py-3 text-neutral-500 tabular-nums whitespace-nowrap">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{c.nom || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.email}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.entreprise || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600 capitalize">{c.secteur || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.telephone || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600 tabular-nums">{c.siret || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteClient(c.id)}
                        className="text-neutral-400 hover:text-red-500"
                        title="Supprimer"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ MARGES ═══ */}
      {tab === 'marges' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left bg-neutral-50">
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Fournisseur</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Catégorie</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Coefficient</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Franco port</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Frais port</th>
                </tr>
              </thead>
              <tbody>
                {margins.map((m: any) => (
                  <tr key={m.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                    <td className="px-4 py-3 text-neutral-700">{m.fournisseur || 'Tous'}</td>
                    <td className="px-4 py-3 text-neutral-700">{m.categorie || 'Toutes'}</td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={m.coefficient}
                        onChange={(e) => handleMarginUpdate(m.id, 'coefficient', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="1" value={m.franco_port_ht}
                        onChange={(e) => handleMarginUpdate(m.id, 'franco_port_ht', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.5" value={m.frais_port_ht}
                        onChange={(e) => handleMarginUpdate(m.id, 'frais_port_ht', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ SYNC LOGS ═══ */}
      {tab === 'sync' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left bg-neutral-50">
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Date</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Fournisseur</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Statut</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Produits</th>
                  <th className="px-4 py-3 text-xs text-neutral-400 uppercase font-medium">Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {data.syncLogs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-400">Aucun sync</td></tr>
                ) : data.syncLogs.map((log: any) => (
                  <tr key={log.id} className="border-b border-neutral-50">
                    <td className="px-4 py-3 text-neutral-500 tabular-nums whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 text-neutral-700">{log.fournisseur}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${
                        log.statut === 'ok' ? 'bg-emerald-50 text-emerald-700'
                        : log.statut === 'partiel' ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                      }`}>{log.statut}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 tabular-nums">{log.nb_produits_traites}</td>
                    <td className="px-4 py-3 text-neutral-700 tabular-nums">{log.nb_erreurs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
