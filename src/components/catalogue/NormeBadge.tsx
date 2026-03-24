'use client';

import { useState } from 'react';

const NORME_DESCRIPTIONS: Record<string, string> = {
  'HACCP': 'Hazard Analysis Critical Control Point — norme d\'hygiène obligatoire en restauration collective.',
  'EN-ISO-20471': 'Vêtements haute visibilité — signalisation pour les travailleurs exposés au trafic.',
  'EN1149-5': 'Protection contre les décharges électrostatiques en environnement ATEX.',
  'EN-ISO-11612': 'Protection contre la chaleur et les flammes — soudure et métallurgie.',
  'GOTS': 'Global Organic Textile Standard — certification textile biologique et responsable.',
  'Oeko-Tex': 'Oeko-Tex Standard 100 — garantit l\'absence de substances nocives pour la santé.',
  'Fair Wear': 'Fair Wear Foundation — conditions de travail équitables dans la chaîne de production.',
};

interface NormeBadgeProps {
  label: string;
  variant?: 'norme' | 'certification';
}

export function NormeBadge({ label, variant = 'norme' }: NormeBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const description = NORME_DESCRIPTIONS[label];

  const baseClasses = variant === 'norme'
    ? 'bg-neutral-900 text-white'
    : 'bg-neutral-100 text-neutral-700 border border-neutral-200';

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`inline-block px-2.5 py-1 text-xs font-medium tracking-wide uppercase rounded cursor-default ${baseClasses}`}
      >
        {label}
      </span>

      {showTooltip && description && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-neutral-900 text-white text-xs leading-relaxed rounded-lg shadow-lg pointer-events-none">
          <div className="font-medium mb-0.5">{label}</div>
          <div className="text-neutral-300">{description}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-neutral-900" />
        </div>
      )}
    </div>
  );
}
