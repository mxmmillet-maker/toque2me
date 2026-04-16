'use client';

import Link from 'next/link';
import { openChat, type ChatPrefillContext } from '@/components/agent/ChatBubble';

interface Props extends ChatPrefillContext {
  label?: string;
  variant?: 'dark' | 'light' | 'outline';
  href?: string;  // Si fourni → Link, sinon → ouvre le chat
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * Bouton unifié pour toute la navigation "Configurer" :
 * - variant="dark"  → fond noir, texte blanc (défaut, CTA principal)
 * - variant="light" → fond blanc, texte noir (pour sections sombres)
 * - variant="outline" → bordure seulement (CTA secondaire)
 *
 * Par défaut redirige vers /configurateur (parcours dédié).
 * Si prefill passé (secteur/métier) → ouvre le chat avec contexte.
 */
export function OpenChatButton({
  label = 'Configurer mon pack — 30s',
  variant = 'dark',
  size = 'md',
  href,
  className = '',
  ...prefill
}: Props) {
  const sizeClasses = size === 'lg' ? 'px-8 py-3.5 text-sm' : 'px-6 py-3 text-sm';
  const variantClasses = {
    dark: 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm border border-neutral-800',
    light: 'bg-white text-neutral-900 hover:bg-neutral-100',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
  }[variant];
  const base = `${sizeClasses} font-medium rounded-lg transition-colors inline-flex items-center justify-center ${variantClasses} ${className}`;

  // Si on a un contexte métier → ouvre le chat
  const hasPrefill = prefill.secteur || prefill.metier || prefill.typologies?.length;

  if (hasPrefill) {
    return (
      <button onClick={() => openChat(prefill)} className={base}>
        {label}
      </button>
    );
  }

  // Sinon → Link vers /configurateur (parcours dédié)
  return (
    <Link href={href || '/configurateur'} className={base}>
      {label}
    </Link>
  );
}

// Alias pour rétro-compat
export const OpenChatButtonLight = (props: Omit<Props, 'variant'>) => (
  <OpenChatButton variant="light" {...props} />
);
