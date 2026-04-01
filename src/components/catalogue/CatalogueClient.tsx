'use client';

import { useState, useMemo } from 'react';
import { SupabaseProduct } from '@/lib/supabase-types';
import { SearchBar } from './SearchBar';
import { FilterBar } from './FilterBar';
import { ProductCard } from './ProductCard';

const PAGE_SIZE = 24;

const CATEGORY_ORDER = [
  'T-shirts', 'Polos', 'Sweats', 'Vestes', 'Pantalons', 'Chemises',
  'Tabliers', 'Chef', 'Accessoires', 'Bagagerie', 'Parapluies',
  'Goodies', 'Objets tech',
];

interface CatalogueClientProps {
  products: SupabaseProduct[];
  initialCategorie?: string;
  packMode?: string;
}

export function CatalogueClient({ products, initialCategorie, packMode }: CatalogueClientProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    categorie: initialCategorie || '',
    grammageMin: 0,
    grammageMax: 999,
    lavage: '',
    certification: '',
    tri: '',
  });

  // Tous les produits (ceux avec prix en premier)
  const productsWithPrice = useMemo(
    () => [...products].sort((a, b) => (b.prix_from ? 1 : 0) - (a.prix_from ? 1 : 0)),
    [products]
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(productsWithPrice.map((p) => p.categorie).filter(Boolean))) as string[];
    return cats.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [productsWithPrice]);

  const certifications = useMemo(() => {
    const all = productsWithPrice.flatMap((p) => p.certifications || []);
    return Array.from(new Set(all)).filter(Boolean).sort();
  }, [productsWithPrice]);

  const filtered = useMemo(() => {
    const result = productsWithPrice.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${p.nom} ${p.description} ${p.categorie} ${p.ref_fournisseur}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.categorie && p.categorie !== filters.categorie) return false;
      if (filters.grammageMin > 0 && (!p.grammage || p.grammage < filters.grammageMin)) return false;
      if (filters.grammageMax < 999 && p.grammage && p.grammage > filters.grammageMax) return false;
      if (filters.certification && !(p.certifications || []).includes(filters.certification)) return false;
      // Lavage : on cherche dans la description
      if (filters.lavage) {
        const desc = (p.description || '').toLowerCase();
        const temp = parseInt(filters.lavage);
        // Cherche "60°" ou "60 °" ou "60°C" ou "lavable à 60"
        const match = desc.match(/(\d+)\s*°/g);
        if (match) {
          const maxTemp = Math.max(...match.map(m => parseInt(m)));
          if (maxTemp < temp) return false;
        } else {
          return false;
        }
      }
      return true;
    });

    // Tri
    switch (filters.tri) {
      case 'prix-asc':
        result.sort((a, b) => (a.prix_from || 999) - (b.prix_from || 999));
        break;
      case 'prix-desc':
        result.sort((a, b) => (b.prix_from || 0) - (a.prix_from || 0));
        break;
      case 'grammage-desc':
        result.sort((a, b) => (b.grammage || 0) - (a.grammage || 0));
        break;
      case 'qualite':
        result.sort((a, b) => {
          const aS = (a.score_premium || 0) + (a.score_durabilite || 0);
          const bS = (b.score_premium || 0) + (b.score_durabilite || 0);
          return bS - aS;
        });
        break;
      default:
        // Défaut : image d'abord, puis qualité
        result.sort((a, b) => {
          const aImg = a.image_url ? 1 : 0;
          const bImg = b.image_url ? 1 : 0;
          if (aImg !== bImg) return bImg - aImg;
          const aS = (a.score_premium || 0) + (a.score_durabilite || 0);
          const bS = (b.score_premium || 0) + (b.score_durabilite || 0);
          return bS - aS;
        });
    }

    return result;
  }, [productsWithPrice, search, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilters = (f: typeof filters) => { setFilters(f); setPage(1); };

  return (
    <div className="space-y-5">
      {/* Catégories pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <button
          onClick={() => handleFilters({ ...filters, categorie: '' })}
          className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            !filters.categorie
              ? 'bg-neutral-900 text-white'
              : 'text-slate-600 border border-slate-200 hover:border-slate-400 hover:text-neutral-900'
          }`}
        >
          Tout ({productsWithPrice.length})
        </button>
        {categories.map((cat) => {
          const count = productsWithPrice.filter((p) => p.categorie === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => handleFilters({ ...filters, categorie: cat })}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                filters.categorie === cat
                  ? 'bg-neutral-900 text-white'
                  : 'text-slate-600 border border-slate-200 hover:border-slate-400 hover:text-neutral-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Recherche + Filtres */}
      <div className="space-y-3">
        <SearchBar value={search} onChange={handleSearch} />
        <FilterBar
          filters={filters}
          onChange={handleFilters}
          certifications={certifications}
        />
      </div>

      {/* Compteur */}
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

      {/* Grille produits */}
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
                if (totalPages <= 7) pageNum = i + 1;
                else if (currentPage <= 4) pageNum = i + 1;
                else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                else pageNum = currentPage - 3 + i;
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
