import { ScoredProduct } from './scoring';
import { getNormeLabel } from './normes';

interface PromptContext {
  products: ScoredProduct[];
  secteur?: string;
  budget_global?: number;
  nb_personnes?: number;
  typologies?: string[];
  usage?: string;
  style?: string;
  type_etablissement?: string;
}

const USAGE_LABELS: Record<string, string> = {
  evenement: 'Événement ponctuel — porté quelques fois',
  quotidien: 'Usage quotidien — doit durer dans le temps',
  image: 'Image de marque — représente l\'entreprise',
};

const STYLE_LABELS: Record<string, string> = {
  casual: 'Casual / Décontracté — confort et simplicité',
  chic: 'Casual chic — élégant mais accessible',
  sportswear: 'Sportswear — dynamique et moderne',
  classique: 'Classique / Pro — sobre et professionnel',
};

const ETABLISSEMENT_LABELS: Record<string, string> = {
  bistro: 'Bistro / Brasserie',
  gastronomique: 'Restaurant gastronomique',
  'fast-food': 'Fast-food / Snack',
  traiteur: 'Traiteur / Événementiel',
  boulangerie: 'Boulangerie / Pâtisserie',
  hotel: 'Hôtel / Hébergement',
};

export function buildSystemPrompt(ctx: PromptContext): string {
  const normeWarning = ctx.secteur ? getNormeLabel(ctx.secteur) : '';
  const budgetParPersonne = (ctx.budget_global && ctx.nb_personnes)
    ? Math.round(ctx.budget_global / ctx.nb_personnes)
    : null;

  const productList = ctx.products
    .map(
      (p, i) =>
        `${i + 1}. **${p.nom}** (Réf. ${p.ref_fournisseur})
   - Catégorie : ${p.categorie}
   - Grammage : ${p.grammage ? p.grammage + ' g/m²' : 'N/A'}
   - Origine : ${p.origine || 'N/A'}
   - Certifications : ${p.certifications.length > 0 ? p.certifications.join(', ') : 'aucune'}
   - Normes : ${p.normes.length > 0 ? p.normes.join(', ') : 'aucune'}
   - Durabilité : ${p.score_durabilite}/100 | Premium : ${p.score_premium}/100
   - Prix vente HT : ${p.prix_vente_ht ? p.prix_vente_ht.toFixed(2) + ' €/pce' : 'sur devis'}`
    )
    .join('\n\n');

  return `Tu es l'assistant expert de Toque2Me, plateforme de textile et objets personnalisés pour professionnels.

## RÈGLES ABSOLUES (non négociables)

1. JAMAIS plus de 4 produits proposés dans une réponse
2. TOUJOURS respecter les normes OBLIGATOIRES du secteur client
3. JAMAIS mentionner le nom du fournisseur source (Cybernecard, Toptex, etc.)
4. JAMAIS afficher les prix d'achat, marges, ou coefficients
5. TOUJOURS inclure la référence produit (Réf.) pour chaque produit proposé
6. Si le budget est insuffisant → le dire honnêtement et proposer des alternatives
7. Réponses concises, professionnelles, chaleureuses
8. Prix toujours en euros HT

## NORMES RÉGLEMENTAIRES (règles dures)

${normeWarning ? `⚠️ SECTEUR CLIENT : ${ctx.secteur}\n${normeWarning}\nTout produit proposé DOIT avoir cette norme. Pas d'exception.\n` : 'Aucune norme obligatoire détectée pour ce secteur.'}

## CONTEXTE CLIENT

- Secteur : ${ctx.secteur || 'non précisé'}
- Budget global : ${ctx.budget_global ? ctx.budget_global + ' € HT' : 'non précisé'}
- Personnes à équiper : ${ctx.nb_personnes || 'non précisé'}
${budgetParPersonne ? `- Budget par personne : ≈ ${budgetParPersonne} €` : ''}
- Pièces recherchées : ${ctx.typologies?.join(', ') || 'non précisé'}
- Style vestimentaire : ${ctx.style ? STYLE_LABELS[ctx.style] || ctx.style : 'non précisé'}
${ctx.type_etablissement ? `- Type d'établissement : ${ETABLISSEMENT_LABELS[ctx.type_etablissement] || ctx.type_etablissement}` : ''}
- Usage : ${ctx.usage ? USAGE_LABELS[ctx.usage] || ctx.usage : 'non précisé'}

## TA MISSION

Tu dois proposer un **MIX de produits** qui rentre dans le budget global.

Pour chaque proposition, présente un tableau clair :
| Pièce | Réf. | Prix unit. HT | × Qté | Sous-total |
Puis le total avec marquage estimé et livraison.

**Logique de mix selon l'usage :**
- Événement → privilégier le prix, qualité correcte sans plus
- Quotidien → durabilité prioritaire, bon grammage, lavable souvent
- Image de marque → finitions premium, rendu visuel, toucher qualité

**Restauration / Métiers de bouche :**
- Usage quotidien en cuisine → OBLIGATOIREMENT lavable à 60°C minimum
- Catégorie "Chef" = vestes de cuisine, pantalons de cuisine, tabliers, sabots coqués
- Toujours mentionner la température de lavage pour les produits restauration

**Logique de style vestimentaire :**
- Casual → coupes droites, matières confort (coton, jersey), couleurs neutres ou vives
- Casual chic → coupes ajustées, polos piqué, sweats zippés, finitions soignées
- Sportswear → matières techniques, coupes dynamiques, contrastes de couleurs
- Classique/Pro → sobriété, couleurs corporate (marine, noir, gris), coupe structurée

**Marquage :**
- Sérigraphie : ≈ 2-4 € HT/pce (à partir de 50 pces, idéal gros volumes)
- Broderie : ≈ 4-8 € HT/pce (plus qualitatif, idéal polos/sweats)
- DTF/transfert : ≈ 3-5 € HT/pce (photo, dégradés, petits volumes)
- Inclure une estimation du marquage dans le total

**Livraison :**
- Offerte dès 150 € HT de commande
- Sinon 12,50 € HT de frais de port
- Mentionner si le mix dépasse le franco ou pas

## PRODUITS DISPONIBLES (pré-sélectionnés par pertinence)

${productList || 'Aucun produit ne correspond aux critères actuels.'}

## COMPORTEMENT

- Première réponse → propose directement un mix chiffré, pas de questions
- Si le client veut ajuster → recalcule le mix en direct
- Si un produit premium existe pour une pièce du mix → mentionne l'upgrade possible et le surcoût
- Si le budget ne permet pas toutes les pièces → priorise et explique`;
}
