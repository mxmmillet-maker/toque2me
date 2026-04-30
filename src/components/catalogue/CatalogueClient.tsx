'use client';

import { useState, useMemo } from 'react';
import { SupabaseProduct } from '@/lib/supabase-types';
import { SearchBar } from './SearchBar';
import { ProductCard } from './ProductCard';
import { isDeliverableBefore } from '@/lib/delivery';

const PAGE_SIZE = 24;

const CATEGORY_ORDER = [
  'T-shirts', 'Polos', 'Sweats', 'Vestes', 'Pantalons', 'Chemises',
  'Tabliers', 'Chef', 'Casquettes', 'Bonnets', 'Chapeaux',
  'Accessoires', 'Bagagerie', 'Parapluies', 'Goodies', 'Objets tech',
];

// Catégories textiles (seules celles-ci affichent le filtre grammage)
const TEXTILE_CATEGORIES = new Set(['T-shirts', 'Polos', 'Sweats', 'Vestes', 'Pantalons', 'Chemises', 'Tabliers', 'Chef']);

const UNIVERS_LABELS: Record<string, string> = {
  hospitality: 'Hospitality',
  workwear: 'Workwear',
  evenementiel: 'Événementiel',
  sportswear: 'Sportswear',
  epi: 'EPI',
  sante: 'Santé & Beauté',
  vignoble: 'Vignoble',
};

// Sous-postes Vignoble — affichés en chips quand l'univers Vignoble est actif.
// Ordre choisi : terrain d'abord, support derrière, phyto en dernier (cf. brief —
// poste régulé mais souvent sous-traité, à exister en SEO sans être mis en avant).
const VIGNOBLE_POSTES_LABELS: Record<string, string> = {
  'vignoble-vigne': 'Vigne',
  'vignoble-tractoriste': 'Tractoriste',
  'vignoble-chai': 'Chai',
  'vignoble-cave-bar': 'Cave & Bar',
  'vignoble-commercial': 'Commercial',
  'vignoble-logistique': 'Logistique',
  'vignoble-conditionnement': 'Conditionnement',
  'vignoble-phyto': 'Phyto',
};

const NOUVEAUTE_BOOST = 0.15;
const PREMIUM_BOOST = 0.12;

interface CatalogueClientProps {
  products: SupabaseProduct[];
  initialCategorie?: string;
  initialUnivers?: string;
  packMode?: string;
}

