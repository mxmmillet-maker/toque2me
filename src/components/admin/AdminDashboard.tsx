'use client';

import { useState } from 'react';
import { updateMargin as updateMarginAction } from '@/app/admin/actions';

interface Margin {
  id: string;
  fournisseur: string | null;
  categorie: string | null;
  coefficient: number;
  franco_port_ht: number;
  frais_port_ht: number;
}

interface SyncLog {
  id: string;
  fournisseur: string;
  statut: string;
  nb_produits_traites: number;
  nb_erreurs: number;
  created_at: string;
}

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalQuotes: number;
  syncLogs: SyncLog[];
  margins: Margin[];
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-semibold text-neutral-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

export function AdminDashboard({ stats }: { stats: Stats }) {
  const [margins, setMargins] = useState(stats.margins);
  const [saving, setSaving] = useState(false);

  const updateMargin = async (id: string, field: string, value: number) => {
    setSaving(true);
    const result = await updateMarginAction(id, field, value);
    if (result.ok) {
      setMargins((prev) =>
        prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
      );
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Produits total" value={stats.totalProducts} sub={`${stats.activeProducts} actifs`} />
        <StatCard label="Devis générés" value={stats.totalQuotes} />
        <StatCard label="Dernier sync" value={
          stats.syncLogs.length > 0
            ? new Date(stats.syncLogs[0].created_at).toLocaleDateString('fr-FR')
            : '—'
        } />
      </div>

      {/* Marges */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">Gestion des marges</h2>
          {saving && <span className="text-xs text-neutral-400 ml-2">Enregistrement...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Fournisseur</th>
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Catégorie</th>
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Coefficient</th>
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Franco port</th>
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Frais port</th>
              </tr>
            </thead>
            <tbody>
              {margins.map((m) => (
                <tr key={m.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="px-5 py-3 text-neutral-700">{m.fournisseur || 'Tous'}</td>
                  <td className="px-5 py-3 text-neutral-700">{m.categorie || 'Toutes'}</td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={m.coefficient}
                      onChange={(e) => updateMargin(m.id, 'coefficient', parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      step="1"
                      value={m.franco_port_ht}
                      onChange={(e) => updateMargin(m.id, 'franco_port_ht', parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      step="0.5"
                      value={m.frais_port_ht}
                      onChange={(e) => updateMargin(m.id, 'frais_port_ht', parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Logs */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">Historique des syncs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Date</th>
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Fournisseur</th>
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Statut</th>
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Produits</th>
                <th className="px-5 py-3 text-xs text-neutral-400 uppercase font-medium">Erreurs</th>
              </tr>
            </thead>
            <tbody>
              {stats.syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-400">
                    Aucun sync enregistré
                  </td>
                </tr>
              ) : (
                stats.syncLogs.map((log) => (
                  <tr key={log.id} className="border-b border-neutral-50">
                    <td className="px-5 py-3 text-neutral-500 tabular-nums">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-5 py-3 text-neutral-700">{log.fournisseur}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium ${
                        log.statut === 'ok'
                          ? 'bg-emerald-50 text-emerald-700'
                          : log.statut === 'partiel'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {log.statut}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-700 tabular-nums">{log.nb_produits_traites}</td>
                    <td className="px-5 py-3 text-neutral-700 tabular-nums">{log.nb_erreurs}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
