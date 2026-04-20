'use client';

import { useMemo } from 'react';
import { estimateDelivery, formatDeliveryDate, deliveryBadgeText } from '@/lib/delivery';

interface Props {
  fournisseur: string;
  technique?: string;
  delaiProdJours?: number;
  compact?: boolean;
}

export function DeliveryBadge({ fournisseur, technique = 'sans', delaiProdJours, compact = false }: Props) {
  const estimate = useMemo(
    () => estimateDelivery(fournisseur, technique, new Date(), delaiProdJours ?? undefined),
    [fournisseur, technique, delaiProdJours]
  );

  const isRapide = estimate.totalJoursOuvres <= 5;
  const badge = deliveryBadgeText(estimate.totalJoursOuvres);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${
        isRapide
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-neutral-50 text-neutral-500 border border-neutral-200'
      }`}>
        {isRapide && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
        {badge}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md ${
      isRapide
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-neutral-50 text-neutral-600 border border-neutral-200'
    }`}>
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
      {formatDeliveryDate(estimate)}
    </div>
  );
}
