// normes.ts — Base de connaissance normative EPI par secteur
// Utilisé par le system prompt pour l'option A (knowledge base) et B (qualification)

export interface NormeDetail {
  code: string;
  label: string;
  obligatoire: boolean;
  description: string;
}

export interface TrousseauPiece {
  piece: string;
  categorie: string; // veste, pantalon, tablier, coiffe, chaussures, chemise, tunique, blouse, gilet, accessoire
  obligatoire: boolean;
  contraintes?: string[];
}

export interface MetierProfile {
  label: string;
  normes: NormeDetail[];
  trousseau: TrousseauPiece[];
  pieces_interdites?: string[];
  consignes_specifiques?: string[];
}

export interface SecteurProfile {
  label: string;
  metiers: Record<string, MetierProfile>;
  normes_communes: NormeDetail[];
}

// ─────────────────────────────────────────────
// BASE DE DONNÉES NORMATIVE PAR SECTEUR/MÉTIER
// ─────────────────────────────────────────────

export const NORMES_DB: Record<string, SecteurProfile> = {

  btp: {
    label: 'BTP / Construction',
    normes_communes: [
      { code: 'EN 340', label: 'Vêtement de protection — exigences générales', obligatoire: true, description: 'Norme socle pour tout EPI vestimentaire' },
      { code: 'EN ISO 20345', label: 'Chaussures de sécurité avec embout', obligatoire: true, description: 'S1 = fermé, antistatique / S2 = + imperméable / S3 = + semelle anti-perforation' },
      { code: 'EN ISO 20471', label: 'Haute visibilité', obligatoire: true, description: 'Classe 1 (faible) / Classe 2 (voies de circulation) / Classe 3 (autoroute, chantier routier)' },
      { code: 'EN 397', label: 'Casque de protection industrielle', obligatoire: true, description: 'Obligatoire sur tout chantier' },
    ],
    metiers: {
      macon: {
        label: 'Maçon',
        normes: [
          { code: 'EN 14404', label: 'Protection des genoux', obligatoire: true, description: 'Pantalon ou genouillère classe 1 ou 2 selon la dureté du sol' },
          { code: 'EN 388', label: 'Gants protection mécanique', obligatoire: true, description: 'Niveau 3 minimum en résistance à l\'abrasion et à la déchirure' },
        ],
        trousseau: [
          { piece: 'Pantalon de travail multipoche renforcé genoux', categorie: 'pantalon', obligatoire: true, contraintes: ['tissu 300g/m² minimum', 'compatible EN 14404'] },
          { piece: 'T-shirt ou polo de travail', categorie: 'tshirt', obligatoire: true },
          { piece: 'Veste de travail ou blouson', categorie: 'veste', obligatoire: true },
          { piece: 'Gilet haute visibilité EN ISO 20471 cl.2', categorie: 'gilet', obligatoire: true },
          { piece: 'Chaussures de sécurité montantes S3', categorie: 'chaussures', obligatoire: true, contraintes: ['EN ISO 20345', 'semelle anti-perforation'] },
        ],
        pieces_interdites: ['bermuda', 'short', 'sandale', 'tong', 'débardeur'],
        consignes_specifiques: ['Pantalon renforcé aux genoux obligatoire', 'Tissu résistant à l\'abrasion recommandé (>200 tours Martindale)'],
      },
      electricien: {
        label: 'Électricien',
        normes: [
          { code: 'EN IEC 61482-2', label: 'Protection arc électrique', obligatoire: true, description: 'Classe 1 (4 cal/cm²) ou Classe 2 (7 cal/cm²) selon l\'exposition' },
          { code: 'EN 1149', label: 'Vêtement antistatique', obligatoire: true, description: 'Évite les décharges électrostatiques' },
          { code: 'EN 60903', label: 'Gants isolants électriques', obligatoire: true, description: 'Classe 0 à 4 selon tension' },
        ],
        trousseau: [
          { piece: 'Pantalon de travail multipoche (tissu ignifuge ou FR)', categorie: 'pantalon', obligatoire: true, contraintes: ['sans métal apparent', 'pas de zip métal ni bouton pression métal'] },
          { piece: 'Polo ou T-shirt de travail', categorie: 'tshirt', obligatoire: true, contraintes: ['pas de synthétique pur en zone électrique'] },
          { piece: 'Veste de travail sans élément métallique', categorie: 'veste', obligatoire: true, contraintes: ['zip plastique uniquement', 'boutons cachés ou pressions plastique'] },
          { piece: 'Chaussures de sécurité isolantes S3', categorie: 'chaussures', obligatoire: true, contraintes: ['EN ISO 20345', 'propriétés isolantes'] },
        ],
        pieces_interdites: ['bermuda', 'short', 'sandale', 'tong', 'débardeur', 'vêtement avec zip métal'],
        consignes_specifiques: ['Aucun métal apparent sur le vêtement', 'Tissu ignifugé recommandé en plus de l\'antistatique'],
      },
      peintre: {
        label: 'Peintre en bâtiment',
        normes: [
          { code: 'EN 13034', label: 'Protection projections chimiques légères', obligatoire: true, description: 'Type 6 — protection contre les éclaboussures de peinture et solvants' },
          { code: 'EN 374', label: 'Gants protection chimique', obligatoire: true, description: 'Résistance aux solvants et peintures' },
        ],
        trousseau: [
          { piece: 'Combinaison de travail ou ensemble pantalon + veste', categorie: 'combinaison', obligatoire: true, contraintes: ['blanc traditionnel', 'polycoton'] },
          { piece: 'T-shirt de travail', categorie: 'tshirt', obligatoire: true },
          { piece: 'Chaussures de sécurité S1P ou S3', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'short', 'sandale', 'tong'],
        consignes_specifiques: ['Combinaison jetable recommandée pour travaux en hauteur', 'Lunettes de protection obligatoires (non textile)'],
      },
      conducteur_engins: {
        label: 'Conducteur d\'engins',
        normes: [
          { code: 'EN ISO 20471 Cl.3', label: 'Haute visibilité classe 3', obligatoire: true, description: 'Veste ou combinaison classe 3 pour engins de chantier' },
        ],
        trousseau: [
          { piece: 'Pantalon de travail coupe ajustée', categorie: 'pantalon', obligatoire: true, contraintes: ['pas d\'éléments flottants'] },
          { piece: 'Polo ou T-shirt de travail', categorie: 'tshirt', obligatoire: true },
          { piece: 'Gilet ou veste haute visibilité EN ISO 20471 cl.3', categorie: 'gilet', obligatoire: true },
          { piece: 'Chaussures de sécurité S3', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'capuche libre', 'écharpe', 'lacets pendants'],
        consignes_specifiques: ['Tenue ajustée sans élément flottant pouvant se coincer dans les commandes'],
      },
      plombier: {
        label: 'Plombier / Chauffagiste',
        normes: [
          { code: 'EN ISO 11612', label: 'Protection chaleur et flamme', obligatoire: false, description: 'Recommandé pour travaux de soudure ou brasage' },
          { code: 'EN 374', label: 'Gants protection chimique', obligatoire: true, description: 'Pour manipulation de fluides et produits chimiques' },
        ],
        trousseau: [
          { piece: 'Pantalon de travail multipoche renforcé genoux', categorie: 'pantalon', obligatoire: true, contraintes: ['genouillères EN 14404 recommandées'] },
          { piece: 'Polo ou T-shirt de travail', categorie: 'tshirt', obligatoire: true },
          { piece: 'Veste de travail ou softshell', categorie: 'veste', obligatoire: true },
          { piece: 'Chaussures de sécurité S2 ou S3', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'short', 'sandale', 'tong'],
        consignes_specifiques: ['Genoux renforcés recommandés pour travaux en gaine technique'],
      },
    },
  },

  restauration: {
    label: 'Restauration / Métiers de bouche',
    normes_communes: [
      { code: 'EN ISO 20347', label: 'Chaussures professionnelles sans embout acier', obligatoire: true, description: 'SRA/SRB/SRC = antidérapant (SRC = niveau max) — embout acier déconseillé en cuisine' },
      { code: 'HACCP', label: 'Hygiène alimentaire (Paquet Hygiène CE 852/2004)', obligatoire: true, description: 'Tenue propre, lavable à 60°C minimum, pas de poches intérieures au-dessus des aliments' },
    ],
    metiers: {
      chef_cuisine: {
        label: 'Chef / Cuisinier',
        normes: [
          { code: 'EN ISO 11612 A1', label: 'Protection chaleur limitée', obligatoire: false, description: 'Recommandé pour les brigades fréquemment exposées aux flammes' },
        ],
        trousseau: [
          { piece: 'Veste de cuisine double boutonnage', categorie: 'veste', obligatoire: true, contraintes: ['blanche ou couleur', 'manches longues', 'coton ou polycoton 65/35', 'lavable 60°C minimum'] },
          { piece: 'Pantalon de cuisine', categorie: 'pantalon', obligatoire: true, contraintes: ['pied-de-poule ou noir', 'taille élastiquée ou cordon', 'pas de revers'] },
          { piece: 'Tablier de cuisine (bavette ou demi-chef)', categorie: 'tablier', obligatoire: true, contraintes: ['coton ou polycoton'] },
          { piece: 'Toque, calot ou bandana (coiffe cuisine)', categorie: 'coiffe', obligatoire: true, contraintes: ['hygiène HACCP'] },
          { piece: 'Chaussures de sécurité cuisine antidérapantes SRC', categorie: 'chaussures', obligatoire: true, contraintes: ['sabot ou mocassin', 'EN ISO 20347'] },
          { piece: 'Tour de cou', categorie: 'accessoire', obligatoire: false },
        ],
        pieces_interdites: ['bermuda', 'short', 'débardeur', 'bonnet streetwear', 'sandale', 'tong', 'jean', 'blouse de bureau', 'polo'],
        consignes_specifiques: [
          'Lavage 60°C MINIMUM — vérifier l\'étiquette produit avant de proposer',
          'Veste de cuisine double boutonnage recommandée (protection chaleur + retournement en service)',
          'Tissu 65% polyester / 35% coton = meilleur compromis entretien / résistance',
          'Pantalon cuisine : taille élastiquée ou cordon recommandé',
          'Pas de poche ouverte au-dessus de la taille (risque de chute dans les préparations)',
        ],
      },
      boulanger_patissier: {
        label: 'Boulanger / Pâtissier',
        normes: [],
        trousseau: [
          { piece: 'Veste de cuisine blanche', categorie: 'veste', obligatoire: true, contraintes: ['blanc obligatoire', 'lavable 60°C'] },
          { piece: 'Pantalon pied-de-poule ou blanc', categorie: 'pantalon', obligatoire: true },
          { piece: 'Tablier bavette blanc', categorie: 'tablier', obligatoire: true },
          { piece: 'Calot ou toque', categorie: 'coiffe', obligatoire: true, contraintes: ['hygiène HACCP'] },
          { piece: 'Chaussures de sécurité antidérapantes SRC blanches', categorie: 'chaussures', obligatoire: true, contraintes: ['EN ISO 20347'] },
        ],
        pieces_interdites: ['bermuda', 'short', 'débardeur', 'bonnet streetwear', 'sandale', 'jean', 'vêtement de couleur foncée'],
        consignes_specifiques: [
          'Blanc obligatoire dans la plupart des boulangeries (visibilité des salissures)',
          'Tablier imperméable recommandé pour pâtisserie (crèmes, glaçages)',
          'Calot ou toque obligatoire (hygiène, non textile EPI)',
          'Lavage 60°C MINIMUM',
        ],
      },
      boucher: {
        label: 'Boucher / Charcutier',
        normes: [
          { code: 'EN 388 Niv.5', label: 'Gants anti-coupures niveau 5', obligatoire: true, description: 'Résistance maximale aux coupures — obligatoire manipulation couteaux' },
          { code: 'EN 13034', label: 'Protection projections', obligatoire: false, description: 'Tablier protection sang et liquides biologiques' },
        ],
        trousseau: [
          { piece: 'Veste de cuisine ou veste de boucher blanche', categorie: 'veste', obligatoire: true, contraintes: ['manches longues', 'lavable 60°C'] },
          { piece: 'Pantalon blanc ou bleu', categorie: 'pantalon', obligatoire: true, contraintes: ['taille élastiquée'] },
          { piece: 'Tablier imperméable PVC ou cuir', categorie: 'tablier', obligatoire: true, contraintes: ['protection sang et liquides'] },
          { piece: 'Calot ou charlotte', categorie: 'coiffe', obligatoire: true },
          { piece: 'Chaussures de sécurité antidérapantes SRC ou bottes blanches', categorie: 'chaussures', obligatoire: true, contraintes: ['bottes blanches en labo de découpe'] },
        ],
        pieces_interdites: ['bermuda', 'short', 'débardeur', 'sandale', 'jean', 'bonnet streetwear'],
        consignes_specifiques: ['Tablier PVC ou cuir recommandé par-dessus le textile', 'Lavage 60°C MINIMUM'],
      },
      serveur: {
        label: 'Serveur / Personnel de salle',
        normes: [],
        trousseau: [
          { piece: 'Chemise ou chemisier', categorie: 'chemise', obligatoire: true, contraintes: ['blanc classique ou couleur selon établissement'] },
          { piece: 'Pantalon de service', categorie: 'pantalon', obligatoire: true, contraintes: ['noir', 'coupe droite ou slim'] },
          { piece: 'Chaussures de ville antidérapantes', categorie: 'chaussures', obligatoire: true, contraintes: ['noires', 'fermées'] },
          { piece: 'Tablier de service (demi-chef ou bistrot)', categorie: 'tablier', obligatoire: true, contraintes: ['avec poche pour carnet/stylo'] },
          { piece: 'Gilet de service', categorie: 'gilet', obligatoire: false, contraintes: ['noir ou anthracite', 'restaurants gastronomiques'] },
        ],
        pieces_interdites: ['bermuda', 'tong', 'sandale', 'jean troué', 'sweat à capuche', 'bonnet', 'baskets'],
        consignes_specifiques: [
          'Priorité au confort et à l\'image (pas de norme EPI obligatoire en salle)',
          'Chaussures antidérapantes SRC fortement recommandées',
          'Tissu résistant aux taches recommandé (traitements DWR)',
          'Lavage 40-60°C selon tissu',
        ],
      },
      traiteur: {
        label: 'Traiteur / Événementiel',
        normes: [],
        trousseau: [
          { piece: 'Veste de cuisine ou veste de service', categorie: 'veste', obligatoire: true },
          { piece: 'Pantalon de service noir', categorie: 'pantalon', obligatoire: true },
          { piece: 'Tablier de service', categorie: 'tablier', obligatoire: true },
          { piece: 'Chaussures fermées antidérapantes', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'short', 'tong', 'sandale', 'bonnet streetwear'],
        consignes_specifiques: [
          'Image de marque prioritaire — style élégant recommandé',
          'Tablier protection recommandé lors du service',
          'Tenue adaptée froid/chaud selon environnement (intérieur/extérieur)',
        ],
      },
    },
  },

  industrie: {
    label: 'Industrie / Production',
    normes_communes: [
      { code: 'EN 340', label: 'Vêtement de protection — exigences générales', obligatoire: true, description: 'Norme socle obligatoire' },
      { code: 'EN ISO 20345', label: 'Chaussures de sécurité', obligatoire: true, description: 'S2 ou S3 selon présence de liquides ou perforation au sol' },
    ],
    metiers: {
      operateur_chaine: {
        label: 'Opérateur de production',
        normes: [
          { code: 'EN 1149', label: 'Vêtement antistatique', obligatoire: false, description: 'Obligatoire si présence de matières inflammables ou électronique sensible' },
          { code: 'EN 388', label: 'Gants protection mécanique', obligatoire: true, description: 'Niveau adapté au risque de coupure/abrasion sur poste' },
        ],
        trousseau: [
          { piece: 'Pantalon de travail ou combinaison', categorie: 'pantalon', obligatoire: true },
          { piece: 'T-shirt ou polo de travail', categorie: 'tshirt', obligatoire: true },
          { piece: 'Blouse ou veste de travail', categorie: 'veste', obligatoire: true, contraintes: ['manches ajustées'] },
          { piece: 'Chaussures de sécurité S2 ou S3', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'short', 'écharpe', 'capuche libre', 'lacets pendants'],
        consignes_specifiques: ['Aucun élément flottant (lacets, capuche) près des machines tournantes', 'Manches longues ou courtes selon risque d\'accrochage'],
      },
      soudeur: {
        label: 'Soudeur',
        normes: [
          { code: 'EN ISO 11611', label: 'Vêtement de soudage', obligatoire: true, description: 'Classe A1 (soudure simple) ou A2 (procédés avec fortes projections)' },
          { code: 'EN ISO 11612', label: 'Protection chaleur et flamme', obligatoire: true, description: 'Associé à EN ISO 11611 pour protection complète' },
          { code: 'EN 1149', label: 'Antistatique', obligatoire: true, description: 'Évite les amorçages' },
        ],
        trousseau: [
          { piece: 'Veste de soudeur EN ISO 11611 (col montant, manches longues)', categorie: 'veste', obligatoire: true, contraintes: ['100% coton ou FR', 'JAMAIS synthétique'] },
          { piece: 'Pantalon de soudeur EN ISO 11611 (sans revers)', categorie: 'pantalon', obligatoire: true, contraintes: ['100% coton ou FR'] },
          { piece: 'Tablier de soudeur cuir ou cuir croûté', categorie: 'tablier', obligatoire: true },
          { piece: 'Chaussures de sécurité montantes S3 HRO', categorie: 'chaussures', obligatoire: true, contraintes: ['résistance chaleur semelle'] },
          { piece: 'Guêtres de soudeur', categorie: 'accessoire', obligatoire: true },
        ],
        pieces_interdites: ['tout vêtement synthétique', 'bermuda', 'short', 'débardeur', 'tong', 'baskets'],
        consignes_specifiques: ['Tissu 100% coton ou FR traité UNIQUEMENT — jamais synthétique pur', 'Pas de coutures synthétiques apparentes'],
      },
      logisticien: {
        label: 'Logisticien / Magasinier',
        normes: [
          { code: 'EN ISO 20471 Cl.2', label: 'Haute visibilité classe 2', obligatoire: true, description: 'Obligatoire en entrepôt avec chariots élévateurs' },
        ],
        trousseau: [
          { piece: 'Pantalon de travail ou cargo', categorie: 'pantalon', obligatoire: true },
          { piece: 'Polo ou T-shirt de travail', categorie: 'tshirt', obligatoire: true },
          { piece: 'Gilet haute visibilité EN ISO 20471 cl.2', categorie: 'gilet', obligatoire: true },
          { piece: 'Chaussures de sécurité S3', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['sandale', 'tong'],
        consignes_specifiques: ['Résistance au froid recommandée si entrepôt frigorifique (EN 342)', 'Chaussures S3 recommandées pour charges lourdes'],
      },
      chimiste: {
        label: 'Opérateur chimie / Laboratoire',
        normes: [
          { code: 'EN 13034 Type 6', label: 'Protection projections chimiques légères', obligatoire: true, description: 'Type 6 minimum pour projections accidentelles' },
          { code: 'EN 374', label: 'Gants protection chimique', obligatoire: true, description: 'Adapter selon les agents chimiques manipulés' },
          { code: 'EN 1149', label: 'Antistatique', obligatoire: false, description: 'Obligatoire si produits inflammables' },
        ],
        trousseau: [
          { piece: 'Blouse de laboratoire blanche 100% coton', categorie: 'blouse', obligatoire: true, contraintes: ['manches longues', 'boutons pression', 'longueur genoux'] },
          { piece: 'Pantalon long', categorie: 'pantalon', obligatoire: true },
          { piece: 'Chaussures fermées plates', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'short', 'sandale', 'talon', 'vêtement synthétique sous la blouse'],
        consignes_specifiques: ['Blouse ou combinaison fermée obligatoire', 'Tissu résistant aux acides recommandé selon protocole'],
      },
    },
  },

  sante: {
    label: 'Santé / Médico-social',
    normes_communes: [
      { code: 'EN ISO 20347', label: 'Chaussures professionnelles', obligatoire: true, description: 'Antidérapantes SRC — embout acier interdit dans la plupart des établissements' },
      { code: 'EN 14126', label: 'Protection agents infectieux', obligatoire: false, description: 'Obligatoire en zone à risque biologique' },
    ],
    metiers: {
      infirmier: {
        label: 'Infirmier / Aide-soignant',
        normes: [
          { code: 'EN 374', label: 'Gants protection biologique', obligatoire: true, description: 'Non-textile — pour information contexte' },
        ],
        trousseau: [
          { piece: 'Tunique médicale (col V ou rond, manches courtes)', categorie: 'tunique', obligatoire: true, contraintes: ['blanche ou couleur service', 'lavable 60°C', 'manches courtes obligatoires'] },
          { piece: 'Pantalon médical', categorie: 'pantalon', obligatoire: true, contraintes: ['taille élastiquée', 'blanc ou couleur service'] },
          { piece: 'Chaussures médicales antidérapantes SRC', categorie: 'chaussures', obligatoire: true, contraintes: ['sabots ou mocassins', 'EN ISO 20347'] },
        ],
        pieces_interdites: ['jean', 'bermuda', 'sandale', 'vêtement de ville', 'bijoux mains/poignets'],
        consignes_specifiques: ['Lavage 60°C MINIMUM — norme établissements de santé', 'Tissu résistant aux désinfectants recommandé', 'Poche pratique avec fermeture recommandée'],
      },
      medecin: {
        label: 'Médecin / Praticien',
        normes: [],
        trousseau: [
          { piece: 'Blouse médicale blanche manches longues', categorie: 'blouse', obligatoire: true, contraintes: ['lavable 60°C'] },
          { piece: 'Tunique médicale (sous blouse)', categorie: 'tunique', obligatoire: false },
          { piece: 'Pantalon médical', categorie: 'pantalon', obligatoire: true },
          { piece: 'Chaussures médicales', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['jean', 'bermuda', 'sandale'],
        consignes_specifiques: ['Blouse blanche ou couleur établissement', 'Tissu facile entretien, résistant désinfectants', 'Lavage 60°C'],
      },
      aide_domicile: {
        label: 'Aide à domicile / EHPAD',
        normes: [],
        trousseau: [
          { piece: 'Tunique ou blouse professionnelle', categorie: 'tunique', obligatoire: true, contraintes: ['couleur selon structure'] },
          { piece: 'Pantalon confortable (type médical ou chino)', categorie: 'pantalon', obligatoire: true },
          { piece: 'Chaussures fermées confortables antidérapantes', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'sandale', 'tong'],
        consignes_specifiques: ['Tenue confortable pour mobilité — pas d\'EPI obligatoire hors soins', 'Couleur identifiable recommandée (image de l\'établissement)', 'Lavage 40-60°C'],
      },
    },
  },

  espaces_verts: {
    label: 'Espaces verts / Paysagisme',
    normes_communes: [
      { code: 'EN 340', label: 'Vêtement protection général', obligatoire: true, description: 'Norme socle' },
      { code: 'EN ISO 20345 S3', label: 'Chaussures sécurité anti-perforation', obligatoire: true, description: 'S3 recommandé pour travaux extérieurs avec outils' },
    ],
    metiers: {
      paysagiste: {
        label: 'Paysagiste / Agent espaces verts',
        normes: [
          { code: 'EN ISO 20471 Cl.1', label: 'Haute visibilité classe 1', obligatoire: false, description: 'Recommandé à proximité de voies de circulation' },
          { code: 'EN 343', label: 'Protection pluie et intempéries', obligatoire: false, description: 'Classe 3/3 pour travaux en conditions météo difficiles' },
          { code: 'EN 342', label: 'Protection contre le froid', obligatoire: false, description: 'Si travaux en conditions hivernales' },
        ],
        trousseau: [
          { piece: 'Pantalon de travail multipoche renforcé genoux', categorie: 'pantalon', obligatoire: true, contraintes: ['tissu 300g/m²+', 'résistant ronces'] },
          { piece: 'T-shirt ou polo de travail', categorie: 'tshirt', obligatoire: true },
          { piece: 'Veste de travail ou softshell', categorie: 'veste', obligatoire: true },
          { piece: 'Chaussures de sécurité S3', categorie: 'chaussures', obligatoire: true, contraintes: ['anti-perforation'] },
        ],
        pieces_interdites: ['sandale', 'tong'],
        consignes_specifiques: ['Tissu résistant aux ronces et abrasion recommandé', 'Multipoche fonctionnel recommandé'],
      },
      tronconneur: {
        label: 'Élagueur / Tronçonneur',
        normes: [
          { code: 'EN ISO 11393', label: 'Pantalon anti-coupures tronçonneuse', obligatoire: true, description: 'Classe 1 (20 m/s) ou Classe 2 (24 m/s) selon vitesse chaîne' },
          { code: 'EN ISO 17249', label: 'Chaussures anti-coupures tronçonneuse', obligatoire: true, description: 'Classe 1 ou 2 selon vitesse chaîne' },
          { code: 'EN 397', label: 'Casque protection', obligatoire: true, description: 'Avec visière EN 1731 et protection auditives EN 352' },
        ],
        trousseau: [
          { piece: 'Pantalon anti-coupures tronçonneuse EN ISO 11393', categorie: 'pantalon', obligatoire: true, contraintes: ['classe 1 ou 2', 'fibres aramides'] },
          { piece: 'Veste de travail ajustée', categorie: 'veste', obligatoire: true, contraintes: ['pas d\'éléments flottants'] },
          { piece: 'Chaussures anti-coupures EN ISO 17249', categorie: 'chaussures', obligatoire: true, contraintes: ['montantes'] },
        ],
        pieces_interdites: ['pantalon de travail classique', 'baskets', 'bermuda', 'short'],
        consignes_specifiques: ['Ces normes sont des NORMES DURES — aucun compromis possible', 'Le pantalon anti-coupure N\'EST PAS un pantalon de travail classique'],
      },
    },
  },

  securite: {
    label: 'Sécurité / Gardiennage',
    normes_communes: [
      { code: 'EN ISO 20471 Cl.2', label: 'Haute visibilité classe 2', obligatoire: false, description: 'Obligatoire si travail sur voie publique ou parking' },
      { code: 'EN 340', label: 'Vêtement protection général', obligatoire: true, description: 'Norme socle' },
    ],
    metiers: {
      agent_securite: {
        label: 'Agent de sécurité / Vigile',
        normes: [],
        trousseau: [
          { piece: 'Polo ou chemise corporate', categorie: 'chemise', obligatoire: true, contraintes: ['marine, noir ou gris'] },
          { piece: 'Pantalon type cargo ou chino', categorie: 'pantalon', obligatoire: true, contraintes: ['tissu résistant'] },
          { piece: 'Blouson ou parka', categorie: 'veste', obligatoire: true },
          { piece: 'Chaussures de sécurité ou rangers', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'tong', 'sandale'],
        consignes_specifiques: [
          'Tenue corporate — image et autorité prioritaires',
          'Tissu résistant recommandé (usage intensif)',
          'Résistance à la déchirure recommandée',
          'Couleurs sobres : marine, noir, gris',
        ],
      },
      agent_incendie: {
        label: 'Agent SSIAP / Sécurité incendie',
        normes: [
          { code: 'EN 469', label: 'Vêtement d\'intervention incendie', obligatoire: true, description: 'Niveau 1 ou 2 selon le rôle (SSIAP 1/2/3)' },
        ],
        trousseau: [
          { piece: 'Polo ou chemise corporate (hors intervention)', categorie: 'chemise', obligatoire: true },
          { piece: 'Pantalon de service', categorie: 'pantalon', obligatoire: true },
          { piece: 'Chaussures de sécurité', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'tong', 'sandale'],
        consignes_specifiques: ['Norme EN 469 OBLIGATOIRE pour toute intervention', 'Hors intervention : tenue standard corporate'],
      },
    },
  },

  nettoyage: {
    label: 'Nettoyage / Propreté',
    normes_communes: [
      { code: 'EN ISO 20347', label: 'Chaussures professionnelles antidérapantes', obligatoire: true, description: 'SRC obligatoire — sols souvent mouillés' },
      { code: 'EN 13034 Type 6', label: 'Protection projections chimiques légères', obligatoire: true, description: 'Pour manipulation produits ménagers et désinfectants' },
    ],
    metiers: {
      agent_nettoyage: {
        label: 'Agent de propreté',
        normes: [
          { code: 'EN 374', label: 'Gants protection chimique', obligatoire: true, description: 'Non-textile — pour information contexte' },
        ],
        trousseau: [
          { piece: 'Tunique ou blouse de travail', categorie: 'tunique', obligatoire: true },
          { piece: 'Pantalon de travail', categorie: 'pantalon', obligatoire: true },
          { piece: 'Tablier imperméable', categorie: 'tablier', obligatoire: false },
          { piece: 'Chaussures antidérapantes SRC', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['sandale', 'tong'],
        consignes_specifiques: [
          'Tenue résistante aux produits ménagers (javel, acides, bases)',
          'Tablier imperméable recommandé',
          'Couleurs sombres recommandées pour masquer les salissures',
          'Lavage 60°C minimum',
        ],
      },
    },
  },

  transport: {
    label: 'Transport / Logistique',
    normes_communes: [
      { code: 'EN ISO 20471 Cl.2', label: 'Haute visibilité classe 2', obligatoire: true, description: 'Obligatoire pour toute personne circulant à pied près des véhicules' },
      { code: 'EN ISO 20345', label: 'Chaussures de sécurité', obligatoire: true, description: 'S2 ou S3 selon environnement' },
    ],
    metiers: {
      chauffeur_livreur: {
        label: 'Chauffeur-livreur',
        normes: [],
        trousseau: [
          { piece: 'Polo ou T-shirt corporate', categorie: 'tshirt', obligatoire: true },
          { piece: 'Pantalon de travail ou cargo', categorie: 'pantalon', obligatoire: true },
          { piece: 'Gilet haute visibilité', categorie: 'gilet', obligatoire: true },
          { piece: 'Chaussures de sécurité confort', categorie: 'chaussures', obligatoire: true },
          { piece: 'Blouson ou softshell', categorie: 'veste', obligatoire: false },
        ],
        pieces_interdites: ['sandale', 'tong'],
        consignes_specifiques: [
          'Gilet haute visibilité obligatoire dans le véhicule (Code de la route)',
          'Chaussures confort pour conduite longue recommandées',
          'Tenue image de marque entreprise recommandée',
        ],
      },
      cariste: {
        label: 'Cariste / Magasinier',
        normes: [
          { code: 'EN ISO 20471 Cl.2', label: 'Haute visibilité classe 2', obligatoire: true, description: 'Obligatoire en entrepôt avec engins' },
          { code: 'EN 342', label: 'Protection froid', obligatoire: false, description: 'Si entrepôt frigorifique' },
        ],
        trousseau: [
          { piece: 'Pantalon de travail', categorie: 'pantalon', obligatoire: true },
          { piece: 'Polo ou T-shirt de travail', categorie: 'tshirt', obligatoire: true },
          { piece: 'Gilet haute visibilité EN ISO 20471 cl.2', categorie: 'gilet', obligatoire: true },
          { piece: 'Chaussures de sécurité S3', categorie: 'chaussures', obligatoire: true },
        ],
        pieces_interdites: ['bermuda', 'écharpe', 'capuche libre', 'lacets pendants'],
        consignes_specifiques: ['Pas d\'éléments flottants près des engins', 'Casque recommandé si allées hautes denses'],
      },
    },
  },

};

// ─────────────────────────────────────────────
// FONCTIONS D'ACCÈS
// ─────────────────────────────────────────────

/**
 * Retourne le label de normes pour injecter dans le system prompt (option A)
 * Version enrichie de l'ancienne getNormeLabel
 */
export function getNormeLabel(secteur?: string, metier?: string): string {
  if (!secteur) return '';

  const secteurData = NORMES_DB[secteur];
  if (!secteurData) return `Secteur "${secteur}" — aucune norme référencée. Appliquer les principes généraux EN 340.`;

  const lignes: string[] = [];

  // Normes communes au secteur
  const normesObligatoires = secteurData.normes_communes.filter(n => n.obligatoire);
  const normesRecommandees = secteurData.normes_communes.filter(n => !n.obligatoire);

  if (normesObligatoires.length > 0) {
    lignes.push('**NORMES OBLIGATOIRES (secteur) :**');
    normesObligatoires.forEach(n => {
      lignes.push(`- ${n.code} — ${n.label} : ${n.description}`);
    });
  }

  if (normesRecommandees.length > 0) {
    lignes.push('**NORMES RECOMMANDÉES (secteur) :**');
    normesRecommandees.forEach(n => {
      lignes.push(`- ${n.code} — ${n.label} : ${n.description}`);
    });
  }

  // Normes spécifiques au métier si précisé
  if (metier && secteurData.metiers[metier]) {
    const metierData = secteurData.metiers[metier];
    const mNormeOblig = metierData.normes.filter(n => n.obligatoire);
    const mNormeReco = metierData.normes.filter(n => !n.obligatoire);

    if (mNormeOblig.length > 0) {
      lignes.push(`\n**NORMES OBLIGATOIRES (${metierData.label}) :**`);
      mNormeOblig.forEach(n => {
        lignes.push(`- ${n.code} — ${n.label} : ${n.description}`);
      });
    }

    if (mNormeReco.length > 0) {
      lignes.push(`**NORMES RECOMMANDÉES (${metierData.label}) :**`);
      mNormeReco.forEach(n => {
        lignes.push(`- ${n.code} — ${n.label} : ${n.description}`);
      });
    }

    if (metierData.consignes_specifiques && metierData.consignes_specifiques.length > 0) {
      lignes.push(`\n**CONSIGNES SPÉCIFIQUES (${metierData.label}) :**`);
      metierData.consignes_specifiques.forEach(c => lignes.push(`- ${c}`));
    }
  }

  return lignes.join('\n');
}

/**
 * Retourne la liste des secteurs disponibles pour le chat de qualification
 */
export function getSecteursList(): { key: string; label: string }[] {
  return Object.entries(NORMES_DB).map(([key, val]) => ({ key, label: val.label }));
}

/**
 * Retourne la liste des métiers d'un secteur pour affichage dans le chat
 */
export function getMetiersList(secteur: string): { key: string; label: string }[] {
  const s = NORMES_DB[secteur];
  if (!s) return [];
  return Object.entries(s.metiers).map(([key, val]) => ({ key, label: val.label }));
}

/**
 * Retourne le trousseau et les pièces interdites pour injection dans le system prompt
 */
export function getTrousseauLabel(secteur?: string, metier?: string): string {
  if (!secteur) return '';

  const secteurData = NORMES_DB[secteur];
  if (!secteurData) return '';

  if (!metier) return '';

  const metierData = secteurData.metiers[metier];
  if (!metierData) return '';

  const lignes: string[] = [];

  if (metierData.trousseau && metierData.trousseau.length > 0) {
    lignes.push(`\n**TROUSSEAU STANDARD (${metierData.label}) — pièces à proposer :**`);
    metierData.trousseau.forEach(t => {
      const tag = t.obligatoire ? '✅ OBLIGATOIRE' : '💡 Recommandé';
      const contraintes = t.contraintes ? ` (${t.contraintes.join(', ')})` : '';
      lignes.push(`- ${tag} : ${t.piece}${contraintes}`);
    });
  }

  if (metierData.pieces_interdites && metierData.pieces_interdites.length > 0) {
    lignes.push(`\n**🚫 PIÈCES INTERDITES pour ${metierData.label} — NE JAMAIS PROPOSER :**`);
    lignes.push(metierData.pieces_interdites.map(p => `- ${p}`).join('\n'));
  }

  return lignes.join('\n');
}

/**
 * Retourne un résumé des normes obligatoires pour validation produit
 * Utile pour filtrer le catalogue avant de proposer des produits
 */
export function getNormesObligatoires(secteur: string, metier?: string): string[] {
  const codes: string[] = [];
  const s = NORMES_DB[secteur];
  if (!s) return [];

  s.normes_communes.filter(n => n.obligatoire).forEach(n => codes.push(n.code));

  if (metier && s.metiers[metier]) {
    s.metiers[metier].normes.filter(n => n.obligatoire).forEach(n => codes.push(n.code));
  }

  return codes;
}
