import { SupplierAdapter, RawProduct, NormalizedProduct, PriceGrid } from '../lib/types';

// ─── Normes et typologies par catégorie Cybernecard ──────────────────────────

const NORMES_PAR_CATEGORIE: Record<string, string[]> = {
  'cuisine':        ['HACCP'],
  'btp-hv':         ['EN-ISO-20471'],
  'btp-antistatic': ['EN1149-5'],
  'soudure':        ['EN-ISO-11612'],
};

const SECTEURS_PAR_CATEGORIE: Record<string, string[]> = {
  'cuisine':   ['restaurateur', 'hotelier', 'traiteur'],
  'btp-hv':    ['btp', 'chantier', 'logistique'],
  'corporate': ['entreprise', 'association'],
};

const TYPOLOGIES_PAR_CATEGORIE: Record<string, string> = {
  'polo':      'textile_btob',
  'sweat':     'textile_btob',
  'tshirt':    'textile_lifestyle',
  'tablier':   'textile_btob',
  'mug':       'objet_promo',
  'stylo':     'objet_promo',
  'sac':       'textile_lifestyle',
};

const API_BASE = 'https://cybernecard.fr/api';

// ─── JWT Auth ────────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${API_BASE}/login_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.CYBERNECARD_LOGIN,
      password: process.env.CYBERNECARD_API_KEY,
    }),
  });

  if (!res.ok) throw new Error(`Cybernecard login failed: ${res.status}`);

  const { token } = await res.json();
  cachedToken = token;
  // Token expire en 1h, on renouvelle 5min avant
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return token;
}

async function fetchWithAuth(endpoint: string): Promise<Response> {
  const token = await getToken();
  return fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/ld+json',
    },
  });
}

// ─── Adapter Cybernecard ──────────────────────────────────────────────────────

