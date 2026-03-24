import { SupplierAdapter, RawProduct, NormalizedProduct } from '../lib/types';

export const BicGraphicAdapter: SupplierAdapter = {
  name: 'bic_graphic',

  async fetchProducts(): Promise<RawProduct[]> {
    const response = await fetch(process.env.BIC_GRAPHIC_FEED_URL!, {
      headers: { 'Authorization': `Bearer ${process.env.BIC_GRAPHIC_API_KEY}` },
    });
    if (!response.ok) throw new Error(`BIC Graphic feed error: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : (data.products ?? data.items ?? []);
  },

  mapProduct(raw: RawProduct): NormalizedProduct {
    return {
      fournisseur: 'bic_graphic',
      ref_fournisseur: raw.itemNumber || raw.sku || raw.id || '',
      nom: raw.itemName || raw.name || '',
      description: raw.description || raw.shortDescription || '',
      categorie: raw.categoryName || raw.category || '',
      image_url: raw.primaryImage || raw.imageUrl || '',
      grammage: undefined,
      origine: raw.countryOfOrigin || '',
      certifications: [],
      normes: [],
      secteurs: ['entreprise'],
      score_durabilite: 50,
      score_premium: 60,
      actif: false,
    };
  },
};