export function CatalogueClient({ products, initialCategorie, initialUnivers, packMode }: CatalogueClientProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    categorie: initialCategorie || '',
    grammageMin: 0,
    grammageMax: 999,
    lavage: '',
    certification: '',
    couleur: '',
    tri: '',
    univers: initialUnivers || '',
    genre: '',
    nouveautes: false,
    dateCible: '',
  });

  const productsWithPrice = useMemo(
    () => [...products].sort((a, b) => (b.prix_from ? 1 : 0) - (a.prix_from ? 1 : 0)),
    [products]
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(productsWithPrice.map((p) => p.categorie).filter(Boolean))) as string[];
    return cats
      .filter(c => c !== 'Autres') // Supprimer "Autres"
      .sort((a, b) => {
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
    const counts = new Map<string, number>();
    for (const p of productsWithPrice) {
      for (const c of (p.couleurs || [])) {
        if (c.nom && c.hexa && !map.has(c.nom)) map.set(c.nom, c.hexa);
        counts.set(c.nom, (counts.get(c.nom) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([nom, hexa]) => ({ nom, hexa, count: counts.get(nom) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 14);
  }, [productsWithPrice]);

  // Grammage contextuel : n'afficher que si la catégorie sélectionnée est textile
  const showGrammage = !filters.categorie || TEXTILE_CATEGORIES.has(filters.categorie);

  // Vignoble actif = on est sur le parent ou un sous-poste
  const isVignobleActive = filters.univers === 'vignoble' || filters.univers.startsWith('vignoble-');

  const vignoblePosteCounts = useMemo(() => {
    if (!isVignobleActive) return null;
    const counts: Record<string, number> = { vignoble: 0 };
    for (const key of Object.keys(VIGNOBLE_POSTES_LABELS)) counts[key] = 0;
    for (const p of productsWithPrice) {
      const u: any = (p as any).univers || {};
      if (u.vignoble) counts.vignoble++;
      for (const key of Object.keys(VIGNOBLE_POSTES_LABELS)) {
        if (u[key]) counts[key]++;
      }
    }
    return counts;
  }, [productsWithPrice, isVignobleActive]);

  const filtered = useMemo(() => {
    const activeUnivers = filters.univers;
    const result = productsWithPrice.filter((p) => {
      if (p.categorie === 'Autres') return false; // Exclure "Autres"
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${p.nom} ${p.description} ${p.categorie} ${p.ref_fournisseur} ${(p as any).marque || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.categorie && p.categorie !== filters.categorie) return false;
      if (showGrammage && filters.grammageMin > 0 && (!p.grammage || p.grammage < filters.grammageMin)) return false;
      if (showGrammage && filters.grammageMax < 999 && p.grammage && p.grammage > filters.grammageMax) return false;
      if (filters.certification && !(p.certifications || []).includes(filters.certification)) return false;
      if (filters.couleur && !(p.couleurs || []).some((c: any) => c.nom === filters.couleur)) return false;
      if (filters.genre && (p as any).genre !== filters.genre) return false;
      if (filters.nouveautes && !(p as any).est_nouveaute) return false;
      if (activeUnivers && !((p as any).univers)?.[activeUnivers]) return false;
      if (filters.dateCible) {
        const target = new Date(filters.dateCible);
        if (!isDeliverableBefore((p as any).fournisseur || 'toptex', 'sans', target)) return false;
      }
      if (filters.lavage) {
        const desc = (p.description || '').toLowerCase();
        const temp = parseInt(filters.lavage);
        const match = desc.match(/(\d+)\s*°/g);
        if (match) {
          const maxTemp = Math.max(...match.map(m => parseInt(m)));
          if (maxTemp < temp) return false;
        } else { return false; }
      }
      return true;
    });

    const getCompositeScore = (p: any): number => {
      let score = ((p.score_premium || 0) + (p.score_durabilite || 0)) / 200;
      if (p.est_nouveaute) score += NOUVEAUTE_BOOST;
      if (p.tags?.niveau_gamme === 'premium') score += PREMIUM_BOOST;
      if (activeUnivers && p.univers?.[activeUnivers]) score += p.univers[activeUnivers] * 0.3;
      if (!p.image_url) score -= 0.5;
      return score;
    };

    switch (filters.tri) {
      case 'prix-asc': result.sort((a, b) => (a.prix_from || 999) - (b.prix_from || 999)); break;
      case 'prix-desc': result.sort((a, b) => (b.prix_from || 0) - (a.prix_from || 0)); break;
      case 'grammage-desc': result.sort((a, b) => (b.grammage || 0) - (a.grammage || 0)); break;
      case 'qualite': result.sort((a, b) => ((b.score_premium||0)+(b.score_durabilite||0)) - ((a.score_premium||0)+(a.score_durabilite||0))); break;
      default: result.sort((a, b) => getCompositeScore(b) - getCompositeScore(a));
    }
    return result;
  }, [productsWithPrice, search, filters, showGrammage]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const activeFilterCount = [
    filters.categorie, filters.univers, filters.genre, filters.certification,
    filters.couleur, filters.lavage, filters.dateCible, filters.nouveautes,
    filters.grammageMin > 0, filters.grammageMax < 999,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters({
      categorie: '', grammageMin: 0, grammageMax: 999, lavage: '', certification: '',
      couleur: '', tri: '', univers: '', genre: '', nouveautes: false, dateCible: '',
    });
    setPage(1);
  };

  // ── Contenu filtres (partagé entre sidebar et drawer) ──
  const FiltersContent = () => (
    <div className="space-y-5">
      {/* Catégories */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Catégorie</h3>
        <div className="space-y-1">
          <button onClick={() => updateFilter('categorie', '')} className={`block w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${!filters.categorie ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            Toutes ({productsWithPrice.filter(p => p.categorie !== 'Autres').length})
          </button>
          {categories.map(cat => {
            const count = productsWithPrice.filter(p => p.categorie === cat).length;
            if (!count) return null;
            return (
              <button key={cat} onClick={() => updateFilter('categorie', cat)} className={`block w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${filters.categorie === cat ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                {cat} <span className="text-neutral-400">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Univers */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Univers</h3>
        <div className="space-y-1">
          <button onClick={() => updateFilter('univers', '')} className={`block w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${!filters.univers ? 'font-medium text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50'}`}>
            Tous
          </button>
          {Object.entries(UNIVERS_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => updateFilter('univers', key)} className={`block w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${filters.univers === key ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Nouveautés */}
      <button
        onClick={() => updateFilter('nouveautes', !filters.nouveautes)}
        className={`w-full flex items-center gap-2 px-2 py-2 text-sm rounded transition-colors ${filters.nouveautes ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-neutral-600 hover:bg-neutral-50 border border-transparent'}`}
      >
        <span className={`w-4 h-4 rounded border flex items-center justify-center ${filters.nouveautes ? 'bg-amber-600 border-amber-600' : 'border-neutral-300'}`}>
          {filters.nouveautes && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
        </span>
        Nouveautés uniquement
      </button>

      {/* Genre */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Genre</h3>
        <div className="flex flex-wrap gap-1.5">
          {['', 'homme', 'femme', 'unisexe', 'enfant'].map(g => (
            <button key={g} onClick={() => updateFilter('genre', g)} className={`px-3 py-1 text-xs rounded-md transition-colors ${filters.genre === g ? 'bg-neutral-900 text-white' : 'border border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
              {g || 'Tous'}
            </button>
          ))}
        </div>
      </div>

      {/* Couleurs */}
      {couleurs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Couleur</h3>
          <div className="flex flex-wrap gap-1.5">
            {couleurs.map(c => (
              <button key={c.nom} onClick={() => updateFilter('couleur', filters.couleur === c.nom ? '' : c.nom)} title={c.nom}
                className={`w-7 h-7 rounded-full border-2 transition-all ${filters.couleur === c.nom ? 'border-neutral-900 scale-110 ring-2 ring-neutral-900 ring-offset-1' : 'border-neutral-200 hover:border-neutral-400'}`}
                style={{ backgroundColor: c.hexa || '#ccc' }}
              />
            ))}
          </div>
          {filters.couleur && <p className="text-xs text-neutral-500 mt-1">{filters.couleur}</p>}
        </div>
      )}

      {/* Grammage (contextuel textile) */}
      {showGrammage && (
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Grammage (g/m²)</h3>
          <div className="flex items-center gap-2">
            <input type="number" value={filters.grammageMin || ''} onChange={(e) => updateFilter('grammageMin', parseInt(e.target.value) || 0)} placeholder="min" className="w-16 px-2 py-1.5 text-sm border border-neutral-200 rounded text-center focus:outline-none focus:ring-2 focus:ring-neutral-900" />
            <span className="text-neutral-300">—</span>
            <input type="number" value={filters.grammageMax < 999 ? filters.grammageMax : ''} onChange={(e) => updateFilter('grammageMax', parseInt(e.target.value) || 999)} placeholder="max" className="w-16 px-2 py-1.5 text-sm border border-neutral-200 rounded text-center focus:outline-none focus:ring-2 focus:ring-neutral-900" />
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Certification</h3>
          <select value={filters.certification} onChange={(e) => updateFilter('certification', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-neutral-900">
            <option value="">Toutes</option>
            {certifications.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Lavage */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Lavage min.</h3>
        <select value={filters.lavage} onChange={(e) => updateFilter('lavage', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-neutral-900">
          <option value="">Tous</option>
          <option value="40">40°C</option>
          <option value="60">60°C</option>
          <option value="95">95°C</option>
        </select>
      </div>

      {/* Date cible */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Livré avant</h3>
        <input type="date" value={filters.dateCible} onChange={(e) => updateFilter('dateCible', e.target.value)} min={new Date().toISOString().slice(0, 10)}
          className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <button onClick={resetFilters} className="w-full text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 py-2">
          Réinitialiser les filtres ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Barre de recherche + tri + bouton filtres mobile */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={handleSearch} />
        </div>
        <select value={filters.tri} onChange={(e) => updateFilter('tri', e.target.value)}
          className="hidden sm:block px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white">
          <option value="">Pertinence</option>
          <option value="prix-asc">Prix ↑</option>
          <option value="prix-desc">Prix ↓</option>
          <option value="grammage-desc">Grammage ↓</option>
          <option value="qualite">Qualité</option>
        </select>
        {/* Bouton filtres mobile */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
          Filtres
          {activeFilterCount > 0 && <span className="w-5 h-5 bg-neutral-900 text-white text-[10px] rounded-full flex items-center justify-center">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Layout 2 colonnes */}
      <div className="flex gap-6">
        {/* Sidebar filtres — desktop only */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8 pr-2">
            <FiltersContent />
          </div>
        </aside>

        {/* Grille produits */}
        <div className="flex-1 min-w-0">
          {/* Chips sous-postes Vignoble */}
          {isVignobleActive && vignoblePosteCounts && (
            <div className="mb-4 -mx-1 px-1 overflow-x-auto">
              <div className="flex gap-2 flex-nowrap pb-1">
                <button
                  onClick={() => updateFilter('univers', 'vignoble')}
                  className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${filters.univers === 'vignoble' ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
                >
                  Tous postes <span className="opacity-60">({vignoblePosteCounts.vignoble})</span>
                </button>
                {Object.entries(VIGNOBLE_POSTES_LABELS).map(([key, label]) => {
                  const count = vignoblePosteCounts[key] || 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => updateFilter('univers', key)}
                      className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${filters.univers === key ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
                    >
                      {label} <span className="opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compteur */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-400">
              {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
              {totalPages > 1 && ` — page ${currentPage} / ${totalPages}`}
            </p>
            {packMode && (
              <span className="text-xs bg-neutral-900 text-white px-3 py-1 rounded-full">Pack</span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-neutral-400 text-sm mb-3">Aucun produit ne correspond à votre recherche.</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-sm text-neutral-900 font-medium underline underline-offset-2">Réinitialiser les filtres</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {paginated.map((product) => (
                  <ProductCard key={product.id} product={product} packMode={packMode} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed">
                    Précédent
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button key={pageNum} onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 text-sm rounded-lg transition-colors ${pageNum === currentPage ? 'bg-neutral-900 text-white' : 'border border-neutral-200 hover:bg-neutral-50'}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed">
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Drawer filtres mobile — bottom sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900">
                Filtres
                {activeFilterCount > 0 && <span className="ml-2 text-xs text-neutral-400">({activeFilterCount} actifs)</span>}
              </h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FiltersContent />
            </div>
            <div className="px-5 py-3 border-t border-neutral-100">
              <button onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800">
                Voir {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
