'use client';

import { useState } from 'react';

interface Ligne {
  nom: string;
  ref: string;
  image_url?: string;
  couleur_nom?: string;
  couleur_hexa?: string;
  qty: number;
}

export function PackPreview({ lignes }: { lignes: Ligne[] }) {
  const [open, setOpen] = useState(false);

  if (lignes.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Aperçu du pack
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900">Votre pack — {lignes.length} pièce{lignes.length > 1 ? 's' : ''}</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid photos */}
            <div className="p-5 overflow-y-auto max-h-[65vh]">
              <div className={`grid gap-3 ${lignes.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {lignes.map((l, i) => (
                  <div key={i} className="bg-neutral-50 rounded-xl p-3 flex flex-col items-center">
                    {l.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={l.image_url}
                        alt={l.nom}
                        className="w-full aspect-square object-contain rounded-lg mb-2"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-300 text-sm mb-2">
                        Photo
                      </div>
                    )}
                    <p className="text-xs font-medium text-neutral-900 text-center line-clamp-2">{l.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {l.couleur_hexa && (
                        <span
                          className="w-3 h-3 rounded-full border border-neutral-200"
                          style={{ backgroundColor: l.couleur_hexa }}
                        />
                      )}
                      {l.couleur_nom && (
                        <span className="text-[10px] text-neutral-500">{l.couleur_nom}</span>
                      )}
                      <span className="text-[10px] text-neutral-400">x{l.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
