import { config } from 'dotenv';
config({ path: '.env.local' });

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../src/lib/supabase-admin';
import { classifyProduct, CategorieV2 } from '../src/lib/taxonomy-v2';

// ─── Référentiel sous-catégories (identique à taxonomy-v2) ──────────────────

const CATEGORIES: CategorieV2[] = [
  'Accessoires', 'Chaussures', 'Chemises', 'EPI', 'Objets promo',
  'Pantalons', 'Polos', 'Softshell', 'Sport', 'Sweats', 'T-shirts', 'Vestes',
];

const SOUS_CATEGORIES: Record<CategorieV2, string[]> = {
  'Accessoires': ['casquettes', 'bonnets', 'chapeaux', 'cols/écharpes', 'sacs', 'cravates', 'ceintures'],
  'Chaussures': ['sécurité', 'sport', 'ville', 'sabot'],
  'Chemises': ['manches courtes', 'manches longues'],
  'EPI': ['gilets HV', 'casques', 'gants', 'chaussures sécu', 'antichute'],
  'Objets promo': ['peluches', 'mugs', 'stylos', 'tote bags', 'parapluies', 'gourdes', 'USB', 'carnets', 'autres'],
  'Pantalons': ['jeans', 'chino', 'jogging', 'EPI', 'pantalon', 'shorts-bermudas'],
  'Polos': ['manches courtes', 'manches longues'],
  'Softshell': ['standard'],
  'Sport': ['maillots', 'shorts', 'survêtements'],
  'Sweats': [
    'capuche / sans zip', 'capuche / zippé', 'capuche / quart de zip', 'capuche / full zip',
    'col rond / sans zip', 'col rond / zippé', 'col rond / quart de zip', 'col rond / full zip',
  ],
  'T-shirts': ['manches courtes', 'manches longues', 'débardeurs'],
  'Vestes': ['bodywarmer', 'doudoune', 'tissu', 'parka', 'coupe-vent', 'imperméable', 'sport', 'EPI'],
};

const GENRES = ['homme', 'femme', 'unisexe', 'enfant'];

// Normaliser le nom d'une catégorie pour en faire un named range valide
function toNamed(cat: string): string {
  return cat.replace(/[-\s]/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}

// ─── Chargement produits ────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  ref_fournisseur: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  fournisseur: string | null;
  genre: string | null;
  composition: string | null;
  marque: string | null;
  actif: boolean;
}

