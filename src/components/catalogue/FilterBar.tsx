'use client';

interface Filters {
  categorie: string;
  secteur: string;
  origine: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  categories: string[];
  secteurs: string[];
  origines: string[];
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow cursor-pointer"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function FilterBar({ filters, onChange, categories, secteurs, origines }: FilterBarProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = filters.categorie || filters.secteur || filters.origine;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        label="Catégorie"
        value={filters.categorie}
        options={categories}
        onChange={(v) => update('categorie', v)}
      />
      <Select
        label="Secteur"
        value={filters.secteur}
        options={secteurs}
        onChange={(v) => update('secteur', v)}
      />
      <Select
        label="Origine"
        value={filters.origine}
        options={origines}
        onChange={(v) => update('origine', v)}
      />
      {hasFilters && (
        <button
          onClick={() => onChange({ categorie: '', secteur: '', origine: '' })}
          className="text-sm text-slate-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
