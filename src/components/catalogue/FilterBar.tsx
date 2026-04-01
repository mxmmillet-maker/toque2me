'use client';

interface Filters {
  categorie: string;
  grammageMin: number;
  grammageMax: number;
  lavage: string;
  certification: string;
  tri: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  certifications: string[];
}

export function FilterBar({ filters, onChange, certifications }: FilterBarProps) {
  const update = (key: keyof Filters, value: string | number) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = filters.grammageMin > 0 || filters.grammageMax < 999 || filters.lavage || filters.certification || filters.tri;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Grammage */}
      <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm">
        <span className="text-slate-400 text-xs">Grammage</span>
        <input
          type="number"
          value={filters.grammageMin || ''}
          onChange={(e) => update('grammageMin', parseInt(e.target.value) || 0)}
          placeholder="min"
          className="w-14 text-center text-sm text-slate-700 focus:outline-none bg-transparent"
        />
        <span className="text-slate-300">–</span>
        <input
          type="number"
          value={filters.grammageMax < 999 ? filters.grammageMax : ''}
          onChange={(e) => update('grammageMax', parseInt(e.target.value) || 999)}
          placeholder="max"
          className="w-14 text-center text-sm text-slate-700 focus:outline-none bg-transparent"
        />
        <span className="text-slate-400 text-xs">g/m²</span>
      </div>

      {/* Lavage */}
      <select
        value={filters.lavage}
        onChange={(e) => update('lavage', e.target.value)}
        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
      >
        <option value="">Lavage</option>
        <option value="40">40°C min</option>
        <option value="60">60°C min</option>
        <option value="95">95°C min</option>
      </select>

      {/* Certifications */}
      {certifications.length > 0 && (
        <select
          value={filters.certification}
          onChange={(e) => update('certification', e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
        >
          <option value="">Certification</option>
          {certifications.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* Tri */}
      <select
        value={filters.tri}
        onChange={(e) => update('tri', e.target.value)}
        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
      >
        <option value="">Trier par</option>
        <option value="prix-asc">Prix croissant</option>
        <option value="prix-desc">Prix décroissant</option>
        <option value="grammage-desc">Grammage ↓</option>
        <option value="qualite">Qualité</option>
      </select>

      {hasFilters && (
        <button
          onClick={() => onChange({ ...filters, grammageMin: 0, grammageMax: 999, lavage: '', certification: '', tri: '' })}
          className="text-xs text-slate-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
