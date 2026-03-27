'use client';

import { useState, useMemo } from 'react';
import { SupabaseProduct } from '@/lib/supabase-types';
import { SearchBar } from './SearchBar';
import { FilterBar } from './FilterBar';
import { ProductCard } from './ProductCard';

const PAGE_SIZE = 24;

interface CatalogueClientProps {
  products: SupabaseProduct[];
  initialCategorie?: string;
  packMode?: string; // line ID si on vient du pack
}

export function CatalogueClient({ products, initialCategorie, packMode }: CatalogueClientProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    categorie: initialCategorie || '',
    secteur: '',
    origine: '',
  });

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.categorie).filter(Boolean))) as string[],
    [products]
  );
  const secteurs = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.secteurs || []))),
    [products]
  );
  const origines = useMemo(
    () => Array.from(new Set(products.map((p) => p.origine).filter(Boolean))) as string[],
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${p.nom} ${p.description} ${p.categorie} ${p.ref_fournisseur}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.categorie && p.categorie !== filters.categorie) return false;
      if (filters.secteur && !(p.secteurs || []).includes(filters.secteur)) return false;
      if (filters.origine && p.origine !== filters.origine) return false;
      return true;
    });
  }, [products, search, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page on filter/search change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilters = (f: typeof filters) => { setFilters(f); setPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={handleSearch} />
        </div>
      </div>

      <FilterBar
        filters={filters}
        onChange={handleFilters}
        categories={categories}
        secteurs={secteurs}
        origines={origines}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
          {totalPages > 1 && ` — page ${currentPage} / ${totalPages}`}
        </p>
        {packMode && (
          <span className="text-xs bg-neutral-900 text-white px-3 py-1 rounded-full">
            Sélectionnez un produit pour le pack
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-slate-400 text-sm">Aucun produit ne correspond à votre recherche.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((product) => (
              <ProductCard key={product.id} product={product} packMode={packMode} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? 'bg-neutral-900 text-white'
                        : 'border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
