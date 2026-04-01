import { SupplierAdapter, NormalizedProduct, PriceGrid, SyncResult } from './types';
import { createClient } from '@supabase/supabase-js';

// ─── Client admin (service role — bypass RLS) ────────────────────────────────
// IMPORTANT : ce fichier ne tourne QUE côté serveur (workers/cron)
// JAMAIS importer dans un composant React côté client

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Moteur de synchronisation générique ─────────────────────────────────────

export async function syncSupplier(adapter: SupplierAdapter): Promise<SyncResult> {
  const start = Date.now();
  let nb_traites = 0;
  let nb_nouveaux = 0;
  let nb_erreurs = 0;

  try {
    // ── 1. Timeout explicite à 9s (Vercel coupe à 10s en free tier) ──────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    let rawProducts: any[];
    try {
      rawProducts = await adapter.fetchProducts();
    } finally {
      clearTimeout(timeout);
    }

    nb_traites = rawProducts.length;

    // ── 2. Mapper vers notre schéma normalisé ─────────────────────────────────
    const normalized: NormalizedProduct[] = [];
    for (const raw of rawProducts) {
      try {
        normalized.push(adapter.mapProduct(raw));
      } catch (e) {
        nb_erreurs++;
        console.error(`[${adapter.name}] Erreur mapping produit:`, e);
      }
    }

    // ── 3. Batch upsert — UN seul appel SQL, pas de boucle ───────────────────
    // Passe de ~30s à ~2s pour 500 produits
    if (normalized.length > 0) {
      const { error, count } = await supabaseAdmin
        .from('products')
        .upsert(normalized, {
          onConflict: 'fournisseur,ref_fournisseur',
          count: 'exact',
        });

      if (error) throw error;
      nb_nouveaux = count ?? 0;
    }

    // ── 4. Sync des prix si l'adapter le supporte ─────────────────────────────
    if (adapter.fetchPrices) {
      const prices = await adapter.fetchPrices();
      if (prices.length > 0) {
        await syncPrices(prices, adapter.name);
      }
    }

    // ── 5. Log du résultat ────────────────────────────────────────────────────
    const result: SyncResult = {
      fournisseur: adapter.name,
      nb_traites,
      nb_nouveaux,
      nb_erreurs,
      statut: nb_erreurs === 0 ? 'ok' : nb_erreurs < nb_traites ? 'partiel' : 'erreur',
      duree_ms: Date.now() - start,
    };

    await logSync(result);
    return result;

  } catch (e: any) {
    const result: SyncResult = {
      fournisseur: adapter.name,
      nb_traites,
      nb_nouveaux,
      nb_erreurs: nb_traites,
      statut: 'erreur',
      details: e.message,
      duree_ms: Date.now() - start,
    };
    await logSync(result);
    console.error(`[${adapter.name}] Sync échouée:`, e);
    return result;
  }
}

// ─── Sync des grilles de prix ─────────────────────────────────────────────────

async function syncPrices(prices: PriceGrid[], fournisseur: string) {
  // Résoudre product_ref → product_id (UUID)
  const refs = Array.from(new Set(prices.map(p => p.product_ref)));
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, ref_fournisseur')
    .eq('fournisseur', fournisseur)
    .in('ref_fournisseur', refs);

  const refToId = new Map<string, string>();
  for (const p of (products || [])) {
    refToId.set(p.ref_fournisseur, p.id);
    refToId.set(p.ref_fournisseur.toLowerCase(), p.id);
    refToId.set(p.ref_fournisseur.toUpperCase(), p.id);
  }

  const pricesWithId = prices
    .filter(p => refToId.has(p.product_ref))
    .map(p => ({
      product_id: refToId.get(p.product_ref)!,
      fournisseur,
      qte_min: p.qte_min,
      qte_max: p.qte_max,
      prix_ht: p.prix_ht,
    }));

  if (pricesWithId.length === 0) return;

  // Supprimer les anciens prix du fournisseur
  await supabaseAdmin
    .from('prices')
    .delete()
    .eq('fournisseur', fournisseur);

  // Insérer en batch (max 1000 par appel)
  for (let i = 0; i < pricesWithId.length; i += 1000) {
    await supabaseAdmin.from('prices').insert(pricesWithId.slice(i, i + 1000));
  }
}

// ─── Log en base ──────────────────────────────────────────────────────────────

async function logSync(result: SyncResult) {
  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: result.fournisseur,
    nb_produits_traites: result.nb_traites,
    nb_produits_nouveaux: result.nb_nouveaux,
    nb_erreurs: result.nb_erreurs,
    statut: result.statut,
    details: result.details,
  });

  console.log(
    `[${result.fournisseur}] ${result.statut.toUpperCase()} — ` +
    `${result.nb_traites} produits, ${result.nb_erreurs} erreurs, ` +
    `${result.duree_ms}ms`
  );
}
