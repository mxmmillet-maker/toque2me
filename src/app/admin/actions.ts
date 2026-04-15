'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── Marges ─────────────────────────────────────────────────────────────────

const ALLOWED_FIELDS = ['coefficient', 'franco_port_ht', 'frais_port_ht'];

export async function updateMargin(id: string, field: string, value: number) {
  if (!id || !ALLOWED_FIELDS.includes(field) || typeof value !== 'number' || isNaN(value)) {
    return { error: 'Paramètres invalides' };
  }
  if (field === 'coefficient' && (value < 1 || value > 5)) {
    return { error: 'Coefficient doit être entre 1 et 5' };
  }
  if ((field === 'franco_port_ht' || field === 'frais_port_ht') && (value < 0 || value > 500)) {
    return { error: 'Valeur port doit être entre 0 et 500' };
  }

  const { error } = await supabaseAdmin
    .from('margins')
    .update({ [field]: value })
    .eq('id', id);

  if (error) return { error: error.message };
  return { ok: true };
}

// ─── Devis ──────────────────────────────────────────────────────────────────

export async function updateQuoteStatut(quoteId: string, statut: string) {
  const VALID = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
  if (!VALID.includes(statut)) return { error: 'Statut invalide' };

  const { error } = await supabaseAdmin
    .from('quotes')
    .update({ statut })
    .eq('id', quoteId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteQuote(quoteId: string) {
  const { error } = await supabaseAdmin
    .from('quotes')
    .delete()
    .eq('id', quoteId);

  if (error) return { error: error.message };
  return { ok: true };
}

// ─── Clients ────────────────────────────────────────────────────────────────

export async function deleteClient(clientId: string) {
  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) return { error: error.message };
  return { ok: true };
}
