import { SupplierAdapter, RawProduct, NormalizedProduct, PriceGrid, Variante } from '../lib/types';

// ─── Normes et typologies par catégorie Cybernecard ──────────────────────────

const NORMES_PAR_CATEGORIE: Record<string, string[]> = {
  'cuisine':        ['HACCP'],
  'btp-hv':         ['EN-ISO-20471'],
  'btp-antistatic': ['EN1149-5'],
  'soudure':        ['EN-ISO-11612'],
};

// ─── Extraction automatique des normes depuis une description produit ──────
// Détecte tous les codes de normes européennes EN / EN ISO dans le texte.
// Exemples détectés :
//   "Norme EN ISO 20471 classe 2" → EN-ISO-20471
//   "EN 1149-5 antistatique" → EN1149-5
//   "Conforme EN 343, EN 13034 type 6" → EN343, EN13034
//   "EN ISO 11612 A1 B1 C1" → EN-ISO-11612
const NORME_PATTERNS: { regex: RegExp; normalize: (m: RegExpMatchArray) => string }[] = [
  // EN ISO 20471, EN ISO 11612, EN ISO 11611, EN ISO 13688, EN ISO 13982, EN ISO 14116
  { regex: /\bEN[\s-]*ISO[\s-]+(\d{4,5})(?:-(\d+))?\b/gi, normalize: m => `EN-ISO-${m[1]}${m[2] ? '-' + m[2] : ''}` },
  // EN 1149-5, EN 343, EN 13034-6, EN 381, EN 471
  { regex: /\bEN[\s-]+(\d{3,5})(?:-(\d+))?\b/gi, normalize: m => `EN${m[1]}${m[2] ? '-' + m[2] : ''}` },
  // EN 166 (lunettes), EN 388 (gants), EN 397 (casques)
  // Already matched by the pattern above
];

// Normes "non-EN" détectables par mot-clé
const KEYWORD_NORMES: { keywords: string[]; code: string }[] = [
  { keywords: ['haccp'], code: 'HACCP' },
  { keywords: ['oeko-tex', 'oekotex', 'œko-tex', 'œkotex'], code: 'OEKO-TEX' },
  { keywords: ['iso 9001'], code: 'ISO-9001' },
  { keywords: ['gots'], code: 'GOTS' },
  { keywords: ['reach'], code: 'REACH' },
];

export function extractNormesFromDescription(description: string): string[] {
  if (!description) return [];
  const found = new Set<string>();

  // Regex EN / EN ISO
  for (const { regex, normalize } of NORME_PATTERNS) {
    const matches = Array.from(description.matchAll(regex));
    for (const m of matches) {
      const code = normalize(m);
      // Filtre : éviter les faux positifs (ex: "EN 2024" année, "EN 100" trop court)
      const num = parseInt(code.replace(/[^\d]/g, ''));
      if (num >= 300 && num <= 99999) {
        found.add(code);
      }
    }
  }

  // Keywords
  const lower = description.toLowerCase();
  for (const { keywords, code } of KEYWORD_NORMES) {
    if (keywords.some(k => lower.includes(k))) found.add(code);
  }

  return Array.from(found);
}

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
      normes: Array.from(new Set([
        ...(NORMES_PAR_CATEGORIE[categorie] || []),
        ...extractNormesFromDescription(raw.descriptionArticleCatalogue || ''),
      ])),
      secteurs: SECTEURS_PAR_CATEGORIE[categorie] || ['entreprise'],
      score_durabilite: computeDurabilite(raw, grammage),
      score_premium: computePremium(raw),
      stock_bas: stockBas,
      variantes: extractVariantes(raw),
      marquage_dispo: extractMarquageDispo(raw),
      meta: parseDescriptionMeta(raw.descriptionArticleCatalogue || '', nomProduit),
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

// ─── Parsing structuré de la description ────────────────────────────────────