async function loadProducts(): Promise<ProductRow[]> {
  const all: ProductRow[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, ref_fournisseur, nom, description, categorie, fournisseur, genre, composition, marque, actif')
      .eq('actif', true)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...(data as ProductRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// ─── Génération XLSX ────────────────────────────────────────────────────────

async function main() {
  console.log('Chargement des produits…');
  const products = await loadProducts();
  console.log(`${products.length} produits chargés.`);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Toque2Me audit taxonomy';
  wb.created = new Date();

  // ─── Feuille 1 : Listes (référentiel pour dropdowns) ───────────────────
  const wsListes = wb.addWorksheet('Listes');
  wsListes.state = 'visible'; // 'hidden' possible mais on laisse visible pour debug

  // Col A : Categories
  wsListes.getCell('A1').value = 'Categories';
  wsListes.getCell('A1').font = { bold: true };
  CATEGORIES.forEach((cat, i) => {
    wsListes.getCell(`A${i + 2}`).value = cat;
  });
  wb.definedNames.add(`Listes!$A$2:$A$${CATEGORIES.length + 1}`, 'Categories');

  // Col B : Genres
  wsListes.getCell('B1').value = 'Genres';
  wsListes.getCell('B1').font = { bold: true };
  GENRES.forEach((g, i) => {
    wsListes.getCell(`B${i + 2}`).value = g;
  });
  wb.definedNames.add(`Listes!$B$2:$B$${GENRES.length + 1}`, 'Genres');

  // Col C+ : une colonne par catégorie avec ses sous-cats
  let col = 3; // col C
  for (const cat of CATEGORIES) {
    const letter = String.fromCharCode(64 + col); // C=67, D=68, …
    const name = toNamed(cat); // "T_shirts", "Objets_promo", …
    wsListes.getCell(`${letter}1`).value = cat;
    wsListes.getCell(`${letter}1`).font = { bold: true };
    const subs = SOUS_CATEGORIES[cat];
    subs.forEach((s, i) => {
      wsListes.getCell(`${letter}${i + 2}`).value = s;
    });
    wb.definedNames.add(`Listes!$${letter}$2:$${letter}$${subs.length + 1}`, name);
    col++;
  }

  // ─── Feuille 2 : À traiter (ambigus) ───────────────────────────────────
  const wsAmbigu = wb.addWorksheet('À traiter');

  const headers = [
    { key: 'ref', header: 'Ref', width: 12 },
    { key: 'fournisseur', header: 'Fournisseur', width: 12 },
    { key: 'marque', header: 'Marque', width: 14 },
    { key: 'nom', header: 'Nom produit', width: 40 },
    { key: 'cat_actuelle', header: 'Cat. actuelle', width: 14 },
    { key: 'cat_detectee', header: 'Cat. détectée', width: 14 },
    { key: 'sous_cat_detectee', header: 'Sous-cat détectée', width: 22 },
    { key: 'genre_detecte', header: 'Genre détecté', width: 12 },
    { key: 'ambiguites', header: 'Pourquoi ambigu', width: 40 },
    { key: 'candidats', header: 'Candidats', width: 20 },
    { key: 'composition', header: 'Composition', width: 25 },
    { key: 'description', header: 'Description', width: 60 },
    { key: 'cat_finale', header: '✏️ Cat. finale', width: 14 },
    { key: 'sous_cat_finale', header: '✏️ Sous-cat finale', width: 22 },
    { key: 'genre_final', header: '✏️ Genre final', width: 12 },
    { key: 'notes', header: '✏️ Notes', width: 30 },
  ];

  wsAmbigu.columns = headers;

  // Style header
  const headerRow = wsAmbigu.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell, colNum) => {
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    // Colonnes éditables (M, N, O, P = 13, 14, 15, 16) en orange
    const isEdit = colNum >= 13;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isEdit ? 'FFEA580C' : 'FF1F2937' },
    };
  });

  let ambiguCount = 0;
  let rowIdx = 2;

  for (const p of products) {
    const result = classifyProduct(p);
    if (result.ambiguites.length === 0) continue;
    ambiguCount++;

    const descShort = (p.description || '').slice(0, 500).replace(/\s+/g, ' ');
    const row = wsAmbigu.addRow({
      ref: p.ref_fournisseur,
      fournisseur: p.fournisseur || '',
      marque: p.marque || '',
      nom: p.nom,
      cat_actuelle: p.categorie || '',
      cat_detectee: result.categorie || '',
      sous_cat_detectee: result.sous_categorie || '',
      genre_detecte: result.genre || '',
      ambiguites: result.ambiguites.join(' | '),
      candidats: result.candidats.join(' + '),
      composition: p.composition || '',
      description: descShort,
      // Pré-remplir les colonnes éditables avec la détection
      cat_finale: result.categorie || '',
      sous_cat_finale: result.sous_categorie || '',
      genre_final: result.genre || '',
      notes: '',
    });

    // Style : cellules éditables fond jaune clair
    ['M', 'N', 'O', 'P'].forEach((letter) => {
      const cell = row.getCell(letter);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFED7AA' } },
        left: { style: 'thin', color: { argb: 'FFFED7AA' } },
        bottom: { style: 'thin', color: { argb: 'FFFED7AA' } },
        right: { style: 'thin', color: { argb: 'FFFED7AA' } },
      };
    });

    // Zone description : wrap et couleur gris
    row.getCell('L').alignment = { vertical: 'top', wrapText: true };
    row.getCell('L').font = { size: 9, color: { argb: 'FF6B7280' } };
    row.height = 36;

    rowIdx++;
  }

  // ─── Data validation (dropdowns) ───────────────────────────────────────
  const lastRow = rowIdx - 1;

  if (lastRow >= 2) {
    // Col M (cat_finale) : dropdown depuis Categories
    for (let r = 2; r <= lastRow; r++) {
      wsAmbigu.getCell(`M${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['=Categories'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Catégorie invalide',
        error: 'Choisissez une catégorie dans la liste.',
      };

      // Col N (sous_cat_finale) : dropdown dynamique via INDIRECT
      wsAmbigu.getCell(`N${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`=INDIRECT(SUBSTITUTE(SUBSTITUTE($M${r},"-","_"),\" \",\"_\"))`],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Sous-catégorie invalide',
        error: 'Choisissez dans la liste correspondant à la catégorie choisie en colonne M.',
      };

      // Col O (genre_final) : dropdown 4 valeurs
      wsAmbigu.getCell(`O${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['=Genres'],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Genre invalide',
        error: 'Choisissez homme / femme / unisexe / enfant.',
      };
    }
  }

  // Freeze 1ère ligne + 4 premières colonnes, autofilter
  wsAmbigu.views = [{ state: 'frozen', xSplit: 4, ySplit: 1 }];
  wsAmbigu.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  // ─── Feuille 3 : OK (non ambigus, pour référence) ──────────────────────
  const wsOk = wb.addWorksheet('OK (auto)');
  wsOk.columns = [
    { key: 'ref', header: 'Ref', width: 12 },
    { key: 'fournisseur', header: 'Fournisseur', width: 12 },
    { key: 'nom', header: 'Nom produit', width: 40 },
    { key: 'cat', header: 'Catégorie', width: 14 },
    { key: 'sous_cat', header: 'Sous-catégorie', width: 22 },
    { key: 'genre', header: 'Genre', width: 12 },
  ];
  wsOk.getRow(1).eachCell(c => {
    c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let okCount = 0;
  for (const p of products) {
    const result = classifyProduct(p);
    if (result.ambiguites.length > 0) continue;
    okCount++;
    wsOk.addRow({
      ref: p.ref_fournisseur,
      fournisseur: p.fournisseur || '',
      nom: p.nom,
      cat: result.categorie || '',
      sous_cat: result.sous_categorie || '',
      genre: result.genre || '',
    });
  }
  wsOk.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  wsOk.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 6 } };

  // ─── Feuille 4 : Résumé ────────────────────────────────────────────────
  const wsResume = wb.addWorksheet('Résumé', { properties: { tabColor: { argb: 'FF1F2937' } } });
  wsResume.getCell('A1').value = 'Audit taxonomie v2 — Toque2Me';
  wsResume.getCell('A1').font = { bold: true, size: 16 };
  wsResume.getCell('A3').value = 'Total produits actifs :';
  wsResume.getCell('B3').value = products.length;
  wsResume.getCell('A4').value = 'Classifiés auto (feuille OK) :';
  wsResume.getCell('B4').value = okCount;
  wsResume.getCell('A5').value = 'À traiter (feuille À traiter) :';
  wsResume.getCell('B5').value = ambiguCount;
  wsResume.getCell('A6').value = 'Date de l\'audit :';
  wsResume.getCell('B6').value = new Date();
  wsResume.getColumn(1).width = 35;
  wsResume.getColumn(2).width = 20;

  wsResume.getCell('A8').value = 'Mode d\'emploi';
  wsResume.getCell('A8').font = { bold: true, size: 12 };
  const instructions = [
    '1. Onglet "À traiter" : les 4 colonnes orange à droite sont à éditer.',
    '2. Colonne "Cat. finale" : menu déroulant avec les 12 catégories.',
    '3. Colonne "Sous-cat finale" : menu déroulant qui change selon la cat choisie.',
    '4. Colonne "Genre final" : homme / femme / unisexe / enfant.',
    '5. Colonne "Notes" : commentaire libre.',
    '6. Les cellules sont pré-remplies avec la détection auto. Vérifiez et corrigez.',
    '7. Filtrer par "Pourquoi ambigu" pour traiter les cas par lot.',
    '8. Quand c\'est fait, renvoie-moi le fichier je l\'applique en DB.',
  ];
  instructions.forEach((txt, i) => {
    wsResume.getCell(`A${9 + i}`).value = txt;
    wsResume.mergeCells(`A${9 + i}:F${9 + i}`);
  });

  // ─── Enregistrement ────────────────────────────────────────────────────
  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = path.join(outDir, `audit-taxonomy-${stamp}.xlsx`);
  await wb.xlsx.writeFile(outPath);

  console.log(`\n✅ Fichier Excel généré.`);
  console.log(`   Total : ${products.length} produits`);
  console.log(`   À traiter : ${ambiguCount}`);
  console.log(`   OK auto : ${okCount}`);
  console.log(`   Fichier : ${outPath}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
