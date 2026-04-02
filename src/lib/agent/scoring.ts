import { getNormesObligatoires } from './normes';
import { tagProduct } from '@/lib/product-tagger';
import { productMatchesColors } from '@/lib/color-normalizer';

export interface ScoringCriteria {
  typologies?: string[];     // pièces sélectionnées (catégories)
  secteur?: string;
  budget_global?: number;    // budget total HT
  nb_personnes?: number;     // effectif à équiper
  usage?: string;            // 'evenement' | 'quotidien' | 'image'
  style?: string;            // 'casual' | 'chic' | 'sportswear' | 'classique'
  repartition_hf?: string;   // 'homme' | 'femme' | 'mixte'
  couleurs?: string[];       // couleurs demandées (noir, marine, etc.)
  priorites?: {
    durabilite: number;
    origine: number;
    rapidite: number;
  };
}

export interface ScoredProduct {
  id: string;
  nom: string;
  ref_fournisseur: string;
  categorie: string;
  description: string;
  image_url: string;
  grammage?: number;
  origine: string;
  certifications: string[];
  normes: string[];
  secteurs: string[];
  score_durabilite: number;
  score_premium: number;
  prix_vente_ht?: number;
  genre: 'Homme' | 'Femme' | 'Enfant' | 'Unisexe';
  stock_bas?: boolean;
  variante?: { ref: string; genre: string; nom: string };
  tags?: {
    usages: string[];
    saison: string[];
    style: string[];
    public_cible: string[];
    niveau_gamme: string;
    lavage_max: number;
    techniques_marquage: string[];
    qualite_matiere: string;
  };
  score: number;
}

const DEFAULT_PRIORITIES = {
  durabilite: 50,
  origine: 30,
  rapidite: 20,
};

/** Détecte le style vestimentaire depuis le nom et la description */
export function detectStyle(nom: string, description: string, categorie: string): 'casual' | 'chic' | 'sportswear' | 'classique' {
  const text = `${nom} ${description}`.toLowerCase();
  const cat = categorie.toLowerCase();

  // Détection marque (dernier mot du nom souvent = marque)
  const marque = nom.split(' ').pop()?.toLowerCase() || '';

  // Daiber distribue James & Nicholson (workwear) et Myrtle Beach (casquettes)
  // On détecte la sous-marque dans le nom/description
  const isJamesNicholson = text.includes('james') && text.includes('nicholson');
  const isMyrtle = text.includes('myrtle') || text.includes('myrtle beach');
  const effectiveMarque = isJamesNicholson ? 'james nicholson'
    : isMyrtle ? 'myrtle beach'
    : marque;

  // Marques connues → style direct
  const MARQUES_CLASSIQUE = ['cxs', 'portwest', 'cerva', 'deltaplus', 'coverguard', 'würth', 'james nicholson'];
  const MARQUES_CHIC = ['stanley/stella', 'kariban', 'neoblu', 'native spirit', 'halfar'];
  const MARQUES_SPORTSWEAR = ['spiro', 'tombo', 'gamegear'];

  if (MARQUES_CLASSIQUE.includes(effectiveMarque)) return 'classique';
  if (MARQUES_CHIC.some(m => text.includes(m) || effectiveMarque === m)) return 'chic';
  if (MARQUES_SPORTSWEAR.includes(effectiveMarque)) return 'sportswear';

  // FARE = parapluies, Daiber / Malfini / Myrtle Beach = lifestyle casual
  if (['fare', 'myrtle beach', 'malfini'].includes(effectiveMarque)) return 'casual';

  // Sportswear : matières techniques, sport, polyester/élasthanne
  if (
    text.includes('sport') || text.includes('running') || text.includes('fitness') ||
    text.includes('respirant') || text.includes('stretch') || text.includes('technique') ||
    text.includes('softshell') || text.includes('coupe-vent') || text.includes('windbreaker') ||
    text.includes('spandex') || text.includes('lycra') ||
    text.includes('mesh') || text.includes('dry fit') || text.includes('coolmax') ||
    text.includes('fonctionnel') ||
    (text.includes('polyester') && !text.includes('coton'))
  ) return 'sportswear';

  // Classique/Pro : vêtements de travail, EPI, chemises
  if (
    text.includes('travail') || text.includes('multirisque') || text.includes('sécurité') ||
    text.includes('haute visibilité') || text.includes('chemise') || text.includes('oxford') ||
    text.includes('cotte') || text.includes('blouse') || text.includes('salopette') ||
    text.includes('ignifugé') || text.includes('antistatique') ||
    text.includes('popeline') || text.includes('twill') ||
    cat.includes('tablier') || cat.includes('pantalon')
  ) return 'classique';

  // Casual chic : polo piqué, coton peigné, coupes ajustées
  if (
    text.includes('polo') || text.includes('piqué') ||
    text.includes('premium') || text.includes('luxury') || text.includes('supima') ||
    text.includes('ajusté') || text.includes('slim') || text.includes('fitted') ||
    text.includes('peigné') || text.includes('mercerisé') || text.includes('interlock') ||
    text.includes('velours') || text.includes('french terry') ||
    text.includes('col boutonné') || text.includes('patte de boutonnage')
  ) return 'chic';

  // Casual par défaut : t-shirts basiques, sweats, hoodies
  return 'casual';
}

