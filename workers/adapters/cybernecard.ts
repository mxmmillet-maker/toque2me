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

// ─── Adapter Cybernecard ──────────────────────────────────────────────────────

export const CyberneCardAdapter: SupplierAdapter = {
  name: 'cybernecard',

  async fetchProducts(): Promise<RawProduct[]> {
    // À adapter selon la structure réelle de l'API Cybernecard
    // Authentification via Basic Auth (Login: ES47, clé API)
    const response = await fetch('https://cybernecard.fr/api/products', {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.CYBERNECARD_LOGIN}:${process.env.CYBERNECARD_API_KEY}`
        ).toString('base64')}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cybernecard API error: ${response.status}`);
    }

    const data = await response.json();
    // Adapter selon la structure de réponse réelle
    return Array.isArray(data) ? data : (data.products ?? data.items ?? []);
  },

  mapProduct(raw: RawProduct): NormalizedProduct {
    const categorie = (raw.famille || raw.category || '').toLowerCase();
    const typologieKey = Object.keys(TYPOLOGIES_PAR_CATEGORIE)
      .find(k => categorie.includes(k));

    return {
      fournisseur: 'cybernecard',
      ref_fournisseur: raw.reference || raw.ref || raw.id,
      nom: raw.designation || raw.nom || raw.name || '',
      description: raw.description || raw.descriptif || '',
      categorie: raw.famille || raw.category || '',
      image_url: raw.photo_principale || raw.image || raw.photo || '',
      grammage: raw.grammage ? parseInt(raw.grammage) : undefined,
      origine: raw.pays_fabrication || raw.origine || raw.country || '',
      certifications: parseCertifications(raw.labels || raw.certifications || ''),
      normes: NORMES_PAR_CATEGORIE[categorie] || [],
      secteurs: SECTEURS_PAR_CATEGORIE[categorie] || ['entreprise'],
      score_durabilite: computeDurabilite(raw),
      score_premium: computePremium(raw),
      actif: false, // activé manuellement pour les 80 produits de lancement
    };
  },

  async fetchPrices(): Promise<PriceGrid[]> {
    // À implémenter selon l'API Cybernecard
    // Structure attendue : [{reference, paliers: [{qte_min, qte_max, prix_ht}]}]
    const response = await fetch('https://cybernecard.fr/api/prices', {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.CYBERNECARD_LOGIN}:${process.env.CYBERNECARD_API_KEY}`
        ).toString('base64')}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const prices: PriceGrid[] = [];

    for (const item of (Array.isArray(data) ? data : [])) {
      for (const palier of (item.paliers || item.prices || [])) {
        prices.push({
          product_ref: item.reference || item.ref,
          qte_min: palier.qte_min || palier.min || 1,
          qte_max: palier.qte_max || palier.max || null,
          prix_ht: parseFloat(palier.prix_ht || palier.price || 0),
        });
      }
    }

    return prices;
  },
};

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function parseCertifications(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  return raw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}

function computeDurabilite(raw: RawProduct): number {
  let score = 50;
  const grammage = parseInt(raw.grammage || '0');
  if (grammage >= 280) score += 20;
  else if (grammage >= 200) score += 10;

  const labels = (raw.labels || '').toLowerCase();
  if (labels.includes('oeko-tex')) score += 15;
  if (labels.includes('gots')) score += 15;
  if (labels.includes('bio') || labels.includes('organic')) score += 10;

  return Math.min(score, 100);
}

function computePremium(raw: RawProduct): number {
  let score = 40;
  const marque = (raw.marque || raw.brand || '').toLowerCase();

  const marquesHautDeGamme = ['stanley/stella', 'kariban', 'result', 'regatta'];
  const marquesMid = ['fruit of the loom', 'gildan', 'sg'];

  if (marquesHautDeGamme.some(m => marque.includes(m))) score = 85;
  else if (marquesMid.some(m => marque.includes(m))) score = 60;

  return score;
}
