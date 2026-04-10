// ─── Scoring multi-univers ───────────────────────────────────────────────────
// Chaque produit reçoit un score d'affinité [0-1] par univers.
// Les scores se cumulent : un tablier de cuisine bio peut scorer
// hospitality=0.9, santé=0.3, événementiel=0.4
//
// Sources de scoring :
//   1. Type de produit (détecté par product-tagger)
//   2. Marque
//   3. Normes & certifications
//   4. Mots-clés description
//   5. Genre
//   6. Activités API fournisseur

export type Universe =
  | 'hospitality'
  | 'workwear'
  | 'evenementiel'
  | 'sportswear'
  | 'epi'
  | 'sante';

export type UniverseScores = Partial<Record<Universe, number>>;

interface ProductInput {
  nom: string;
  description: string;
  categorie: string;
  marque: string;
  genre?: string;
  normes: string[];
  certifications: string[];
  grammage?: number;
  meta?: {
    activites?: string[];
    genre_structure?: string | null;
    composition?: string | null;
    arguments_vente?: string | null;
    [key: string]: any;
  };
  // Output du product-tagger
  tags?: {
    type?: string;
    famille?: string;
    matiere?: string;
    style?: string[];
    public_cible?: string[];
    niveau_gamme?: string;
    [key: string]: any;
  };
}

// ─── Règles de scoring par univers ──────────────────────────────────────────

interface UniverseRule {
  universe: Universe;
  score: number; // 0-1, sera clampé à 1 max
  condition: (p: ProductInput) => boolean;
}

