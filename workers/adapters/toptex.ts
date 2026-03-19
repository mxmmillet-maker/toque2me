import { SupplierAdapter, RawProduct, NormalizedProduct, PriceGrid } from '../lib/types';

// Marques et leurs scores de qualité
const MARQUES_SCORES: Record<string, { durabilite: number; premium: number }> = {
  'stanley/stella': { durabilite: 95, premium: 95 },
  'kariban':        { durabilite: 80, premium: 80 },
  "b&c":            { durabilite: 75, premium: 70 },
  'fruit of the loom': { durabilite: 70, premium: 60 },
  'gildan':         { durabilite: 65, premium: 55 },
  'sg':             { durabilite: 65, premium: 55 },
  'sol\'s':         { durabilite: 70, premium: 65 },
  'result':         { durabilite: 78, premium: 72 },
};

export const ToptexAdapter: SupplierAdapter = {
  name: 'toptex',

  async fetchProducts(): Promise<RawProduct[]> {
    // Toptex fournit généralement un flux XML ou CSV
    // À adapter selon le format réel fourni par Toptex
    const response = await fetch(process.env.TOPTEX_FEED_URL!, {
      headers: {
        'Authorization': `Bearer ${process.env.TOPTEX_API_KEY}`,
      },
    });

    if (!response.ok) throw new Error(`Toptex feed error: ${response.status}`);

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('xml')) {
      const xml = await response.text();
      return parseXML(xml);
    }

    if (contentType.includes('json')) {
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products ?? []);
    }

    // CSV fallback
    const csv = await response.text();
    return parseCSV(csv);
  },

  mapProduct(raw: RawProduct): NormalizedProduct {
    const marqueKey = (raw.marque || raw.brand || '').toLowerCase();
    const scores = Object.entries(MARQUES_SCORES)
      .find(([k]) => marqueKey.includes(k))?.[1]
      ?? { durabilite: 50, premium: 50 };

    const origine = raw.origine || raw.country || raw.pays || '';

    return {
      fournisseur: 'toptex',
      ref_fournisseur: raw.reference || raw.ref || raw.sku || '',
      nom: raw.designation || raw.nom || raw.name || '',
      description: raw.description || '',
      categorie: raw.famille || raw.categorie || raw.category || '',
      image_url: raw.photo || raw.image_url || raw.image || '',
      grammage: raw.grammage ? parseInt(raw.grammage) : undefined,
      origine,
      certifications: parseCertifications(raw),
      normes: [],
      secteurs: ['entreprise', 'association'],
      score_durabilite: scores.durabilite,
      score_premium: scores.premium,
      actif: false,
    };
  },
};

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseXML(xml: string): RawProduct[] {
  // Parser XML basique — à remplacer par 'fast-xml-parser' si besoin
  const products: RawProduct[] = [];
  const productMatches = xml.match(/<product[^>]*>([\s\S]*?)<\/product>/gi) || [];

  for (const block of productMatches) {
    const getField = (tag: string) => {
      const match = block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    products.push({
      reference: getField('reference') || getField('ref'),
      designation: getField('designation') || getField('nom') || getField('name'),
      description: getField('description'),
      famille: getField('famille') || getField('categorie'),
      marque: getField('marque') || getField('brand'),
      grammage: getField('grammage'),
      origine: getField('origine') || getField('pays'),
      photo: getField('photo') || getField('image'),
      labels: getField('labels') || getField('certifications'),
    });
  }

  return products;
}

function parseCSV(csv: string): RawProduct[] {
  const lines = csv.split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = line.split(';');
    const product: RawProduct = {};
    headers.forEach((header, i) => {
      product[header] = values[i]?.trim() || '';
    });
    return product;
  });
}

function parseCertifications(raw: RawProduct): string[] {
  const labels = raw.labels || raw.certifications || raw.labels_qualite || '';
  if (Array.isArray(labels)) return labels;
  if (!labels) return [];
  return labels.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean);
}
