'use client';

import { useState } from 'react';
import { QuantitySlider } from '@/components/calculateur/QuantitySlider';

export default function WidgetPage() {
  const [qty, setQty] = useState(50);
  const [ref] = useState('8040'); // T-shirt bio par défaut
  const prixUnitaire = 7.80;
  const total = qty * prixUnitaire;

  return (
    <div className="max-w-sm mx-auto p-6 font-sans">
      <h2 className="text-lg font-semibold text-neutral-900 mb-1">Estimez votre budget textile</h2>
      <p className="text-xs text-neutral-400 mb-6">Propulsé par Toque2Me</p>

      <QuantitySlider value={qty} onChange={setQty} />

      <div className="mt-6 p-4 bg-neutral-50 rounded-xl space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">T-shirt bio 220g × {qty}</span>
          <span className="font-medium text-neutral-900 tabular-nums">{total.toFixed(0)} € HT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Marquage estimé</span>
          <span className="font-medium text-neutral-900 tabular-nums">{(qty * 3.5).toFixed(0)} € HT</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-neutral-200">
          <span className="font-semibold">Budget estimé</span>
          <span className="font-bold text-neutral-900 tabular-nums">{(total + qty * 3.5).toFixed(0)} € HT</span>
        </div>
      </div>

      <a
        href={`https://toque2me.com/calculateur?ref=${ref}&utm_source=widget`}
        target="_blank"
        rel="noopener"
        className="block w-full mt-4 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg text-center hover:bg-neutral-800 transition-colors"
      >
        Obtenir un devis détaillé
      </a>
      <p className="text-[10px] text-neutral-400 text-center mt-2">
        <a href="https://toque2me.com" target="_blank" rel="noopener" className="underline">toque2me.com</a> — textile personnalisé pour pros
      </p>
    </div>
  );
}
