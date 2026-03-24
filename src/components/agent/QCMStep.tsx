'use client';

import { useState } from 'react';

interface QCMResult {
  secteur: string;
  budget_global: number;
  nb_personnes: number;
  pieces: string[];
  usage: string;
}

interface QCMStepProps {
  onComplete: (answers: QCMResult) => void;
}

const SECTEURS = [
  { id: 'restaurateur', label: 'Restauration / CHR', icon: '🍽️' },
  { id: 'btp', label: 'BTP / Chantier', icon: '🏗️' },
  { id: 'entreprise', label: 'Entreprise / Corporate', icon: '🏢' },
  { id: 'association', label: 'Association / Club', icon: '⚽' },
];

const PIECES = [
  { id: 'T-shirts', label: 'T-shirts' },
  { id: 'Polos', label: 'Polos' },
  { id: 'Sweats', label: 'Sweats / Hoodies' },
  { id: 'Vestes', label: 'Vestes' },
  { id: 'Tabliers', label: 'Tabliers' },
  { id: 'Pantalons', label: 'Pantalons' },
  { id: 'Accessoires', label: 'Casquettes / Bonnets' },
  { id: 'Bagagerie', label: 'Sacs / Tote bags' },
];

const USAGES = [
  { id: 'evenement', label: 'Un événement', sub: 'Porté quelques fois' },
  { id: 'quotidien', label: 'Usage quotidien', sub: 'Doit durer dans le temps' },
  { id: 'image', label: 'Image de marque', sub: 'Représente votre entreprise' },
];

function CardGrid<T extends string | number>({ options, selected, onSelect }: {
  options: { id: T; label: string; sub?: string; icon?: string }[];
  selected: T | null;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => (
        <button
          key={String(o.id)}
          onClick={() => onSelect(o.id)}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selected === o.id
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-100 hover:border-neutral-300'
          }`}
        >
          {o.icon && <span className="text-lg mb-1 block">{o.icon}</span>}
          <span className="text-sm font-medium text-neutral-900 block">{o.label}</span>
          {o.sub && <span className="text-xs text-neutral-400">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({ options, selected, onChange }: {
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => toggle(o.id)}
          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
            selected.includes(o.id)
              ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
              : 'border-neutral-100 text-neutral-600 hover:border-neutral-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function QCMStep({ onComplete }: QCMStepProps) {
  const [step, setStep] = useState(0);
  const [secteur, setSecteur] = useState<string | null>(null);
  const [budgetGlobal, setBudgetGlobal] = useState('');
  const [nbPersonnes, setNbPersonnes] = useState('');
  const [pieces, setPieces] = useState<string[]>([]);
  const [usage, setUsage] = useState<string | null>(null);

  const STEPS = [
    {
      title: 'Votre secteur d\'activité ?',
      content: (
        <CardGrid
          options={SECTEURS}
          selected={secteur}
          onSelect={(id) => { setSecteur(id); setTimeout(() => setStep(1), 300); }}
        />
      ),
      valid: !!secteur,
    },
    {
      title: 'Budget et effectif',
      subtitle: 'Donnez-nous une idée, même approximative',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Budget global estimé (€ HT)
            </label>
            <input
              type="number"
              value={budgetGlobal}
              onChange={(e) => setBudgetGlobal(e.target.value)}
              placeholder="Ex : 2000"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Nombre de personnes à équiper
            </label>
            <input
              type="number"
              value={nbPersonnes}
              onChange={(e) => setNbPersonnes(e.target.value)}
              placeholder="Ex : 15"
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          {budgetGlobal && nbPersonnes && parseInt(nbPersonnes) > 0 && (
            <p className="text-sm text-neutral-500 bg-neutral-50 rounded-lg px-4 py-2">
              ≈ {(parseInt(budgetGlobal) / parseInt(nbPersonnes)).toFixed(0)} € par personne
            </p>
          )}
          <button
            onClick={() => setStep(2)}
            disabled={!budgetGlobal || !nbPersonnes}
            className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Continuer
          </button>
        </div>
      ),
      valid: !!budgetGlobal && !!nbPersonnes,
    },
    {
      title: 'Quelles pièces vous intéressent ?',
      subtitle: 'Sélectionnez tout ce qui pourrait faire partie du mix',
      content: (
        <div className="space-y-4">
          <MultiSelect options={PIECES} selected={pieces} onChange={setPieces} />
          <button
            onClick={() => setStep(3)}
            disabled={pieces.length === 0}
            className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Continuer
          </button>
        </div>
      ),
      valid: pieces.length > 0,
    },
    {
      title: 'Quel usage ?',
      subtitle: 'Cela détermine le niveau de qualité adapté',
      content: (
        <CardGrid
          options={USAGES}
          selected={usage}
          onSelect={(id) => {
            setUsage(id);
            setTimeout(() => {
              onComplete({
                secteur: secteur!,
                budget_global: parseInt(budgetGlobal),
                nb_personnes: parseInt(nbPersonnes),
                pieces,
                usage: id,
              });
            }, 300);
          }}
        />
      ),
      valid: !!usage,
    },
  ];

  const current = STEPS[step];

  return (
    <div>
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-neutral-900' : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>

      <h2 className="text-lg font-semibold text-neutral-900 mb-1">{current.title}</h2>
      {current.subtitle && (
        <p className="text-sm text-neutral-500 mb-5">{current.subtitle}</p>
      )}
      {!current.subtitle && <div className="mb-5" />}

      {current.content}

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-4 text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
        >
          Retour
        </button>
      )}
    </div>
  );
}
