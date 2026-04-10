-- ============================================================
-- Migration 005 : Univers, tags produit, nouveautés
-- Projet  : Toque2Me
-- Date    : 2026-04-09
-- ============================================================

-- Affinités par univers (scoring multi-catégorie)
-- Structure: {"hospitality": 0.8, "workwear": 0.6, "evenementiel": 1.0, ...}
ALTER TABLE products ADD COLUMN IF NOT EXISTS univers jsonb DEFAULT '{}';

-- Flag nouveauté (boost ranking)
ALTER TABLE products ADD COLUMN IF NOT EXISTS est_nouveaute boolean DEFAULT false;

-- Tags enrichis du product-tagger (famille, type, matière, gamme, usages, etc.)
-- Structure: output complet de tagProduct()
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '{}';

-- Genre produit (homme, femme, unisexe, enfant) — extrait de l'API fournisseur
ALTER TABLE products ADD COLUMN IF NOT EXISTS genre text;

-- Composition textile (ex: "100% coton", "65% polyester 35% coton")
ALTER TABLE products ADD COLUMN IF NOT EXISTS composition text;

-- Marque (stockée séparément pour filtrage rapide)
ALTER TABLE products ADD COLUMN IF NOT EXISTS marque text;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_products_genre ON products(genre);
CREATE INDEX IF NOT EXISTS idx_products_marque ON products(marque);
CREATE INDEX IF NOT EXISTS idx_products_est_nouveaute ON products(est_nouveaute) WHERE est_nouveaute = true;

-- Index GIN pour recherche dans univers jsonb
CREATE INDEX IF NOT EXISTS idx_products_univers ON products USING gin(univers);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);
