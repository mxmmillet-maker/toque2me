import { NormalizedProduct } from '@/workers/lib/types';

export interface Coloris {
  nom: string;
  hex: string;
}

export interface MockProduct extends NormalizedProduct {
  id: string;
  prix_from: number;
  composition?: string;
  coloris?: Coloris[];
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: '1',
    fournisseur: 'cybernecard',
    ref_fournisseur: 'CYB-TS01',
    nom: 'T-shirt Coton Bio 190g',
    description: 'T-shirt col rond en coton biologique certifié GOTS. Coupe ajustée, coutures renforcées. Bande de propreté au col, surpiqûres doubles aux manches et à la base. Idéal pour la personnalisation en sérigraphie ou broderie.',
    categorie: 'T-shirts',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
    grammage: 190,
    origine: 'Portugal',
    composition: '100% coton biologique peigné ring-spun',
    certifications: ['GOTS', 'Oeko-Tex'],
    normes: [],
    secteurs: ['entreprise', 'association'],
    score_durabilite: 85,
    score_premium: 80,
    actif: true,
    prix_from: 4.90,
    coloris: [
      { nom: 'Blanc', hex: '#FFFFFF' },
      { nom: 'Noir', hex: '#1A1A1A' },
      { nom: 'Bleu marine', hex: '#1B2A4A' },
      { nom: 'Gris chiné', hex: '#9CA3AF' },
      { nom: 'Rouge', hex: '#B91C1C' },
    ],
  },
  {
    id: '2',
    fournisseur: 'cybernecard',
    ref_fournisseur: 'CYB-PL02',
    nom: 'Polo Piqué Premium 220g',
    description: 'Polo en maille piqué 100% coton peigné. Col renforcé avec bande contrastée intérieure, patte de boutonnage 3 boutons ton sur ton. Fentes latérales pour un confort optimal. Finition haut de gamme adaptée à la broderie.',
    categorie: 'Polos',
    image_url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&h=600&fit=crop',
    grammage: 220,
    origine: 'Portugal',
    composition: '100% coton peigné double mercerisé',
    certifications: ['Oeko-Tex'],
    normes: [],
    secteurs: ['entreprise', 'hotelier'],
    score_durabilite: 78,
    score_premium: 85,
    actif: true,
    prix_from: 8.50,
    coloris: [
      { nom: 'Blanc', hex: '#FFFFFF' },
      { nom: 'Noir', hex: '#1A1A1A' },
      { nom: 'Bleu marine', hex: '#1B2A4A' },
      { nom: 'Bleu royal', hex: '#1D4ED8' },
    ],
  },
  {
    id: '3',
    fournisseur: 'toptex',
    ref_fournisseur: 'TPX-TAB03',
    nom: 'Tablier Cuisine Pro HACCP',
    description: 'Tablier bavette professionnel conforme aux normes HACCP. Tissu anti-taches traité Teflon, résistant aux lavages industriels à 60°C. Sangles réglables croisées dans le dos, poche kangourou frontale. Certifié pour les environnements de restauration collective.',
    categorie: 'Tabliers',
    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop',
    grammage: 280,
    origine: 'France',
    composition: '65% polyester, 35% coton — traitement anti-taches',
    certifications: [],
    normes: ['HACCP'],
    secteurs: ['restaurateur', 'traiteur'],
    score_durabilite: 90,
    score_premium: 75,
    actif: true,
    prix_from: 12.00,
    coloris: [
      { nom: 'Blanc', hex: '#FFFFFF' },
      { nom: 'Noir', hex: '#1A1A1A' },
      { nom: 'Bordeaux', hex: '#7F1D1D' },
    ],
  },
  {
    id: '4',
    fournisseur: 'toptex',
    ref_fournisseur: 'TPX-SW04',
    nom: 'Sweat Col Rond Stanley/Stella 350g',
    description: 'Sweat-shirt premium en coton bio brossé. Intérieur molletonné ultra-doux, coupe unisexe moderne légèrement ajustée. Bords-côtes aux poignets et à la base. Certifié GOTS, Fair Wear et Oeko-Tex. Marquage recommandé : sérigraphie ou DTF.',
    categorie: 'Sweats',
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop',
    grammage: 350,
    origine: 'Bangladesh',
    composition: '85% coton biologique ring-spun, 15% polyester recyclé',
    certifications: ['GOTS', 'Oeko-Tex', 'Fair Wear'],
    normes: [],
    secteurs: ['entreprise', 'association'],
    score_durabilite: 95,
    score_premium: 95,
    actif: true,
    prix_from: 18.90,
    coloris: [
      { nom: 'Noir', hex: '#1A1A1A' },
      { nom: 'Bleu marine', hex: '#1B2A4A' },
      { nom: 'Gris chiné', hex: '#9CA3AF' },
      { nom: 'Vert forêt', hex: '#14532D' },
      { nom: 'Bordeaux', hex: '#7F1D1D' },
      { nom: 'Camel', hex: '#B08968' },
    ],
  },
];
