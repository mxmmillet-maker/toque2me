import { SupplierAdapter, RawProduct, NormalizedProduct } from '../lib/types';

// ─── TopTex API v3 ────────────────────────────────────────────────────────────
// Auth: POST /v3/authenticate {username, password} + header x-api-key → JWT (1h)
// Catalogue: GET /v3/products/all?usage_right=b2b_uniquement&page_number=N
// 50 produits/page, ~60 pages (~3000 produits)

const API_BASE = process.env.TOPTEX_API_URL || 'https://api.toptex.io';
const API_KEY = process.env.TOPTEX_API_KEY || '';
const USERNAME = process.env.TOPTEX_USERNAME || 'tofr_karletmax';
const PASSWORD = process.env.TOPTEX_PASSWORD || '';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${API_BASE}/v3/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!res.ok) throw new Error(`TopTex auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.token;
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken!;
}

async function fetchWithAuth(endpoint: string): Promise<Response> {
  const token = await getToken();
  return fetch(`${API_BASE}${endpoint}`, {
    headers: { 'x-api-key': API_KEY, 'x-toptex-authorization': token },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fr = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.fr || field.en || '';
};

function mapCategorie(family: string, subFamily: string): string {
  const sub = subFamily.toLowerCase();
  const fam = family.toLowerCase();
  if (sub.includes('polo')) return 'Polos';
  if (sub.includes('sweat') || sub.includes('hoodie')) return 'Sweats';
  if (sub.includes('t-shirt') || sub.includes('tee-shirt') || sub.includes('débardeur')) return 'T-shirts';
  if (sub.includes('tablier')) return 'Tabliers';
  if (sub.includes('veste') || sub.includes('jacket') || sub.includes('blouson') || sub.includes('parka') || sub.includes('manteau')) return 'Vestes';
  if (sub.includes('pantalon') || sub.includes('pantacourt') || sub.includes('short') || sub.includes('bermuda')) return 'Pantalons';
  if (sub.includes('chemise') || sub.includes('shirt')) return 'Chemises';
  if (sub.includes('casquette') || sub.includes('bonnet') || sub.includes('chapeau') || sub.includes('bandana')) return 'Accessoires';
  if (sub.includes('sac') || sub.includes('bag') || sub.includes('tote') || sub.includes('valise')) return 'Bagagerie';
  if (sub.includes('parapluie') || sub.includes('ombrelle')) return 'Parapluies';
  if (fam.includes('headwear') || fam.includes('accessoire')) return 'Accessoires';
  if (fam.includes('bag')) return 'Bagagerie';
  return 'Autres';
}

function parseCertifications(raw: RawProduct): string[] {
  const certs: string[] = [];
  if (raw.oekoTex === '1' || raw.oekoTex === true) certs.push('Oeko-Tex');
  const checkField = (field: any, label: string) => {
    const val = Array.isArray(field) ? field[0] : field;
    const str = typeof val === 'object' ? val?.fr || '' : String(val || '');
    if (str && str !== '' && str !== '0') certs.push(label);
  };
  checkField(raw.organic, 'Bio');
  checkField(raw.recycled, 'Recyclé');
  checkField(raw.vegan, 'Vegan');
  return certs;
}

function parseNormes(raw: RawProduct): string[] {
  const normes: string[] = [];
  const check = (field: any, norme: string) => {
    if (Array.isArray(field) && field.some((n: string) => n && n !== '')) normes.push(norme);
  };
  check(raw.hiVizStandards, 'EN-ISO-20471');
  check(raw.antiStaticStandards, 'EN1149-5');
  check(raw.fireResistanceStandards, 'EN-ISO-11612');
  return normes;
}

function parseGrammage(weight: string | undefined): number | undefined {
  if (!weight) return undefined;
  const match = weight.match(/(\d+)\s*g/i);
  return match ? parseInt(match[1]) : undefined;
}

function extractImageUrl(images: any): string {
  if (!images) return '';
  const list = Array.isArray(images) ? images : [images];
  let url = '';
  for (const img of list) {
    if (typeof img === 'string') { url = img; break; }
    if (img?.url_image) { url = img.url_image; break; }
    if (img?.url) { url = img.url; break; }
  }
  // Forcer HTTPS
  if (url.startsWith('http://')) url = url.replace('http://', 'https://');
  return url;
}

const BRAND_SCORES: Record<string, { durabilite: number; premium: number }> = {
  'stanley/stella': { durabilite: 90, premium: 95 },
  'kariban': { durabilite: 80, premium: 80 },
  'native spirit': { durabilite: 85, premium: 90 },
  'neoblu': { durabilite: 75, premium: 85 },
  'b&c': { durabilite: 75, premium: 70 },
  'fruit of the loom': { durabilite: 65, premium: 55 },
  'gildan': { durabilite: 60, premium: 50 },
  'sol\'s': { durabilite: 70, premium: 65 },
  'result': { durabilite: 75, premium: 70 },
  'beechfield': { durabilite: 70, premium: 65 },
  'bagbase': { durabilite: 70, premium: 65 },
  'westford mill': { durabilite: 70, premium: 70 },
  'bella+canvas': { durabilite: 75, premium: 80 },
  'roly': { durabilite: 60, premium: 50 },
  'k-up': { durabilite: 65, premium: 60 },
  'proact': { durabilite: 70, premium: 65 },
  'yoko': { durabilite: 75, premium: 60 },
};

function getScores(brand: string, grammage?: number) {
  const key = brand.toLowerCase().replace(/[®™]/g, '').trim();
  const match = Object.entries(BRAND_SCORES).find(([k]) => key.includes(k));
  const scores = match ? { ...match[1] } : { durabilite: 60, premium: 55 };
  if (grammage && grammage >= 280) scores.durabilite = Math.min(scores.durabilite + 15, 100);
  else if (grammage && grammage >= 200) scores.durabilite = Math.min(scores.durabilite + 8, 100);
  return scores;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export const ToptexAdapter: SupplierAdapter = {
  name: 'toptex',

  async fetchProducts(): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchWithAuth(
        `/v3/products/all?usage_right=b2b_uniquement&page_number=${page}`
      );
      if (!response.ok) throw new Error(`TopTex API error: ${response.status}`);

      const data = await response.json();
      const items = data.items || [];
      allProducts.push(...items);

      hasMore = items.length >= 50;
      page++;
      if (page > 80) break; // Sécurité
    }

    return allProducts;
  },

  mapProduct(raw: RawProduct): NormalizedProduct {
    const family = fr(raw.family);
    const subFamily = fr(raw.sub_family);
    const brand = (raw.brand || '').replace(/[®™]/g, '').trim();
    const grammage = parseGrammage(raw.averageWeight);
    const scores = getScores(brand, grammage);

    return {
      fournisseur: 'toptex',
      ref_fournisseur: raw.catalogReference || raw.supplierReference || '',
      nom: `${fr(raw.designation)} ${brand}`.trim(),
      description: fr(raw.description),
      categorie: mapCategorie(family, subFamily),
      image_url: extractImageUrl(raw.images),
      grammage,
      origine: '',
      certifications: parseCertifications(raw),
      normes: parseNormes(raw),
      secteurs: ['entreprise'],
      score_durabilite: scores.durabilite,
      score_premium: scores.premium,
      // actif n'est pas inclus — le sync engine fait un upsert
      // et on ne veut pas écraser le statut actif/exclu existant
    };
  },
};
