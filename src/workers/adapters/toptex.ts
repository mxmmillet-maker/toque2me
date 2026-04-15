import { SupplierAdapter, RawProduct, NormalizedProduct, PriceGrid, Variante } from '../lib/types';
import { tagProduct } from '@/lib/product-tagger';
import { scoreUniverses, isNouveaute, parseGenre } from '@/lib/universe-affinity';

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

/** Like fr() but returns null instead of '' for missing/empty values */
const frOrNull = (field: any): string | null => {
  const val = fr(field);
  return val || null;
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
  if (sub.includes('casquette') || sub.includes('cap') || sub.includes('trucker')) return 'Casquettes';
  if (sub.includes('bonnet') || sub.includes('beanie')) return 'Bonnets';
  if (sub.includes('chapeau') || sub.includes('bob') || sub.includes('bucket') || sub.includes('hat')) return 'Chapeaux';
  if (sub.includes('sac') || sub.includes('bag') || sub.includes('tote') || sub.includes('valise')) return 'Bagagerie';
  if (sub.includes('parapluie') || sub.includes('ombrelle')) return 'Parapluies';
  if (fam.includes('headwear') || fam.includes('accessoire')) return 'Accessoires'; // fallback — les casquettes/bonnets sont déjà matchés par sub_family
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

function extractColors(colors: any): { nom: string; hexa: string; image?: string; image_back?: string }[] {
  if (!colors || !Array.isArray(colors)) return [];
  const seen = new Set<string>();
  const result: { nom: string; hexa: string; image?: string; image_back?: string }[] = [];
  for (const c of colors) {
    const nom = c?.colors?.fr || c?.colors?.en || '';
    if (!nom || seen.has(nom)) continue;
    seen.add(nom);
    const hexArr = c?.colorsHexa || [];
    const hexa = (Array.isArray(hexArr) ? hexArr[0] : hexArr) || '';
    const packshots = c?.packshots || {};
    const faceImg = packshots?.FACE?.url_packshot || '';
    const backImg = packshots?.BACK?.url_packshot || '';
    result.push({
      nom,
      hexa: hexa.startsWith('#') ? hexa : (hexa ? '#' + hexa : ''),
      image: faceImg || backImg || undefined,
      image_back: backImg || undefined,
    });
  }
  return result;
}

function extractVariantes(colors: any, catalogRef: string): Variante[] {
  if (!colors || !Array.isArray(colors)) return [];
  const variantes: Variante[] = [];
  for (const c of colors) {
    const couleur = c?.colors?.fr || c?.colors?.en || '';
    const sizes = c?.sizes || c?.sizeVariants || [];
    if (!Array.isArray(sizes)) continue;
    for (const s of sizes) {
      const taille = s?.size || s?.name || s?.label || '';
      if (!taille) continue;
      const sku =
        s?.sku || s?.ean || s?.gtin ||
        `${catalogRef}-${couleur}-${taille}`.replace(/\s+/g, '-').toUpperCase();
      const ean = s?.ean || s?.gtin || '';
      // stock: boolean or null if unknown
      const stock =
        s?.stock !== undefined ? Boolean(s.stock) :
        s?.available !== undefined ? Boolean(s.available) :
        s?.inStock !== undefined ? Boolean(s.inStock) :
        null;
      variantes.push({ sku, couleur, taille, stock, ean });
    }
  }
  return variantes;
}

function extractMarquageDispo(raw: RawProduct): string[] {
  // TopTex may expose marking/printing techniques under various field names
  const candidates = [
    raw.printingTechniques,
    raw.markingMethods,
    raw.marquage,
    raw.printing,
    raw.decorationTechniques,
  ];
  for (const field of candidates) {
    if (!field) continue;
    if (Array.isArray(field)) {
      const names = field
        .map((t: any) => (typeof t === 'string' ? t : t?.fr || t?.en || t?.name || ''))
        .filter(Boolean);
      if (names.length > 0) return names;
    }
    if (typeof field === 'string' && field.trim()) {
      return field.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
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
    const refFournisseur = raw.catalogReference || raw.supplierReference || '';
    const variantes = extractVariantes(raw.colors, refFournisseur);
    const marquage = extractMarquageDispo(raw);
    const nom = `${fr(raw.designation)} ${brand}`.trim();
    const description = fr(raw.description);
    const categorie = mapCategorie(family, subFamily);
    const certifications = parseCertifications(raw);
    const normes = parseNormes(raw);
    const compositionRaw = frOrNull(raw.composition);
    const genreRaw = frOrNull(raw.gender);

    const meta = {
      col: frOrNull(raw.neckType),
      capuche: fr(raw.hood) === 'Oui',
      coupe: frOrNull(raw.fit),
      sous_type: frOrNull(raw.style),
      composition: compositionRaw,
      activites: Array.isArray(raw.activity)
        ? raw.activity.map((a: any) => fr(a)).filter(Boolean)
        : [],
      maille: frOrNull(raw.typeWeaving),
      fermeture: frOrNull(raw.typeFastening),
      impermeabilite: frOrNull(raw.waterproof),
      genre_structure: genreRaw,
      arguments_vente: frOrNull(raw.salesArguments),
    };

    // ── Product tagger (famille, type, matière, usages, etc.) ──
    const productTags = tagProduct({
      nom,
      description,
      categorie,
      grammage,
      certifications,
      normes,
    });

    // ── Universe affinity scoring ──
    const univers = scoreUniverses({
      nom,
      description,
      categorie,
      marque: brand,
      genre: parseGenre(genreRaw) || undefined,
      normes,
      certifications,
      grammage,
      meta,
      tags: productTags,
    });

    return {
      fournisseur: 'toptex',
      ref_fournisseur: refFournisseur,
      nom,
      description,
      categorie,
      image_url: extractImageUrl(raw.images),
      grammage,
      origine: '',
      certifications,
      normes,
      secteurs: ['entreprise'],
      score_durabilite: scores.durabilite,
      score_premium: scores.premium,
      couleurs: extractColors(raw.colors),
      variantes: variantes.length > 0 ? variantes : undefined,
      marquage_dispo: marquage.length > 0 ? marquage : undefined,
      meta,
      // Colonnes enrichies (migration 005)
      univers,
      est_nouveaute: isNouveaute(refFournisseur),
      tags: productTags as any,
      genre: parseGenre(genreRaw) || undefined,
      composition: compositionRaw || undefined,
      marque: brand || undefined,
    };
  },

  async fetchPrices(): Promise<PriceGrid[]> {
    const allPrices: PriceGrid[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchWithAuth(
        `/v3/products/price?page_number=${page}&page_size=1500`
      );
      if (!response.ok) throw new Error(`TopTex Prices API error: ${response.status}`);

      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items || [];

      for (const item of items) {
        const ref = item.catalogReference;
        if (!ref) continue;

        const priceTiers = item.prices || [];
        for (let i = 0; i < priceTiers.length; i++) {
          const tier = priceTiers[i];
          const nextTier = priceTiers[i + 1];
          const qty = typeof tier.quantity === 'string' ? parseInt(tier.quantity) : tier.quantity;
          const price = typeof tier.price === 'string' ? parseFloat(tier.price) : tier.price;
          if (isNaN(qty) || isNaN(price)) continue;
          allPrices.push({
            product_ref: ref,
            qte_min: qty || 1,
            qte_max: nextTier ? ((typeof nextTier.quantity === 'string' ? parseInt(nextTier.quantity) : nextTier.quantity) - 1) : null,
            prix_ht: price,
          });
        }
      }

      hasMore = items.length >= 1500;
      page++;
      if (page > 200) break; // Sécurité
    }

    // Dédupliquer par ref + qte_min (un seul prix par palier par ref catalogue)
    const seen = new Set<string>();
    return allPrices.filter(p => {
      const key = `${p.product_ref}_${p.qte_min}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
};
