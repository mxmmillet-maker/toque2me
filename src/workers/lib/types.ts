// ─── Types communs ────────────────────────────────────────────────────────────

export interface RawProduct {
  [key: string]: any;
}

export interface NormalizedProduct {
  fournisseur: string;
  ref_fournisseur: string;
  nom: string;
  description?: string;
  categorie?: string;
  image_url?: string;
  grammage?: number;
  origine?: string;
  certifications?: string[];
  normes?: string[];
  secteurs?: string[];
  zones_marquage?: ZoneMarquage[];
  score_durabilite?: number;
  score_premium?: number;
  stock_bas?: boolean;
  couleurs?: { nom: string; hexa: string; image?: string }[];
  actif?: boolean;
}

export interface ZoneMarquage {
  id: string;
  label: string;
  x: number;
  y: number;
  width_mm: number;
  height_mm: number;
}

export interface PriceGrid {
  product_ref: string;
  qte_min: number;
  qte_max: number | null;
  prix_ht: number;
}

export interface SyncResult {
  fournisseur: string;
  nb_traites: number;
  nb_nouveaux: number;
  nb_erreurs: number;
  statut: 'ok' | 'erreur' | 'partiel';
  details?: string;
  duree_ms: number;
}

// ─── Interface que chaque adapter doit implémenter ───────────────────────────

export interface SupplierAdapter {
  name: string;
  fetchProducts(): Promise<RawProduct[]>;
  mapProduct(raw: RawProduct): NormalizedProduct;
  fetchPrices?(): Promise<PriceGrid[]>;
}
