'use client';

import { useState } from 'react';
import { useCart, type CartItem } from '@/lib/cart';

interface Props {
  ref_fournisseur: string;
  nom: string;
  image_url?: string;
  prix_from?: number;
  categorie?: string;
  couleurs?: { nom: string; hexa: string; image?: string }[];
}

export function AddToCartButton({ ref_fournisseur, nom, image_url, prix_from, categorie, couleurs }: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(10);
  const [selectedCouleur, setSelectedCouleur] = useState<string | undefined>();
  const [selectedHexa, setSelectedHexa] = useState<string | undefined>();
  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add({
      ref: ref_fournisseur,
      nom,
      image_url: selectedImage || image_url,
      couleur: selectedCouleur,
      couleur_hexa: selectedHexa,
      qty,
      prix_from,
      categorie,
      couleurs_dispo: couleurs?.map(c => ({ nom: c.nom, hexa: c.hexa, image: c.image })),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Sélection couleur (si pas déjà via ColorSelector) */}
      {couleurs && couleurs.length > 0 && (
        <div>
          <label className="text-xs text-neutral-400 block mb-1.5">Couleur pour le devis</label>
          <div className="flex flex-wrap gap-1.5">
            {couleurs.slice(0, 12).map((c) => (
              <button
                key={c.nom}
                onClick={() => { setSelectedCouleur(c.nom); setSelectedHexa(c.hexa); setSelectedImage(c.image); }}
                title={c.nom}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  selectedCouleur === c.nom
                    ? 'border-neutral-900 scale-110'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
                style={{ backgroundColor: c.hexa || '#ccc' }}
              />
            ))}
          </div>
          {selectedCouleur && (
            <p className="text-xs text-neutral-500 mt-1">{selectedCouleur}</p>
          )}
        </div>
      )}

      {/* Quantité + Ajout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setQty(q => Math.max(1, q - 5))}
            className="px-3 py-2.5 text-neutral-500 hover:bg-neutral-50 text-sm"
          >
            −
          </button>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            className="w-16 text-center text-sm py-2.5 focus:outline-none border-x border-neutral-200"
          />
          <button
            onClick={() => setQty(q => q + 5)}
            className="px-3 py-2.5 text-neutral-500 hover:bg-neutral-50 text-sm"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          className={`flex-1 px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950'
          }`}
        >
          {added ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Ajouté
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Ajouter au panier
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