/** Détecte le genre depuis le nom du produit */
export function detectGenre(nom: string): 'Homme' | 'Femme' | 'Enfant' | 'Unisexe' {
  const lower = nom.toLowerCase();
  if (lower.includes('enfant') || lower.includes('junior') || lower.includes('kids') || lower.includes('bébé')) return 'Enfant';
  if (lower.includes(' femme') || lower.includes(' lady') || lower.includes(' ladies') || lower.includes(' fille')) return 'Femme';
  if (lower.includes(' homme') || lower.includes(' men') || lower.includes(' garçon')) return 'Homme';
  return 'Unisexe';
}

export function scoreProducts(
  products: any[],
  criteria: ScoringCriteria,
  prixMap: Map<string, number>
): ScoredProduct[] {
  const normesRequises = criteria.secteur ? getNormesObligatoires(criteria.secteur) : [];
  const priorites = criteria.priorites || DEFAULT_PRIORITIES;

  // Budget par personne (pour filtrer les produits trop chers)
  const budgetParPersonne = (criteria.budget_global && criteria.nb_personnes)
    ? criteria.budget_global / criteria.nb_personnes
    : undefined;

  // Pondération qualité selon l'usage
  const usageWeights: Record<string, { durabilite: number; premium: number }> = {
    evenement: { durabilite: 0.1, premium: 0.2 },   // pas besoin de durer, budget serré
    quotidien: { durabilite: 0.4, premium: 0.2 },   // doit tenir dans le temps
    image: { durabilite: 0.3, premium: 0.5 },        // finitions et rendu importants
  };
  const weights = usageWeights[criteria.usage || 'quotidien'] || usageWeights.quotidien;

  const scored: ScoredProduct[] = [];

  for (const p of products) {
    let score = 0;

    // 0. Exclure les produits enfant + filtrer par genre + détecter style
    const genre = detectGenre(p.nom || '');
    if (genre === 'Enfant') continue;

    // Filtrage genre : exclure les produits du genre opposé selon la répartition H/F
    const rep = criteria.repartition_hf;
    if (rep === '100h' && genre === 'Femme') continue;
    if (rep === '100f' && genre === 'Homme') continue;
    // Majorité : on garde tout mais on pénalise le genre minoritaire
    if (rep === 'maj_h' && genre === 'Femme') score -= 15;
    if (rep === 'maj_f' && genre === 'Homme') score -= 15;

    // Filtrage couleur : pénaliser les produits qui n'ont pas les couleurs demandées
    if (criteria.couleurs && criteria.couleurs.length > 0 && !criteria.couleurs.includes('marque')) {
      if (!productMatchesColors(p.couleurs, criteria.couleurs)) {
        score -= 30;
      } else {
        score += 10;
      }
    }

    // Style manuel (depuis la base) prime sur la détection auto
    const productStyle = p.style || detectStyle(p.nom || '', p.description || '', p.categorie || '');

    // 1. Filtre par pièces sélectionnées
    if (criteria.typologies && criteria.typologies.length > 0) {
      const cat = (p.categorie || '').toLowerCase();
      const match = criteria.typologies.some((t) => cat.toLowerCase().includes(t.toLowerCase()));
      if (!match) continue;
    }

    // 2. Conformité normes — BONUS (pas éliminatoire tant que les données ne sont pas complètes)
    if (normesRequises.length > 0) {
      const productNormes = p.normes || [];
      const conforme = normesRequises.every((n: string) => productNormes.includes(n));
      if (conforme) score += 20;
    }

    // 3. Prix — exclure les produits sans prix (non chiffrables) et ceux qui dépassent le budget
    const prixVente = prixMap.get(p.id);
    if (!prixVente) continue; // pas de prix = pas proposable
    if (budgetParPersonne && prixVente > budgetParPersonne) {
      continue;
    }

    // 4. Calcul du score

    // Durabilité (pondérée par usage)
    score += (p.score_durabilite || 50) * weights.durabilite;

    // Premium / finitions (pondérée par usage)
    score += (p.score_premium || 50) * weights.premium;

    // Bonus si le produit a un prix (tous en ont maintenant grâce au filtre ci-dessus)
    score += 8;

    // Score prix — favorise les produits qui laissent de la marge
    // pour d'autres pièces dans le mix
    if (prixVente && budgetParPersonne) {
      const ratio = prixVente / budgetParPersonne;
      if (ratio < 0.5) score += 10;       // laisse beaucoup de marge pour un mix
      else if (ratio < 0.8) score += 5;   // correct
    }

    // Origine Europe
    const origine = (p.origine || '').toLowerCase();
    const isEurope = ['france', 'portugal', 'italie', 'espagne', 'allemagne', 'belgique'].some(
      (pays) => origine.includes(pays)
    );
    if (isEurope) score += 10 * (priorites.origine / 100);

    // Tags contextuels
    const productTags = tagProduct({
      nom: p.nom || '',
      description: p.description || '',
      categorie: p.categorie || '',
      grammage: p.grammage,
      prix_vente_ht: prixVente,
      certifications: p.certifications || [],
      normes: p.normes || [],
    });

    // Bonus style — fort bonus si le style du produit matche le style demandé
    if (criteria.style && productTags.style.includes(criteria.style)) score += 15;
    else if (criteria.style && productStyle === criteria.style) score += 10;

    // ── Pénalités produits inadaptés au contexte ──────────────────────────
    const nomLower = (p.nom || '').toLowerCase();
    const descLower = (p.description || '').toLowerCase();
    const sect = criteria.secteur || '';
    const sty = criteria.style || '';

    // Produits globalement rares en pro
    if (nomLower.includes('bermuda') || nomLower.includes('short')) score -= 50;
    if (nomLower.includes('dentelle') || nomLower.includes('brassière') || nomLower.includes('lingerie')) score -= 50;
    if (nomLower.includes('débardeur') || nomLower.includes('fines bretelles')) score -= 25;
    // Accessoires de tablier (pas un vrai tablier)
    if ((nomLower.includes('lani') && nomLower.includes('tablier')) || nomLower.includes('attache pour tablier') || nomLower.includes('set d')) {
      score -= 50;
    }
    // Accessoires : cravates, écharpes, foulards = pas des couvre-chefs
    if (nomLower.includes('cravate') || nomLower.includes('noeud papillon') || nomLower.includes('foulard') || nomLower.includes('écharpe')) {
      score -= 20;
    }

    // Favoriser les produits unis (pas rayés, bicolores, marinières, camouflage)
    if (nomLower.includes('rayé') || nomLower.includes('rayure') || nomLower.includes('stripe') ||
        nomLower.includes('marinière') || nomLower.includes('bicolore') || nomLower.includes('camo') ||
        nomLower.includes('camouflage') || nomLower.includes('tartan') || nomLower.includes('checked') ||
        nomLower.includes('carreaux')) {
      score -= 15; // unis en premier par défaut
    }

    // Oversize / épaules tombantes → pas classique, pas BTP, pas resto
    if ((nomLower.includes('oversize') || nomLower.includes('épaules tombantes')) &&
        (sty === 'classique' || sect === 'btp' || sect === 'restauration' || sect === 'industrie')) {
      score -= 25;
    }

    // Éponge → casual/plage, inadapté en contexte pro
    if (nomLower.includes('éponge')) {
      if (sect === 'btp' || sect === 'industrie' || sect === 'restauration') score -= 30;
      else if (sty === 'classique' || sty === 'chic') score -= 25;
    }

    // Molleton / jogging → pas classique, pas chic, pas service en salle
    if ((nomLower.includes('molleton') || nomLower.includes('jogging')) &&
        (sty === 'classique' || sty === 'chic')) {
      score -= 30;
    }

    // Sherpa / velours côtelé → casual, pas salon pro ni classique
    if ((nomLower.includes('sherpa') || nomLower.includes('velours côtelé')) &&
        (sty === 'classique' || sty === 'chic')) {
      score -= 20;
    }

    // Doudoune → pas adapté en intérieur (resto, bureau)
    if (nomLower.includes('doudoune') &&
        (sect === 'restauration' || (sect === 'entreprise' && sty !== 'sportswear'))) {
      score -= 20;
    }

    // French Terry (t-shirt épais) → pas pour BTP/industrie (trop fragile) ni classique
    if (nomLower.includes('french terry') && (sect === 'btp' || sect === 'industrie' || sty === 'classique')) {
      score -= 15;
    }

    // ── Bonus produits bien adaptés au contexte ──────────────────────────

    // Restauration : bonus produits métier
    if (sect === 'restauration') {
      if (nomLower.includes('tablier') && !nomLower.includes('lanière') && !nomLower.includes('attache') && !nomLower.includes('set d')) score += 20;
      if (nomLower.includes('chino')) score += 10;
      if (nomLower.includes('maille piquée') && !nomLower.includes('épaules tombantes')) score += 10;
      if (nomLower.includes('cuisine') || nomLower.includes('chef') || nomLower.includes('cuisinier')) score += 25;
      if (nomLower.includes('pantalon de cuisine') || nomLower.includes('pantalon cuisine')) score += 20;
      if (nomLower.includes('veste de cuisine') || nomLower.includes('veste chef')) score += 25;
      if (nomLower.includes('toque') || nomLower.includes('calot')) score += 10;
      if (nomLower.includes('bavette') && !nomLower.includes('lanière')) score += 10; // tablier à bavette
      if (nomLower.includes('lavage haute température') || nomLower.includes('60°') || descLower.includes('60°')) score += 10;
      // Pénalité : produits inadaptés en cuisine
      if (nomLower.includes('jardinage') || nomLower.includes('jardinier') || nomLower.includes('métallurgie')) score -= 30;
    }

    // BTP/Industrie : bonus vêtements résistants, haute visibilité
    if (sect === 'btp' || sect === 'industrie') {
      if (nomLower.includes('haute visibilité') || nomLower.includes('hi-viz') || nomLower.includes('fluo')) score += 15;
      if (nomLower.includes('multipoches') || nomLower.includes('cargo')) score += 10;
      if (nomLower.includes('softshell') || nomLower.includes('parka')) score += 10;
    }

    // Corporate/Entreprise : bonus chemises, polos classiques
    if (sect === 'entreprise') {
      if (nomLower.includes('chemise')) score += 10;
      if (nomLower.includes('maille piquée') && !nomLower.includes('épaules tombantes')) score += 10;
      if (nomLower.includes('oxford') || nomLower.includes('popeline')) score += 10;
    }

    // Sportswear : bonus matières techniques
    if (sty === 'sportswear') {
      if (nomLower.includes('technique') || nomLower.includes('respirant') || nomLower.includes('sport')) score += 10;
      if (nomLower.includes('zippé')) score += 5;
    }

    // ── Style × catégorie × produit ────────────────────────────────────
    const cat = (p.categorie || '').toLowerCase();

    // Chic : chemise > polo > chino > t-shirt
    if (sty === 'chic') {
      if (nomLower.includes('piqué') && !nomLower.includes('épaules tombantes')) score += 10;
      if (nomLower.includes('oxford') || nomLower.includes('popeline') || nomLower.includes('premium')) score += 10;
      if (cat === 'chemises') score += 10;
      if (cat === 'polos') score += 8;
      if (nomLower.includes('chino')) score += 10;
      if (nomLower.includes('jean') || nomLower.includes('denim')) score -= 5;
    }

    // Casual : t-shirt > sweat > jean > polo, chemise moins
    if (sty === 'casual') {
      if (cat === 't-shirts' || cat === 'sweats') score += 8;
      if (cat === 'chemises') score -= 10;
      if (nomLower.includes('jean') || nomLower.includes('denim')) score += 5;
      if (nomLower.includes('chino')) score += 3; // chino ok en casual mais moins que jean
    }

    // Classique : chemise > polo > chino, pas de jean
    if (sty === 'classique') {
      if (cat === 'chemises') score += 12;
      if (cat === 'polos') score += 8;
      if (nomLower.includes('chino')) score += 10;
      if (nomLower.includes('jean') || nomLower.includes('denim')) score -= 10;
    }

    // Sportswear : matières techniques, pas de chemise ni chino
    if (sty === 'sportswear') {
      if (nomLower.includes('technique') || nomLower.includes('respirant') || nomLower.includes('sport') || nomLower.includes('proact')) score += 10;
      if (nomLower.includes('zippé')) score += 5;
      if (cat === 'chemises') score -= 15;
      if (nomLower.includes('chino')) score -= 10;
    }

    // Bonus secteur
    if (criteria.secteur && (p.secteurs || []).includes(criteria.secteur)) score += 8;

    // Bonus certifications
    if (p.certifications && p.certifications.length > 0) score += p.certifications.length * 3;

    scored.push({
      id: p.id,
      nom: p.nom,
      ref_fournisseur: p.ref_fournisseur,
      categorie: p.categorie || '',
      description: p.description || '',
      image_url: p.image_url || '',
      grammage: p.grammage,
      origine: p.origine || '',
      certifications: p.certifications || [],
      normes: p.normes || [],
      secteurs: p.secteurs || [],
      score_durabilite: p.score_durabilite || 50,
      score_premium: p.score_premium || 50,
      prix_vente_ht: prixVente,
      genre,
      stock_bas: p.stock_bas ?? undefined,
      tags: {
        usages: productTags.usages,
        saison: productTags.saison,
        style: productTags.style,
        public_cible: productTags.public_cible,
        niveau_gamme: productTags.niveau_gamme,
        lavage_max: productTags.lavage_max,
        techniques_marquage: productTags.techniques_marquage,
        qualite_matiere: productTags.qualite_matiere,
      },
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function getTop(products: ScoredProduct[], n: number): ScoredProduct[] {
  if (products.length <= n) return products;

  // Clé de modèle : on retire Homme/Femme/Unisexe du nom pour détecter les variantes H/F
  const modelKey = (nom: string) =>
    nom.toLowerCase()
      .replace(/\b(homme|femme|lady|ladies|men|women|unisexe|mixte)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Index par modèle pour trouver les variantes H/F
  const modelMap = new Map<string, ScoredProduct[]>();
  for (const p of products) {
    const mk = modelKey(p.nom);
    if (!modelMap.has(mk)) modelMap.set(mk, []);
    modelMap.get(mk)!.push(p);
  }

  // Attacher la variante H/F à chaque produit
  for (const p of products) {
    if (p.genre === 'Unisexe') continue;
    const mk = modelKey(p.nom);
    const variants = modelMap.get(mk) || [];
    const other = variants.find(v => v.ref_fournisseur !== p.ref_fournisseur && v.genre !== p.genre && v.genre !== 'Unisexe');
    if (other) {
      p.variante = { ref: other.ref_fournisseur, genre: other.genre, nom: other.nom };
    }
  }

  // Diversifier : un produit par catégorie, pas de doublons H/F du même modèle
  const picked: ScoredProduct[] = [];
  const seenCategories = new Set<string>();
  const seenRefs = new Set<string>();
  const seenModels = new Set<string>();

  // Seuil minimum : ne pas proposer de produits avec un score trop faible
  const minScore = products.length > 0 ? Math.max(products[0].score * 0.3, 10) : 10;

  // Pass 1 : meilleur produit de chaque catégorie (si score suffisant)
  for (const p of products) {
    if (picked.length >= n) break;
    if (p.score < minScore) continue;
    const cat = p.categorie.toLowerCase();
    const mk = modelKey(p.nom);
    if (!seenCategories.has(cat) && !seenRefs.has(p.ref_fournisseur) && !seenModels.has(mk)) {
      picked.push(p);
      seenCategories.add(cat);
      seenRefs.add(p.ref_fournisseur);
      seenModels.add(mk);
    }
  }

  // Pass 2 : compléter avec les meilleurs restants (sans doublons)
  for (const p of products) {
    if (picked.length >= n) break;
    if (p.score < minScore) continue;
    const mk = modelKey(p.nom);
    if (!seenRefs.has(p.ref_fournisseur) && !seenModels.has(mk)) {
      picked.push(p);
      seenRefs.add(p.ref_fournisseur);
      seenModels.add(mk);
    }
  }

  return picked;
}
