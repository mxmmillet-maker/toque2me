'use client';

import { useState } from 'react';
import { MarquageSimulator } from '@/components/marquage/MarquageSimulator';

interface Color {
  nom: string;
  hexa: string;
  image?: string;
  image_back?: string;
}

interface ColorSelectorProps {
  colors: Color[];
  defaultImage: string;
  productName: string;
}

export function ColorSelector({ colors, defaultImage, productName }: ColorSelectorProps) {
  const [selected, setSelected] = useState<Color | null>(null);

  const currentImage = selected?.image || defaultImage;
  const currentImageBack = selected?.image_back || undefined;

  return (
    <div className="space-y-4">
      {/* Image principale */}
      <div className="relative aspect-square bg-neutral-50 rounded-xl overflow-hidden">
        {currentImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentImage}
            alt={`${productName}${selected ? ` — ${selected.nom}` : ''}`}
            className="absolute inset-0 w-full h-full object-contain p-4"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-300 text-sm">
            Pas de photo
          </div>
        )}
        {selected && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs text-neutral-700 font-medium shadow-sm">
            {selected.nom}
          </div>
        )}
      </div>

      {/* Sélecteur couleurs */}
      {colors.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">
            {colors.length} couleur{colors.length > 1 ? 's' : ''} — {selected?.nom || 'Sélectionnez une couleur'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => {
              const isSelected = selected?.nom === c.nom;
              return (
                <button
                  key={c.nom}
                  onClick={() => setSelected(isSelected ? null : c)}
                  title={c.nom}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    isSelected
                      ? 'border-neutral-900 ring-2 ring-neutral-900 ring-offset-1'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: c.hexa || '#ccc' }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Simulateur de marquage */}
      {currentImage && (
        <MarquageSimulator
          productImage={currentImage}
          productImageBack={currentImageBack}
          productName={productName}
        />
      )}
    </div>
  );
}