const RULES: UniverseRule[] = [
  // ═══════════════════════════════════════════════════════════════
  // HOSPITALITY — restauration, hôtellerie, événementiel accueil
  // ═══════════════════════════════════════════════════════════════

  // Types fortement associés
  { universe: 'hospitality', score: 0.9, condition: (p) => matchType(p, ['tablier', 'veste_cuisine', 'pantalon_cuisine']) },
  { universe: 'hospitality', score: 0.7, condition: (p) => matchType(p, ['chemise', 'polo']) },
  { universe: 'hospitality', score: 0.5, condition: (p) => matchType(p, ['t-shirt', 'sweat', 'sweat_zippe']) },
  { universe: 'hospitality', score: 0.4, condition: (p) => matchType(p, ['pantalon', 'bermuda', 'veste']) },

  // Marques hospitality
  { universe: 'hospitality', score: 0.3, condition: (p) => matchBrand(p, ['kariban', 'kariban premium', 'premier', 'brook taverner']) },
  { universe: 'hospitality', score: 0.2, condition: (p) => matchBrand(p, ['native spirit', 'henbury', 'wk']) },

  // Keywords description
  { universe: 'hospitality', score: 0.5, condition: (p) => matchDesc(p, ['restaurant', 'hôtel', 'service', 'accueil', 'réception', 'barman', 'sommelier']) },
  { universe: 'hospitality', score: 0.4, condition: (p) => matchDesc(p, ['cuisine', 'chef', 'cuisinier', 'boulanger']) },
  { universe: 'hospitality', score: 0.3, condition: (p) => matchDesc(p, ['élégant', 'corporate', 'business', 'bureau']) },

  // Linge de bain / spa
  { universe: 'hospitality', score: 0.6, condition: (p) => matchDesc(p, ['serviette', 'peignoir', 'fouta', 'éponge']) },

  // ═══════════════════════════════════════════════════════════════
  // WORKWEAR — BTP, industrie, logistique, maintenance
  // ═══════════════════════════════════════════════════════════════

  // Types workwear
  { universe: 'workwear', score: 0.9, condition: (p) => matchDesc(p, ['multipoches', 'cargo', 'salopette', 'combinaison']) },
  { universe: 'workwear', score: 0.8, condition: (p) => matchType(p, ['softshell', 'parka']) },
  { universe: 'workwear', score: 0.6, condition: (p) => matchType(p, ['veste', 'pantalon', 'bermuda']) && matchDesc(p, ['travail', 'work', 'résistant', 'renforcé']) },
  { universe: 'workwear', score: 0.5, condition: (p) => matchType(p, ['polo', 't-shirt']) && matchDesc(p, ['travail', 'work', 'polycoton']) },

  // Marques workwear
  { universe: 'workwear', score: 0.5, condition: (p) => matchBrand(p, ['wk', 'dickies', 'carhartt', 'u-power', 'result']) },
  { universe: 'workwear', score: 0.3, condition: (p) => matchBrand(p, ['russell', 'puma workwear']) },

  // Normes workwear
  { universe: 'workwear', score: 0.4, condition: (p) => p.normes.some(n => n.includes('EN')) },

  // Keywords
  { universe: 'workwear', score: 0.5, condition: (p) => matchDesc(p, ['chantier', 'atelier', 'industrie', 'manutention', 'logistique']) },
  { universe: 'workwear', score: 0.3, condition: (p) => matchDesc(p, ['polaire', 'bodywarmer', 'doublé']) },

  // ═══════════════════════════════════════════════════════════════
  // ÉVÉNEMENTIEL — salons, festivals, merch, promo
  // ═══════════════════════════════════════════════════════════════

  // T-shirts et sweats = pilier événementiel
  { universe: 'evenementiel', score: 0.7, condition: (p) => matchType(p, ['t-shirt', 'debardeur']) },
  { universe: 'evenementiel', score: 0.6, condition: (p) => matchType(p, ['sweat', 'sweat_zippe']) },
  { universe: 'evenementiel', score: 0.5, condition: (p) => matchType(p, ['polo']) },

  // Casquettes, bonnets, accessoires = merch
  { universe: 'evenementiel', score: 0.8, condition: (p) => matchType(p, ['casquette', 'bonnet', 'chapeau', 'echarpe']) },
  { universe: 'evenementiel', score: 0.6, condition: (p) => matchType(p, ['sac']) },

  // Grand choix de coloris = événementiel
  { universe: 'evenementiel', score: 0.2, condition: (p) => matchDesc(p, ['large choix', 'coloris', 'personnalis']) },

  // Marques événementielles
  { universe: 'evenementiel', score: 0.3, condition: (p) => matchBrand(p, ['ideal basic', 'ideal basic brand', 'k-up', 'flexfit', 'beechfield', 'gildan', 'fruit of the loom']) },
  { universe: 'evenementiel', score: 0.3, condition: (p) => matchBrand(p, ['native spirit', 'kariban', 'bella+canvas', 'build your brand', 'sf clothing']) },

  // Entrée de gamme = promo/événementiel
  { universe: 'evenementiel', score: 0.2, condition: (p) => (p.tags?.niveau_gamme === 'entree') },

  // ═══════════════════════════════════════════════════════════════
  // SPORTSWEAR — sport, fitness, clubs
  // ═══════════════════════════════════════════════════════════════

  // Marque Proact = sportswear
  { universe: 'sportswear', score: 0.8, condition: (p) => matchBrand(p, ['proact']) },

  // Keywords sport
  { universe: 'sportswear', score: 0.7, condition: (p) => matchDesc(p, ['sport', 'training', 'entraînement', 'fitness', 'football', 'padel', 'running']) },
  { universe: 'sportswear', score: 0.6, condition: (p) => matchDesc(p, ['respirant', 'quick dry', 'mesh', 'stretch', 'performance']) },
  { universe: 'sportswear', score: 0.5, condition: (p) => matchDesc(p, ['maillot', 'chasuble', 'survêtement', 'jogging']) },

  // Types sport
  { universe: 'sportswear', score: 0.5, condition: (p) => matchType(p, ['bermuda']) && matchDesc(p, ['sport', 'polyester']) },

  // Matière technique
  { universe: 'sportswear', score: 0.4, condition: (p) => p.tags?.matiere === 'technique' || (p.tags?.style?.includes('sportswear') ?? false) },

  // ═══════════════════════════════════════════════════════════════
  // EPI — Équipements de Protection Individuelle
  // ═══════════════════════════════════════════════════════════════

  // Normes = EPI automatique
  { universe: 'epi', score: 0.9, condition: (p) => p.normes.some(n => n.includes('20471') || n.includes('20345')) },
  { universe: 'epi', score: 0.7, condition: (p) => p.normes.some(n => n.includes('EN')) },

  // Marques EPI
  { universe: 'epi', score: 0.7, condition: (p) => matchBrand(p, ['yoko', 'jsp', 'tiger grip']) },
  { universe: 'epi', score: 0.5, condition: (p) => matchBrand(p, ['u-power', 'result']) && matchDesc(p, ['sécurité', 'safety', 'high viz', 'haute visibilité']) },

  // Keywords EPI
  { universe: 'epi', score: 0.9, condition: (p) => matchDesc(p, ['haute visibilité', 'high viz', 'hi-vis', 'sécurité']) },
  { universe: 'epi', score: 0.8, condition: (p) => matchDesc(p, ['casque', 'protection', 'anti-coupure', 'genouillère']) },
  { universe: 'epi', score: 0.6, condition: (p) => matchDesc(p, ['gant', 'gants']) && matchDesc(p, ['protection', 'manutention', 'coupure']) },

  // Chaussures sécurité
  { universe: 'epi', score: 0.9, condition: (p) => matchType(p, ['chaussure']) && matchDesc(p, ['sécurité', 'safety', 'S1', 'S2', 'S3']) },
  { universe: 'epi', score: 0.5, condition: (p) => matchType(p, ['chaussure']) && matchBrand(p, ['u-power', 'caterpillar', 'carhartt', 'result']) },

  // ═══════════════════════════════════════════════════════════════
  // SANTÉ / BEAUTÉ / HYGIÈNE — cliniques, spa, bien-être
  // ═══════════════════════════════════════════════════════════════

  // Marques médicales
  { universe: 'sante', score: 0.9, condition: (p) => matchBrand(p, ['dickies medical', 'cherokee', 'onna']) },

  // Types santé
  { universe: 'sante', score: 0.7, condition: (p) => matchDesc(p, ['tunique', 'blouse']) && matchDesc(p, ['médical', 'salon', 'labo', 'clinique', 'spa']) },
  { universe: 'sante', score: 0.6, condition: (p) => matchDesc(p, ['antibactérien', 'hygiène', 'lavage haute température']) },

  // Linge spa
  { universe: 'sante', score: 0.7, condition: (p) => matchDesc(p, ['peignoir', 'serviette', 'fouta', 'gant de toilette']) },
  { universe: 'sante', score: 0.5, condition: (p) => matchDesc(p, ['pantoufle', 'calot', 'bandeau éponge']) },

  // Tuniques et blouses en général
  { universe: 'sante', score: 0.4, condition: (p) => matchDesc(p, ['tunique', 'blouse']) },

  // Cache-cœur, col V médical
  { universe: 'sante', score: 0.5, condition: (p) => matchDesc(p, ['cache-cœur', 'cache cœur', 'col v']) && matchBrand(p, ['dickies', 'cherokee', 'onna']) },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function matchType(p: ProductInput, types: string[]): boolean {
  const t = p.tags?.type?.toLowerCase() || '';
  return types.some(type => t === type);
}

function matchBrand(p: ProductInput, brands: string[]): boolean {
  const b = p.marque.toLowerCase().replace(/[®™]/g, '').trim();
  return brands.some(brand => b.includes(brand));
}

function matchDesc(p: ProductInput, keywords: string[]): boolean {
  const haystack = `${p.nom} ${p.description} ${p.meta?.arguments_vente || ''}`.toLowerCase();
  return keywords.some(kw => haystack.includes(kw.toLowerCase()));
}

// ─── Nouveautés (refs tagués "New" par Top Tex) ─────────────────────────────
// Mis à jour depuis le catalogue Top Tex avril 2026.
// On identifie par préfixe de ref pour couvrir les nouvelles gammes entières.

const NOUVEAUTE_PREFIXES = [
  // iDeal Basic Brand — gamme entière = new
  'IB',
  // Nouvelles gammes spécifiques
  'BY',    // Build your Brand
  'BB',    // Bombers Original
  'BE48',  // Bella+Canvas
  'NN',    // Onna
];

const NOUVEAUTE_REFS = new Set([
  // Native Spirit
  'NS777','NS746','NS735','NS623','NS618','NS616','NS614','NS613','NS611',
  'NS460','NS450','NS444','NS443','NS439','NS432','NS401','NS400','NS361',
  'NS360','NS352','NS347','NS313','NS308','NS305','NS300','NS333','NS737',
  'NS736','NS723','NS624','NS604','NS208','NS207',
  // Kariban
  'K940','K8007','K6169','K6168','K595','K584','K583','K489','K488','K478',
  'K476','K474','K473','K4042','K4041','K4040','K383','K382','K381','K380',
  'K359','K358','K357','K356','K3052IC','K3032IC','K3026IC','K3025IC',
  'K3024IC','K3023IC','K273','K272','K255','K254','K244','K243','K242',
  'K241','K842','K800','K7009',
  // Kariban Premium
  'PK505',
  // Spasso
  'SP901','SP900','SP604','SP603','SP600','SP508','SP501','SP404','SP403',
  'SP304','SP303','SP229','SP204','SP729',
  'SP161','SP160','SP159','SP158','SP157','SP156','SP155','SP154','SP153',
  'SP152','SP151','SP150','SP149','SP148','SP147','SP146','SP145','SP144',
  'SP143','SP142','SP141','SP140','SP121','SP120','SP100',
  // WK
  'WK851','WK830','WK750','WK742','WK710','WK708','WK707','WK706','WK700',
  'WK640','WK511','WK510','WK501','WK500','WK317','WK316','WK307','WK306',
  'WK300','WK206',
  // Proact
  'PA970','PA497','PA492','PA479','PA4047','PA4045','PA4025','PA396','PA395',
  'PA394','PA390','PA387','PA379','PA378','PA359','PA358','PA245','PA1046',
  'PA1045','PA1032','PA1030','PA1029','PA1028','PA1009','PA1008','PA096','PA094',
  // K-up
  'KP922','KP921','KP624','KP604','KP563','KP561','KP560','KP533','KP451',
  'KP359','KP358','KP357','KP356','KP355','KP353','KP352','KP351','KP350',
  'KP254','KP250','KP240','KP215','KP211','KP163','KP137','KP130','KP125',
  'KP118','KP116','KP111','KP088','KP064','KP044','KP034','KP015','KP013',
  // B&C
  'CGWG009','CGWG008','CGWG007','CGWG005','CGWG004','CGTU008','CGJG006',
  'CGJG003','CGFG001',
  // Fruit of the Loom
  'SC64066','SC64064','SC62294','SC62292',
  // Russell
  'RU416M','RU265M',
  // Gildan
  'GI75000','GI2000PFD','GI19500','GI19000',
  // Result
  'RC986X','RC985X','R920X','R331X','R244X',
  // Premier
  'PR603','PR024','PR023','PR021',
  // Brook Taverner
  'BT8845','BT8058','BT2404',
  // Henbury
  'H075',
  // Dickies Medical
  'DKE83706',
  // U-Power
  'UPSO40053','UPRR40384','UPRL20282','UPRI20414','UPRI10414','UPRE20134',
  'UPRE20094','UPRE20064','UPRE20036','UPPU80015','UPPU80012','UPPU80010',
  'UPPE145','UPFU187','UPEY366',
  // JSP
  'JSARB170','JSAJB170D','JSAHV220','JSABS000','JSAAF000',
  // Yoko
  'YHVW860','YHVJ330',
  // Crocs
  'CR213298','CR10001',
  // Timberland
  'TB0A275R',
  // Lee
  'L72','L719','L712','L701',
  // Wrangler
  'WR18S','WR15Q','W7H',
  // Buff
  'BUF139717','BUF134914','BUF134911',
  // Towel City
  'TC056','TC014',
  // Flexfit
  'FL9297','FL9293','FL7706','FL6606','FL6560','FL6277','FL180','FL1500KC',
  // Beechfield
  'B653','B191R','B105',
]);

// ─── API publique ───────────────────────────────────────────────────────────

/**
 * Calcule les scores d'affinité par univers pour un produit.
 * Retourne uniquement les univers avec un score > 0, clampés à [0, 1].
 */
export function scoreUniverses(product: ProductInput): UniverseScores {
  const scores: Record<string, number> = {};

  for (const rule of RULES) {
    try {
      if (rule.condition(product)) {
        scores[rule.universe] = (scores[rule.universe] || 0) + rule.score;
      }
    } catch {
      // Ignore rule evaluation errors
    }
  }

  // Clamp à [0, 1]
  const result: UniverseScores = {};
  for (const [universe, score] of Object.entries(scores)) {
    if (score > 0) {
      result[universe as Universe] = Math.min(Math.round(score * 100) / 100, 1);
    }
  }

  return result;
}

/**
 * Vérifie si une ref est tagguée "New" (nouveauté catalogue Top Tex 2026).
 */
export function isNouveaute(ref: string): boolean {
  if (NOUVEAUTE_REFS.has(ref)) return true;
  return NOUVEAUTE_PREFIXES.some(prefix => ref.startsWith(prefix));
}

/**
 * Parse le genre depuis le champ API fournisseur.
 */
export function parseGenre(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('femme') || lower.includes('woman') || lower.includes('female') || lower.includes('lady')) return 'femme';
  if (lower.includes('homme') || lower.includes('man') || lower === 'male') return 'homme';
  if (lower.includes('enfant') || lower.includes('kid') || lower.includes('child') || lower.includes('junior')) return 'enfant';
  if (lower.includes('unisex') || lower.includes('mixte')) return 'unisexe';
  return 'unisexe'; // défaut
}
