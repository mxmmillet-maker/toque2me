'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface PackLine {
  id: string;
  label: string;
  ref: string;
  image: string;
  prixUnitaire: number;
  qteParPersonne: number;
  active: boolean;
  couleurs: { nom: string; hex: string }[];
  couleurChoisie: number;
}

const DEFAULT_PACK: PackLine[] = [
  { id: 'tshirt', label: 'T-shirt bio 220g', ref: '8040', image: '', prixUnitaire: 7.80, qteParPersonne: 3, active: true,
    couleurs: [{ nom: 'Noir', hex: '#1a1a1a' }, { nom: 'Blanc', hex: '#ffffff' }, { nom: 'Marine', hex: '#1b2a4a' }, { nom: 'Gris', hex: '#9ca3af' }], couleurChoisie: 0 },
  { id: 'sweat', label: 'Sweat à capuche 380g', ref: 'JN1144', image: '', prixUnitaire: 22.50, qteParPersonne: 1, active: true,
    couleurs: [{ nom: 'Noir', hex: '#1a1a1a' }, { nom: 'Marine', hex: '#1b2a4a' }, { nom: 'Gris chiné', hex: '#9ca3af' }], couleurChoisie: 0 },
  { id: 'tablier', label: 'Tablier bavette 260g', ref: 'CXS1090-002', image: '', prixUnitaire: 12.00, qteParPersonne: 1, active: true,
    couleurs: [{ nom: 'Noir', hex: '#1a1a1a' }, { nom: 'Blanc', hex: '#ffffff' }, { nom: 'Bordeaux', hex: '#7f1d1d' }], couleurChoisie: 0 },
  { id: 'casquette', label: 'Casquette Trucker', ref: 'MB6550', image: '', prixUnitaire: 4.50, qteParPersonne: 1, active: true,
    couleurs: [{ nom: 'Noir', hex: '#1a1a1a' }, { nom: 'Marine', hex: '#1b2a4a' }, { nom: 'Blanc', hex: '#ffffff' }], couleurChoisie: 0 },
];

const MARQUAGE_PRIX: Record<string, Record<string, number>> = {
  impression: { coeur: 3.5, dos: 5.0 },
  broderie: { coeur: 5.5, dos: 8.0 },
};

const MARQUAGE_DELAIS: Record<string, string> = {
  impression: '≈ 10 jours ouvrés',
  broderie: '≈ 3 semaines',
};

export default function RestaurateursPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RestaurateursContent />
    </Suspense>
  );
}

