'use client';

import { useState, useMemo } from 'react';
import { SupabaseProduct } from '@/lib/supabase-types';
import { SearchBar } from './SearchBar';
import { FilterBar, type Filters } from './FilterBar';
import { ProductCard } from './ProductCard';
import { isDeliverableBefore } from '@/lib/delivery';

const PAGE_SIZE = 24;

const CATEGORY_ORDER = [
  'T-shirts', 'Polos', 'Sweats', 'Vestes', 'Pantalons', 'Chemises',
  'Tabliers', 'Chef', 'Accessoires', 'Bagagerie', 'Parapluies',
  'Goodies', 'Objets tech',
];

const UNIVERS_LABELS: Record<string, string> = {
  hospitality: 'Hospitality',
  workwear: 'Workwear',
  evenementiel: 'Événementiel',
  sportswear: 'Sportswear',
  epi: 'EPI',
  sante: 'Santé & Beauté',
};

// Bonus de ranking pour les nouveautés (0-1 scale, ajouté au score combiné)
const NOUVEAUTE_BOOST = 0.15;

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
    couleur: '',
    tri: '',
    univers: '',
    genre: '',
    nouveautes: false,
    dateCible: '',
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

  const couleurs = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of productsWithPrice) {
      const cols = p.couleurs || [];
      for (const c of cols) {
        if (c.nom && c.hexa && !map.has(c.nom)) map.set(c.nom, c.hexa);
      }
    }
    // Top couleurs les plus courantes
    const counts = new Map<string, number>();
    for (const p of productsWithPrice) {
      for (const c of (p.couleurs || [])) {
        counts.set(c.nom, (counts.get(c.nom) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([nom, hexa]) => ({ nom, hexa, count: counts.get(nom) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [productsWithPrice]);

  const filtered = useMemo(() => {
    const activeUnivers = filters.univers;

    const result = productsWithPrice.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${p.nom} ${p.description} ${p.categorie} ${p.ref_fournisseur} ${p.marque || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.categorie && p.categorie !== filters.categorie) return false;
      if (filters.grammageMin > 0 && (!p.grammage || p.grammage < filters.grammageMin)) return false;
      if (filters.grammageMax < 999 && p.grammage && p.grammage > filters.grammageMax) return false;
      if (filters.certification && !(p.certifications || []).includes(filters.certification)) return false;
      if (filters.couleur && !(p.couleurs || []).some((c: any) => c.nom === filters.couleur)) return false;
      if (filters.genre && p.genre !== filters.genre) return false;
      if (filters.nouveautes && !p.est_nouveaute) return false;
      // Filtre univers : garder uniquement les produits qui ont un score > 0 dans cet univers
      if (activeUnivers && !(p.univers as any)?.[activeUnivers]) return false;
      // Filtre date cible : ne garder que les produits livrables avant la date
      if (filters.dateCible) {
        const target = new Date(filters.dateCible);
        if (!isDeliverableBefore(p.fournisseur || 'toptex', 'sans', target)) return false;
      }
      // Lavage : on cherche dans la description
      if (filters.lavage) {
        const desc = (p.description || '').toLowerCase();
        const temp = parseInt(filters.lavage);
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

    // ── Scoring composite pour le tri ──
    const getCompositeScore = (p: any): number => {
      let score = 0;
      // Base : qualité (0-200 → normalisé 0-1)
      score += ((p.score_premium || 0) + (p.score_durabilite || 0)) / 200;
      // Boost nouveauté
      if (p.est_nouveaute) score += NOUVEAUTE_BOOST;
      // Boost affinité univers (si un univers est sélectionné, le score d'affinité booste)
      if (activeUnivers && (p.univers as any)?.[activeUnivers]) {
        score += (p.univers as any)[activeUnivers] * 0.3;
      }
      // Pénalité si pas d'image
      if (!p.image_url) score -= 0.5;
      return score;
    };

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
        // Défaut : score composite (qualité + nouveauté + affinité univers)
        result.sort((a, b) => getCompositeScore(b) - getCompositeScore(a));
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

      {/* Univers pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <button
          onClick={() => handleFilters({ ...filters, univers: '' })}
          className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            !filters.univers
              ? 'bg-slate-700 text-white'
              : 'text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-neutral-900'
          }`}
        >
          Tous les univers
        </button>
        {Object.entries(UNIVERS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleFilters({ ...filters, univers: key })}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filters.univers === key
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-neutral-900'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => handleFilters({ ...filters, nouveautes: !filters.nouveautes })}
          className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            filters.nouveautes
              ? 'bg-amber-600 text-white'
              : 'text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-neutral-900'
          }`}
        >
          Nouveautés
        </button>
      </div>

      {/* Recherche + Filtres */}
      <div className="space-y-3">
        <SearchBar value={search} onChange={handleSearch} />
        <FilterBar
          filters={filters}
          onChange={handleFilters}
          certifications={certifications}
          couleurs={couleurs}
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
