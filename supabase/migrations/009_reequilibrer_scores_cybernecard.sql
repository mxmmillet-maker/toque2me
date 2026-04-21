-- ============================================================
-- Migration 009 : Rééquilibrer les scores Cybernecard
-- Les produits Cybernecard sélectionnés manuellement méritent
-- des scores comparables aux produits TopTex.
-- ============================================================

-- Relever le score de base de durabilité (50 → 70)
UPDATE products
SET score_durabilite = LEAST(score_durabilite + 20, 100)
WHERE fournisseur = 'cybernecard' AND actif = true;

-- Relever le score de base premium (40 → 65)
UPDATE products
SET score_premium = LEAST(score_premium + 25, 100)
WHERE fournisseur = 'cybernecard' AND actif = true;
