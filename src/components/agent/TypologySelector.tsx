'use client';

const TYPOLOGIES = [
  { id: 'T-shirts', label: 'T-shirts', icon: '👕' },
  { id: 'Polos', label: 'Polos', icon: '👔' },
  { id: 'Sweats', label: 'Sweats', icon: '🧥' },
  { id: 'Vestes', label: 'Vestes', icon: '🧥' },
  { id: 'Tabliers', label: 'Tabliers', icon: '👨‍🍳' },
  { id: 'Pantalons', label: 'Pantalons', icon: '👖' },
  { id: 'Accessoires', label: 'Accessoires', icon: '🧢' },
  { id: 'Bagagerie', label: 'Sacs & Bagagerie', icon: '🎒' },
];

interface TypologySelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  onNext: () => void;
}

export function TypologySelector({ selected, onChange, onNext }: TypologySelectorProps) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">
        Quels types de produits recherchez-vous ?
      </h2>
      <p className="text-sm text-neutral-500 mb-6">Sélectionnez une ou plusieurs catégories</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {TYPOLOGIES.map((t) => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              selected.includes(t.id)
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-100 hover:border-neutral-300'
            }`}
          >
            <span className="text-2xl">{t.icon}</span>
            <span className="text-xs font-medium text-neutral-700">{t.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={selected.length === 0}
        className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Continuer
      </button>
    </div>
  );
}