export const CyberneCardAdapter: SupplierAdapter = {
  name: 'cybernecard',

  async fetchProducts(): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchWithAuth(`/articles?page=${page}`);
      if (!response.ok) throw new Error(`Cybernecard API error: ${response.status}`);

      const data = await response.json();
      const members = data['hydra:member'] || [];
      allProducts.push(...members);

      // Pagination hydra
      hasMore = !!data['hydra:view']?.['hydra:next'];
      page++;
    }

    return allProducts;
  },

  mapProduct(raw: RawProduct): NormalizedProduct {
    const desc = (raw.descriptionArticleCatalogue || raw.libelleArticleCatalogue || '').toLowerCase();
    const nomProduit = raw.libelleArticleCatalogue || '';
    const categorie = detectCategorie(desc, nomProduit);

    // Première photo (ordre le plus bas)
    const photos = raw.photos || [];
    const mainPhoto = photos.length > 0
      ? photos.sort((a: any, b: any) => (a.ordre || 0) - (b.ordre || 0))[0].url
      : '';

    // Extraire grammage depuis la description (ex: "300 gr /m²")
    const grammageMatch = (raw.descriptionArticleCatalogue || '').match(/(\d+)\s*gr?\s*\/?\s*m²/i);
    const grammage = grammageMatch ? parseInt(grammageMatch[1]) : undefined;

    // Détecter stock bas : si le fournisseur envoie un champ stock/quantité
    const stockTotal = raw.stockTotal ?? raw.stock ?? raw.quantiteStock ?? raw.qteStock ?? null;
    const stockBas = stockTotal !== null ? stockTotal < 50 : undefined;

    return {
      fournisseur: 'cybernecard',
      ref_fournisseur: raw.codeArticle || raw.id || '',
      nom: raw.libelleArticleCatalogue || '',
      description: raw.descriptionArticleCatalogue || '',
      categorie,
      image_url: mainPhoto,
      grammage,
      origine: '',
      certifications: parseCertifications(raw.descriptionArticleCatalogue || ''),
      normes: NORMES_PAR_CATEGORIE[categorie] || [],
      secteurs: SECTEURS_PAR_CATEGORIE[categorie] || ['entreprise'],
      score_durabilite: computeDurabilite(raw, grammage),
      score_premium: computePremium(raw),
      stock_bas: stockBas,
      actif: false,
    };
  },

  async fetchPrices(): Promise<PriceGrid[]> {
    const allPrices: PriceGrid[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchWithAuth(`/prices?page=${page}`);
      if (!response.ok) break;

      const data = await response.json();
      const members = data['hydra:member'] || [];

      for (const item of members) {
        // Paliers qt1/pv1 → qt5/pv5
        for (let i = 1; i <= 5; i++) {
          const qte = item[`qt${i}`];
          const prix = item[`pv${i}`];
          if (qte == null || prix == null) continue;

          const nextQte = item[`qt${i + 1}`];
          allPrices.push({
            product_ref: item.codeArticle,
            qte_min: qte,
            qte_max: nextQte ? nextQte - 1 : null,
            prix_ht: prix,
          });
        }
      }

      hasMore = !!data['hydra:view']?.['hydra:next'];
      page++;
    }

    return allPrices;
  },
};

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function detectCategorie(desc: string, nom?: string): string {
  const text = `${desc} ${nom || ''}`.toLowerCase();
  // Goodies / Peluches (MBW etc.)
  if (text.includes('peluche') || text.includes('canard') || text.includes('antistress') ||
      text.includes('anti-stress') || text.includes('balle anti') ||
      text.includes('mbw')) return 'Goodies';
  // Objets tech (Metmaxx etc.)
  if (text.includes('gourde') || text.includes('thermos') || text.includes('lampe') ||
      text.includes('torche') || text.includes('powerbank') || text.includes('chargeur') ||
      text.includes('metmaxx')) return 'Objets tech';
  if (text.includes('parapluie') || text.includes('ombrelle')) return 'Parapluies';
  if (desc.includes('polo')) return 'Polos';
  if (desc.includes('sweat')) return 'Sweats';
  if (desc.includes('t-shirt') || desc.includes('tee-shirt')) return 'T-shirts';
  if (desc.includes('tablier')) return 'Tabliers';
  if (desc.includes('veste')) return 'Vestes';
  if (desc.includes('pantalon')) return 'Pantalons';
  if (desc.includes('casquette') || desc.includes('bonnet')) return 'Accessoires';
  if (desc.includes('sac') || desc.includes('tote')) return 'Bagagerie';
  return 'Autres';
}

function parseCertifications(desc: string): string[] {
  const certs: string[] = [];
  const lower = desc.toLowerCase();
  if (lower.includes('oeko-tex') || lower.includes('oekotex')) certs.push('Oeko-Tex');
  if (lower.includes('gots')) certs.push('GOTS');
  if (lower.includes('bio') || lower.includes('organic')) certs.push('Bio');
  if (lower.includes('fair wear') || lower.includes('fairwear')) certs.push('Fair Wear');
  return certs;
}

function computeDurabilite(raw: RawProduct, grammage?: number): number {
  let score = 50;
  if (grammage) {
    if (grammage >= 280) score += 20;
    else if (grammage >= 200) score += 10;
  }

  const desc = (raw.descriptionArticleCatalogue || '').toLowerCase();
  if (desc.includes('oeko-tex')) score += 15;
  if (desc.includes('gots')) score += 15;
  if (desc.includes('bio') || desc.includes('organic')) score += 10;

  return Math.min(score, 100);
}

function computePremium(raw: RawProduct): number {
  let score = 40;
  const marque = (raw.marque || raw.fournisseurLabel || '').toLowerCase();

  const marquesHautDeGamme = ['stanley/stella', 'kariban', 'result', 'regatta'];
  const marquesMid = ['fruit of the loom', 'gildan', 'sg', 'daiber'];

  if (marquesHautDeGamme.some(m => marque.includes(m))) score = 85;
  else if (marquesMid.some(m => marque.includes(m))) score = 60;

  return score;
}
