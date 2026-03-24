export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-neutral-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-neutral-100 rounded w-3/4" />
        <div className="space-y-1.5">
          <div className="h-3 bg-neutral-100 rounded w-full" />
          <div className="h-3 bg-neutral-100 rounded w-2/3" />
        </div>
        <div className="h-3 bg-neutral-100 rounded w-1/3" />
        <div className="pt-2 border-t border-neutral-50">
          <div className="h-5 bg-neutral-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