function RestaurateursContent() {
  const searchParams = useSearchParams();
  const [nbPersonnes, setNbPersonnes] = useState(10);
  const [pack, setPack] = useState(DEFAULT_PACK);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [technique, setTechnique] = useState<'impression' | 'broderie'>('impression');
  const [emplacements, setEmplacements] = useState({ coeur: true, dos: false });

  // Remplacement d'un produit via ?replace=lineId&ref=newRef
  useEffect(() => {
    const replaceId = searchParams.get('replace');
    const newRef = searchParams.get('ref');
    if (!replaceId || !newRef) return;

    fetch(`/api/pack-products?refs=${newRef}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.products?.[0];
        if (!p) return;
        setPack((prev) =>
          prev.map((line) =>
            line.id === replaceId
              ? { ...line, ref: p.ref_fournisseur, label: p.nom, image: p.image_url || '', prixUnitaire: p.prix_vente_ht || line.prixUnitaire }
              : line
          )
        );
      });
  }, [searchParams]);

  // Charger les vrais produits depuis Supabase
  useEffect(() => {
    const refs = DEFAULT_PACK.map((p) => p.ref);
    fetch(`/api/pack-products?refs=${refs.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, any> = {};
        for (const p of data.products || []) {
          map[p.ref_fournisseur] = p;
        }
        setProducts(map);
        // Mettre à jour les images et prix
        setPack((prev) =>
          prev.map((line) => {
            const real = map[line.ref];
            if (real) {
              return {
                ...line,
                image: real.image_url || '',
                prixUnitaire: real.prix_vente_ht || line.prixUnitaire,
                label: real.nom || line.label,
              };
            }
            return line;
          })
        );
      })
      .catch(() => {});
  }, []);

  const toggleLine = (id: string) => {
    setPack((prev) => prev.map((l) => l.id === id ? { ...l, active: !l.active } : l));
  };

  const removeLine = (id: string) => {
    setPack((prev) => prev.filter((l) => l.id !== id));
  };

  const updateQte = (id: string, qte: number) => {
    setPack((prev) => prev.map((l) => l.id === id ? { ...l, qteParPersonne: Math.max(0, qte) } : l));
  };

  const updateCouleur = (id: string, index: number) => {
    setPack((prev) => prev.map((l) => l.id === id ? { ...l, couleurChoisie: index } : l));
  };

  // Ajout d'un produit au pack via ?add=ref
  useEffect(() => {
    const addRef = searchParams.get('add');
    if (!addRef) return;

    fetch(`/api/pack-products?refs=${addRef}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.products?.[0];
        if (!p) return;
        // Éviter les doublons
        if (pack.some((l) => l.ref === p.ref_fournisseur)) return;
        const newLine: PackLine = {
          id: `custom-${Date.now()}`,
          label: p.nom,
          ref: p.ref_fournisseur,
          image: p.image_url || '',
          prixUnitaire: p.prix_vente_ht || 10,
          qteParPersonne: 1,
          active: true,
          couleurs: [{ nom: 'Noir', hex: '#1a1a1a' }, { nom: 'Blanc', hex: '#ffffff' }, { nom: 'Marine', hex: '#1b2a4a' }],
          couleurChoisie: 0,
        };
        setPack((prev) => [...prev, newLine]);
      });
  }, [searchParams, pack]);

  const activeLines = useMemo(() => pack.filter((l) => l.active && l.qteParPersonne > 0), [pack]);

  const totalProduitsParPersonne = useMemo(
    () => activeLines.reduce((acc, l) => acc + l.prixUnitaire * l.qteParPersonne, 0),
    [activeLines]
  );
  const nbPiecesParPersonne = useMemo(
    () => activeLines.reduce((acc, l) => acc + l.qteParPersonne, 0),
    [activeLines]
  );
  const prixMarquageParPiece = useMemo(() => {
    let prix = 0;
    if (emplacements.coeur) prix += MARQUAGE_PRIX[technique].coeur;
    if (emplacements.dos) prix += MARQUAGE_PRIX[technique].dos;
    return prix;
  }, [technique, emplacements]);
  const marquageParPersonne = nbPiecesParPersonne * prixMarquageParPiece;
  const totalParPersonne = totalProduitsParPersonne + marquageParPersonne;
  const grandTotal = totalParPersonne * nbPersonnes;
  const livraison = grandTotal >= 150 ? 0 : 12.50;
  const delaiEstime = MARQUAGE_DELAIS[technique];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
          Votre équipe aux couleurs de votre restaurant
        </h1>
        <p className="mt-4 text-lg text-neutral-500 max-w-2xl mx-auto">
          Devis en 3 minutes, conformité HACCP incluse.<br />
          Composez votre pack sur-mesure.
        </p>
      </section>

      {/* Pack configurateur */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-neutral-50 rounded-2xl p-6 space-y-6">
          {/* Effectif */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700">Personnes à équiper</label>
              <input
                type="number"
                min={1}
                max={100}
                value={nbPersonnes}
                onChange={(e) => setNbPersonnes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-right text-lg font-bold text-neutral-900 border border-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <input
              type="range" min={1} max={50} value={nbPersonnes}
              onChange={(e) => setNbPersonnes(parseInt(e.target.value))}
              className="w-full accent-neutral-900"
            />
          </div>

          {/* Lignes du pack */}
          <div>
            <h2 className="text-sm font-medium text-neutral-700 mb-3">
              Composez votre pack — par personne
            </h2>
            <div className="space-y-3">
              {pack.map((line) => (
                <div
                  key={line.id}
                  className={`p-3 rounded-xl border transition-all ${
                    line.active ? 'border-neutral-200 bg-white' : 'border-neutral-100 bg-neutral-50 opacity-50'
                  }`}
                >
                  {/* Ligne 1 : checkbox + photo + nom + changer */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLine(line.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        line.active ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'
                      }`}
                    >
                      {line.active && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                      {line.image ? (
                        <Image src={line.image} alt={line.label} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-neutral-300 text-[10px]">N/A</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/catalogue/${line.ref}`}
                          className="text-sm font-medium text-neutral-900 truncate hover:underline underline-offset-2"
                        >
                          {line.label}
                        </Link>
                        <Link
                          href={`/catalogue?categorie=${encodeURIComponent(
                            line.id === 'tshirt' ? 'T-shirts' :
                            line.id === 'sweat' ? 'Sweats' :
                            line.id === 'tablier' ? 'Tabliers' :
                            line.id === 'casquette' ? 'Accessoires' :
                            'Autres'
                          )}&from=pack&line=${line.id}`}
                          className="text-[10px] text-neutral-400 hover:text-neutral-700 underline underline-offset-2 flex-shrink-0"
                        >
                          changer
                        </Link>
                        <button
                          onClick={() => removeLine(line.id)}
                          className="text-[10px] text-neutral-300 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                      <span className="text-xs text-neutral-400">{line.prixUnitaire.toFixed(2)} € HT</span>
                    </div>
                  </div>

                  {/* Ligne 2 : couleurs + quantité */}
                  {line.active && (
                    <div className="flex items-center justify-between mt-2 pl-8 sm:pl-[4.5rem]">
                      <div className="flex items-center gap-1.5">
                        {line.couleurs.map((c, ci) => (
                          <button
                            key={c.nom}
                            onClick={() => updateCouleur(line.id, ci)}
                            title={c.nom}
                            className={`w-5 h-5 rounded-full transition-all ${
                              line.couleurChoisie === ci
                                ? 'ring-2 ring-offset-1 ring-neutral-900'
                                : 'ring-1 ring-neutral-200'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQte(line.id, line.qteParPersonne - 1)}
                          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
                        >−</button>
                        <span className="w-8 text-center text-sm font-semibold text-neutral-900 tabular-nums">
                          {line.qteParPersonne}
                        </span>
                        <button
                          onClick={() => updateQte(line.id, line.qteParPersonne + 1)}
                          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
                        >+</button>
                        <span className="text-[10px] text-neutral-400 ml-1">/pers</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Ajouter une pièce */}
              <Link
                href="/catalogue?from=pack&line=add"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm">Ajouter une pièce</span>
              </Link>
            </div>
          </div>

          {/* Marquage */}
          <div className="border-t border-neutral-200 pt-4">
            <h2 className="text-sm font-medium text-neutral-700 mb-3">Marquage</h2>

            {/* Emplacements */}
            <div className="flex gap-3 mb-3">
              {([['coeur', 'Coeur (poitrine)'], ['dos', 'Dos']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setEmplacements((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                    emplacements[key]
                      ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                      : 'border-neutral-100 text-neutral-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Technique */}
            <div className="flex gap-3 mb-3">
              {([['impression', 'Impression', '≈ 10 jours'], ['broderie', 'Broderie', '≈ 3 semaines']] as const).map(([id, label, delai]) => (
                <button
                  key={id}
                  onClick={() => setTechnique(id)}
                  className={`flex-1 py-2.5 rounded-lg border-2 transition-all text-left px-3 ${
                    technique === id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-100'
                  }`}
                >
                  <span className={`text-sm font-medium block ${technique === id ? 'text-neutral-900' : 'text-neutral-500'}`}>{label}</span>
                  <span className="text-[10px] text-neutral-400">{delai}</span>
                </button>
              ))}
            </div>

            {(emplacements.coeur || emplacements.dos) && (
              <p className="text-xs text-neutral-500">
                {prixMarquageParPiece.toFixed(2)} € HT/pce
                {emplacements.coeur && emplacements.dos ? ' (coeur + dos)' : emplacements.coeur ? ' (coeur)' : ' (dos)'}
                {' · '}{delaiEstime}
              </p>
            )}
            {!emplacements.coeur && !emplacements.dos && (
              <p className="text-xs text-neutral-400">Sélectionnez au moins un emplacement</p>
            )}
          </div>

          {/* Récap */}
          <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {nbPiecesParPersonne} pièce{nbPiecesParPersonne > 1 ? 's' : ''}/pers × {nbPersonnes} pers
              </span>
              <span className="font-medium text-neutral-900 tabular-nums">
                {(totalProduitsParPersonne * nbPersonnes).toFixed(0)} €
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {technique === 'broderie' ? 'Broderie' : 'Impression'}
                {emplacements.coeur && emplacements.dos ? ' coeur+dos' : emplacements.coeur ? ' coeur' : emplacements.dos ? ' dos' : ''}
                {' '}({nbPiecesParPersonne * nbPersonnes} pces)
              </span>
              <span className="font-medium text-neutral-900 tabular-nums">
                {(marquageParPersonne * nbPersonnes).toFixed(0)} €
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">
                Livraison {livraison === 0 && <span className="text-emerald-600 font-medium">offerte</span>}
              </span>
              <span className="font-medium text-neutral-900 tabular-nums">{livraison.toFixed(2)} €</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-neutral-300">
            <div>
              <span className="text-base font-semibold text-neutral-900">Budget estimé HT</span>
              <span className="text-xs text-neutral-400 ml-2">
                soit {totalParPersonne.toFixed(0)} €/pers
              </span>
            </div>
            <span className="text-2xl font-bold text-neutral-900 tabular-nums">
              {(grandTotal + livraison).toFixed(0)} €
            </span>
          </div>

          <div className="flex gap-3">
            <Link
              href="/catalogue"
              className="flex-1 py-3 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg text-center hover:bg-neutral-100 transition-colors"
            >
              Voir le catalogue
            </Link>
            <Link
              href="/configurateur"
              className="flex-1 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg text-center hover:bg-neutral-800 transition-colors"
            >
              Demander un devis
            </Link>
          </div>
        </div>
      </section>

      {/* HACCP */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Conformité HACCP — ce que vous devez savoir
          </h2>
          <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
            <p>
              La méthode HACCP est obligatoire pour tout établissement de restauration.
              Les vêtements professionnels doivent être lavables à haute température (60°C minimum),
              de couleur claire, et changés quotidiennement.
            </p>
            <p>
              Chez Toque2Me, tous les produits proposés aux restaurateurs sont sélectionnés
              pour répondre à ces exigences. Vous commandez en toute sérénité.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
