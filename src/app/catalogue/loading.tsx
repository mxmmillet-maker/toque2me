import { ProductCardSkeleton } from '@/components/catalogue/ProductCardSkeleton';

export default function CatalogueLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-6">
          <div className="h-8 bg-neutral-100 rounded w-48 animate-pulse" />
          <div className="h-10 bg-neutral-100 rounded w-full animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 bg-neutral-100 rounded w-32 animate-pulse" />
            <div className="h-10 bg-neutral-100 rounded w-32 animate-pulse" />
            <div className="h-10 bg-neutral-100 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