function parseDescriptionMeta(description: string, nomProduit: string): Record<string, any> {
  const lines = description.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const lower = description.toLowerCase();
  const nomLower = nomProduit.toLowerCase();

  // Col
  let col: string | null = null;
  const colMatch = lower.match(/col\s+(rond|v|boutonné|montant|cheminé|polo|mao|officier)/);
  if (colMatch) col = colMatch[1];

  // Capuche
  const capuche = lower.includes('capuche');

  // Coupe
  let coupe: string | null = null;
  const coupeMatch = lower.match(/coupe\s+(cintrée|droite|ajustée|ample|oversize|regular|slim|loose)/);
  if (coupeMatch) coupe = coupeMatch[1];

  // Fermeture
  let fermeture: string | null = null;
  if (lower.includes('full zip') || lower.includes('zip intégral') || lower.includes('zip integral'))
    fermeture = 'full zip';
  else if (lower.includes('quart zip') || lower.includes('1/4 zip') || lower.includes('quarter zip'))
    fermeture = 'quart zip';
  else if (lower.includes('demi zip') || lower.includes('1/2 zip') || lower.includes('half zip'))
    fermeture = 'demi zip';
  else if (/fermeture.*bouton|boutonné/i.test(lower))
    fermeture = 'boutonné';

  // Maille
  let maille: string | null = null;
  const mailleKeywords: [string, string][] = [
    ['molletonné', 'molletonné'],
    ['molletonnée', 'molletonné'],
    ['piqué', 'piqué'],
    ['jersey', 'jersey'],
    ['interlock', 'interlock'],
    ['polaire', 'polaire'],
    ['micro-polaire', 'micro-polaire'],
    ['micropolaire', 'micro-polaire'],
    ['nid d\'abeille', 'nid d\'abeille'],
    ['mesh', 'mesh'],
    ['éponge', 'éponge'],
  ];
  for (const [kw, label] of mailleKeywords) {
    if (lower.includes(kw)) { maille = label; break; }
  }

  // Composition — look for lines matching "XX% matière"
  let composition: string | null = null;
  for (const line of lines) {
    if (/\d+\s*%\s*[a-zéèêëàâùûîïôöüçæœ]+/i.test(line) && !/lavable/i.test(line)) {
      composition = line;
      break;
    }
  }

  // Lavage max
  let lavage_max: number | null = null;
  const lavageMatch = lower.match(/(?:lavable\s+[àa]\s+)?(\d+)\s*°\s*c/);
  if (lavageMatch) lavage_max = parseInt(lavageMatch[1]);

  // Poches
  let poches: string | null = null;
  for (const line of lines) {
    if (/poche/i.test(line)) { poches = line; break; }
  }

  // Coutures
  let coutures: string | null = null;
  for (const line of lines) {
    if (/double couture|surpiq[uû]re/i.test(line)) { coutures = line; break; }
  }

  // Genre (from product name)
  let genre_structure: string | null = null;
  if (/\bhomme\b/i.test(nomLower)) genre_structure = 'Homme';
  else if (/\bfemme\b/i.test(nomLower)) genre_structure = 'Femme';
  else if (/\bunisexe\b|\bmixte\b/i.test(nomLower)) genre_structure = 'Unisexe';
  else if (/\benfant\b|\bjunior\b|\bkid/i.test(nomLower)) genre_structure = 'Enfant';

  // Arguments de vente — first line if it's descriptive (not the product name)
  let arguments_vente: string | null = null;
  if (lines.length > 0) {
    const firstLine = lines[0];
    // Skip if first line looks like composition or is too short
    if (firstLine.length > 10 && !/^\d+\s*%/.test(firstLine) && !/^\d+\s*gr/.test(firstLine)) {
      arguments_vente = firstLine;
    }
  }

  return {
    col,
    capuche,
    coupe,
    fermeture,
    maille,
    composition,
    lavage_max,
    poches,
    coutures,
    genre_structure,
    arguments_vente,
  };
}

// ─── Extraction variantes (tailles/couleurs) ────────────────────────────────

