import Image from 'next/image';
import Link from 'next/link';
import { SupabaseProduct } from '@/lib/supabase-types';

interface ProductCardProps {
  product: SupabaseProduct;
  packMode?: string;
}

export function ProductCard({ product, packMode }: ProductCardProps) {
  const href = packMode
    ? `/catalogue/${product.ref_fournisseur}?from=pack&line=${packMode}`
    : `/catalogue/${product.ref_fournisseur}`;

  return (
    <Link href={href} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all duration-300 block">
      <div className="relative aspect-square bg-neutral-50 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.nom}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300 text-sm">
            Pas de photo
          </div>
        )}
        {product.normes && product.normes.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {product.normes.map((norme) => (
              <span
                key={norme}
                className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-medium tracking-wider uppercase rounded"
              >
                {norme}
              </span>
            ))}
          </div>
        )}
        {product.score_durabilite && product.score_durabilite >= 85 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium tracking-wider uppercase rounded border border-emerald-200">
            Éco-responsable
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-sm font-medium text-neutral-900 leading-snug line-clamp-2">
          {product.nom}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center gap-2 pt-1">
          {product.grammage && (
            <span className="text-[11px] text-slate-400">
              {product.grammage}g/m²
            </span>
          )}
          {product.grammage && product.origine && (
            <span className="text-slate-200">·</span>
          )}
          {product.origine && (
            <span className="text-[11px] text-slate-400">
              {product.origine}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between pt-2 border-t border-slate-50">
          {product.prix_from ? (
            <div>
              <span className="text-xs text-slate-400">À partir de </span>
              <span className="text-base font-semibold text-neutral-900">
                {product.prix_from.toFixed(2)}&nbsp;€
              </span>
              <span className="text-xs text-slate-400"> HT</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Prix sur devis</span>
          )}
          <span className="text-xs font-medium text-slate-600 group-hover:text-neutral-900 underline underline-offset-2 transition-colors">
            Voir
          </span>
        </div>
      </div>
    </Link>
  );
}
