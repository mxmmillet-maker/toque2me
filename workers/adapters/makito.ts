import { SupplierAdapter, RawProduct, NormalizedProduct } from '../lib/types';

export const MakitoAdapter: SupplierAdapter = {
  name: 'makito',

  async fetchProducts(): Promise<RawProduct[]> {
    const response = await fetch(process.env.MAKITO_FEED_URL!, {
      headers: { 'Authorization': `Bearer ${process.env.MAKITO_API_KEY}` },
    });
    if (!response.ok) throw new Error(`Makito feed error: ${response.status}`);
    const xml = await response.text();
    return parseMakitoXML(xml);
  },

  mapProduct(raw: RawProduct): NormalizedProduct {
    return {
      fournisseur: 'makito',
      ref_fournisseur: raw.id || raw.code || '',
      nom: raw.name || raw.nom || '',
      description: raw.description || '',
      categorie: raw.category || raw.categorie || '',
      image_url: raw.image || '',
      grammage: raw.weight ? parseInt(raw.weight) : undefined,
      origine: raw.country || raw.origin || '',
      certifications: [],
      normes: [],
      secteurs: ['entreprise', 'association'],
      score_durabilite: 55,
      score_premium: 55,
      actif: false,
    };
  },
};

function parseMakitoXML(xml: string): RawProduct[] {
  const products: RawProduct[] = [];
  const blocks = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  for (const block of blocks) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'));
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    products.push({
      id: get('g:id') || get('id'),
      name: get('title') || get('g:title') || get('name'),
      description: get('description') || get('g:description'),
      category: get('g:product_type') || get('g:google_product_category'),
      image: get('g:image_link') || get('image'),
      country: get('g:country_of_origin'),
    });
  }
  return products;
}
