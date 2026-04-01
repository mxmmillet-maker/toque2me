export interface SupabaseProduct {
  id: string;
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
  score_durabilite?: number;
  score_premium?: number;
  couleurs?: { nom: string; hexa: string; image?: string }[];
  actif: boolean;
  prix_from?: number;
}
