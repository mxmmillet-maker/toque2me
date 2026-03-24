'use client';

import { useState } from 'react';
import { Coloris } from '@/lib/mock-products';

interface ColorSelectorProps {
  coloris: Coloris[];
}

export function ColorSelector({ coloris }: ColorSelectorProps) {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm text-neutral-500">Coloris :</span>
        <span className="text-sm font-medium text-neutral-900">{coloris[selected].nom}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {coloris.map((c, i) => (
          <button
            key={c.nom}
            onClick={() => setSelected(i)}
            title={c.nom}
            className={`w-8 h-8 rounded-full transition-all ${
              i === selected
                ? 'ring-2 ring-offset-2 ring-neutral-900'
                : 'ring-1 ring-neutral-200 hover:ring-neutral-400'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}
