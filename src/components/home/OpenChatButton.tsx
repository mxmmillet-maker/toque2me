'use client';

import Link from 'next/link';
import { type ChatPrefillContext } from '@/components/agent/ChatBubble';

interface Props extends ChatPrefillContext {
  label?: string;
  variant?: 'dark' | 'light' | 'outline';
  href?: string;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * Bouton unifié pour toute la navigation "Configurer" :
 * - variant="dark"  → fond noir, texte blanc (défaut, CTA principal)
 * - variant="light" → fond blanc, texte noir (pour sections sombres)
 * - variant="outline" → bordure seulement (CTA secondaire)
 *
 * Redirige toujours vers /configurateur. Si prefill (secteur/métier/typologies) fourni,
 * on passe le contexte via query string → le configurateur pré-remplit le QCM.
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

  // Build URL avec prefill si besoin
  let target = href || '/configurateur';
  const params = new URLSearchParams();
  if (prefill.secteur) params.set('secteur', prefill.secteur);
  if (prefill.metier) params.set('metier', prefill.metier);
  if (prefill.typologies?.length) params.set('typologies', prefill.typologies.join(','));
  if (prefill.occasion) params.set('occasion', prefill.occasion);
  const query = params.toString();
  if (query) target += (target.includes('?') ? '&' : '?') + query;

  return (
    <Link href={target} className={base}>
      {label}
    </Link>
  );
}

// Alias pour rétro-compat
export const OpenChatButtonLight = (props: Omit<Props, 'variant'>) => (
  <OpenChatButton variant="light" {...props} />
);
