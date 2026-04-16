'use client';

import { useState, useEffect } from 'react';

interface QCMResult {
  secteur: string;
  budget_global: number;
  nb_personnes: number;
  pieces: string[];
  usage: string;
  style?: string;
  type_etablissement?: string;
}

interface QCMStepProps {
  onComplete: (answers: QCMResult) => void;
  loading?: boolean;
  onPartialUpdate?: (partial: Partial<{ secteur: string; typologies: string[]; style: string; usage: string; nb_personnes: number; budget_global: number }>) => void;
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
  { id: 'Chemises', label: 'Chemises' },
  { id: 'Tabliers', label: 'Tabliers' },
  { id: 'Chef', label: 'Chef / Cuisine pro' },
  { id: 'Pantalons', label: 'Pantalons' },
  { id: 'Accessoires', label: 'Casquettes / Bonnets' },
  { id: 'Bagagerie', label: 'Sacs / Tote bags' },
  { id: 'Parapluies', label: 'Parapluies' },
  { id: 'Objets tech', label: 'Gourdes / Objets tech' },
  { id: 'Goodies', label: 'Goodies / Peluches' },
];

const STYLES = [
  { id: 'casual', label: 'Casual / Décontracté', sub: 'Confort et simplicité', icon: '👕' },
  { id: 'chic', label: 'Casual chic', sub: 'Élégant mais accessible', icon: '👔' },
  { id: 'sportswear', label: 'Sportswear', sub: 'Dynamique et moderne', icon: '🏃' },
  { id: 'classique', label: 'Classique / Pro', sub: 'Sobre et professionnel', icon: '🧥' },
];

const ETABLISSEMENTS = [
  { id: 'bistro', label: 'Bistro / Brasserie', icon: '🍺' },
  { id: 'gastronomique', label: 'Gastronomique', icon: '🍷' },
  { id: 'fast-food', label: 'Fast-food / Snack', icon: '🍔' },
  { id: 'traiteur', label: 'Traiteur / Événementiel', icon: '🎪' },
  { id: 'boulangerie', label: 'Boulangerie / Pâtisserie', icon: '🥐' },
  { id: 'hotel', label: 'Hôtel / Hébergement', icon: '🏨' },
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
          className={`text-left p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 ${
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
          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 ${
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

export function QCMStep({ onComplete, loading = false, onPartialUpdate }: QCMStepProps) {
  const [step, setStep] = useState(0);
  const [secteur, setSecteur] = useState<string | null>(null);
  const [typeEtablissement, setTypeEtablissement] = useState<string | null>(null);
  const [budgetGlobal, setBudgetGlobal] = useState('');
  const [nbPersonnes, setNbPersonnes] = useState('');
  const [pieces, setPieces] = useState<string[]>([]);
  const [style, setStyle] = useState<string | null>(null);
  const [usage, setUsage] = useState<string | null>(null);

  const isRestaurant = secteur === 'restaurateur';

  // Gérer le back/forward du navigateur pour les sous-étapes
  const [isPopState, setIsPopState] = useState(false);

  useEffect(() => {
    if (isPopState) {
      setIsPopState(false);
      return;
    }
    if (step > 0) {
      window.history.pushState({ qcmSubStep: step }, '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.qcmSubStep !== undefined) {
        setIsPopState(true);
        setStep(e.state.qcmSubStep);
      } else {
        // Si pas de sous-étape dans l'état, on revient à 0
        // mais seulement si on est dans le QCM (step > 0)
        setIsPopState(true);
        setStep((s) => Math.max(0, s - 1));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleComplete = (usageId: string) => {
    setUsage(usageId);
    setTimeout(() => {
      onComplete({
        secteur: secteur!,
        budget_global: parseInt(budgetGlobal),
        nb_personnes: parseInt(nbPersonnes),
        pieces,
        usage: usageId,
        style: style || undefined,
        type_etablissement: isRestaurant ? (typeEtablissement || undefined) : undefined,
      });
    }, 300);
  };

  // Construction dynamique des étapes selon le secteur
  const buildSteps = () => {
    const steps: { title: string; subtitle?: string; content: React.ReactNode; valid: boolean }[] = [
      {
        title: 'Votre secteur d\'activité ?',
        content: (
          <CardGrid
            options={SECTEURS}
            selected={secteur}
            onSelect={(id) => {
              setSecteur(id);
              setTypeEtablissement(null);
              onPartialUpdate?.({ secteur: id });
              setTimeout(() => setStep(1), 300);
            }}
          />
        ),
        valid: !!secteur,
      },
    ];

    // Si restauration → demander le type d'établissement
    if (isRestaurant) {
      steps.push({
        title: 'Quel type d\'établissement ?',
        content: (
          <CardGrid
            options={ETABLISSEMENTS}
            selected={typeEtablissement}
            onSelect={(id) => { setTypeEtablissement(id); setTimeout(() => setStep((s) => s + 1), 300); }}
          />
        ),
        valid: !!typeEtablissement,
      });
    }

    steps.push(
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
          </div>
        ),
        valid: !!budgetGlobal && !!nbPersonnes,
      },
      {
        title: 'Quelles pièces vous intéressent ?',
        subtitle: 'Sélectionnez tout ce qui pourrait faire partie du mix',
        content: (
          <div className="space-y-4">
            <MultiSelect options={PIECES} selected={pieces} onChange={(newPieces) => {
              setPieces(newPieces);
              onPartialUpdate?.({ typologies: newPieces });
            }} />
          </div>
        ),
        valid: pieces.length > 0,
      },
      {
        title: 'Quel style vestimentaire ?',
        subtitle: 'L\'ambiance que vous recherchez pour votre équipe',
        content: (
          <CardGrid
            options={STYLES}
            selected={style}
            onSelect={(id) => { setStyle(id); onPartialUpdate?.({ style: id }); setTimeout(() => setStep((s) => s + 1), 300); }}
          />
        ),
        valid: !!style,
      },
      {
        title: 'Quel usage ?',
        subtitle: 'Cela détermine le niveau de qualité adapté',
        content: (
          <CardGrid
            options={USAGES}
            selected={usage}
            onSelect={handleComplete}
          />
        ),
        valid: !!usage,
      },
    );

    return steps;
  };

  const STEPS = buildSteps();

  const current = STEPS[step];

  return (
    <div className={loading ? 'pointer-events-none cursor-wait' : ''}>
      {/* Overlay loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-8 mb-4">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Recherche des meilleurs produits…</p>
        </div>
      )}

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

      <h2 className={`text-lg font-semibold text-neutral-900 mb-1 ${loading ? 'opacity-40' : ''}`}>{current.title}</h2>
      {current.subtitle && (
        <p className={`text-sm text-neutral-500 mb-5 ${loading ? 'opacity-40' : ''}`}>{current.subtitle}</p>
      )}
      {!current.subtitle && <div className="mb-5" />}

      <div className={loading ? 'opacity-40' : ''}>{current.content}</div>

      {/* Bouton Continuer pour les étapes sans auto-advance */}
      {current.valid && !['Votre secteur d\'activité ?', 'Quel type d\'établissement ?', 'Quel style vestimentaire ?', 'Quel usage ?'].includes(current.title) && (
        <button
          onClick={() => setStep(step + 1)}
          className="w-full mt-4 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Continuer
        </button>
      )}

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Étape précédente
        </button>
      )}
    </div>
  );
}