function extractVariantes(raw: RawProduct): Variante[] {
  // Priorité 1 : serials — contient stock exact par taille/couleur
  const serials = raw.serials || raw.Serials || [];
  if (Array.isArray(serials) && serials.length > 0) {
    const variantes: Variante[] = [];
    for (const s of serials) {
      const couleur = s.couleur || s.color || s.libelleCouleur || '';
      const taille = s.taille || s.size || s.libelleTaille || '';
      const sku = s.serialNumber || s.serial || s.sku || s.code || '';
      const photo = s.photo || s.image || '';
      const stockQty = s.stock ?? s.quantite ?? s.qty ?? null;
      const stock = typeof stockQty === 'number' ? stockQty > 0 : null;

      if (!couleur && !taille && !sku) continue;

      variantes.push({ sku, couleur, taille, stock, ean: s.ean || s.ean13 || '' });
    }
    if (variantes.length > 0) return variantes;
  }

  // Fallback : déclinaisons imbriquées dans l'article
  const declinaisons = raw.declinaisons
    || raw.variantes
    || raw.skus
    || raw.articleDeclinaisons
    || raw.ArticleDeclinaisons
    || [];

  if (!Array.isArray(declinaisons) || declinaisons.length === 0) return [];

  const variantes: Variante[] = [];

  for (const d of declinaisons) {
    const sku = d.sku
      || d.codeSku
      || d.codeDeclinaison
      || d.reference
      || d.code
      || '';

    const couleur = d.couleur
      || d.libelleCouleur
      || d.color
      || d.colorLabel
      || d.nomCouleur
      || '';

    const taille = d.taille
      || d.libelleTaille
      || d.size
      || d.sizeLabel
      || d.nomTaille
      || '';

    const ean = d.ean
      || d.ean13
      || d.codeEan
      || d.gtin
      || d.codeBarres
      || '';

    // Stock : boolean ou numérique, on normalise en boolean | null
    let stock: boolean | null = null;
    const rawStock = d.stock ?? d.enStock ?? d.disponible ?? d.stockDisponible ?? null;
    if (rawStock !== null && rawStock !== undefined) {
      if (typeof rawStock === 'boolean') stock = rawStock;
      else if (typeof rawStock === 'number') stock = rawStock > 0;
      else if (typeof rawStock === 'string') stock = rawStock.toLowerCase() !== '0' && rawStock.toLowerCase() !== 'false';
    }

    if (!couleur && !taille && !sku) continue;

    variantes.push({ sku, couleur, taille, stock, ean });
  }

  return variantes;
}

// ─── Extraction techniques de marquage ──────────────────────────────────────

function extractMarquageDispo(raw: RawProduct): string[] {
  // Cybernecard peut fournir les techniques dans divers champs
  const techniques = raw.techniquesMarquage
    || raw.marquages
    || raw.techniques
    || raw.printingTechniques
    || raw.techniquesImpression
    || [];

  if (Array.isArray(techniques) && techniques.length > 0) {
    return techniques
      .map((t: any) => {
        if (typeof t === 'string') return t.trim();
        return (t.libelle || t.label || t.nom || t.technique || '').trim();
      })
      .filter(Boolean);
  }

  // Fallback : parser la description pour détecter les techniques courantes
  const desc = (raw.descriptionArticleCatalogue || '').toLowerCase();
  const detected: string[] = [];

  const TECHNIQUES: [string[], string][] = [
    [['sérigraphie', 'serigraphie', 'screen print'], 'Sérigraphie'],
    [['broderie', 'embroidery'], 'Broderie'],
    [['transfert', 'transfer'], 'Transfert'],
    [['sublimation'], 'Sublimation'],
    [['gravure', 'engraving', 'laser'], 'Gravure laser'],
    [['impression numérique', 'impression numerique', 'digital print', 'dtg'], 'Impression numérique'],
    [['flocage', 'flex'], 'Flocage'],
    [['tampographie', 'pad print'], 'Tampographie'],
  ];

  for (const [keywords, label] of TECHNIQUES) {
    if (keywords.some(kw => desc.includes(kw))) {
      detected.push(label);
    }
  }

  return detected;
}
