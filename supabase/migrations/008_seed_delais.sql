-- ============================================================
-- Migration 008 : Seed délais production + marquage
-- Projet  : Toque2Me
-- Date    : 2026-04-20
-- ============================================================

-- ── Délais production par fournisseur ──────────────────────────────────────
-- TopTex : 2j ouvrés / Cybernecard : 5j ouvrés / Makito : 7j / BIC : 5j

UPDATE products SET delai_prod_jours = 2 WHERE fournisseur = 'toptex' AND delai_prod_jours IS NULL;
UPDATE products SET delai_prod_jours = 5 WHERE fournisseur = 'cybernecard' AND delai_prod_jours IS NULL;
UPDATE products SET delai_prod_jours = 7 WHERE fournisseur = 'makito' AND delai_prod_jours IS NULL;
UPDATE products SET delai_prod_jours = 5 WHERE fournisseur = 'bic-graphic' AND delai_prod_jours IS NULL;

-- ── Grille tarifaire marquage avec délais ──────────────────────────────────
-- Sous-traitant Siri Ouest (circuit B — TopTex)

INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, nb_couleurs_max, delai_jours)
VALUES
  -- Sérigraphie Siri (7j ouvrés)
  ('siri_ouest', 'serigraphie', 'coeur', 1, 49, 3.50, 35, 10, 4, 7),
  ('siri_ouest', 'serigraphie', 'coeur', 50, 99, 2.80, 35, 10, 4, 7),
  ('siri_ouest', 'serigraphie', 'coeur', 100, 249, 2.20, 35, 10, 4, 7),
  ('siri_ouest', 'serigraphie', 'coeur', 250, 499, 1.70, 35, 10, 4, 7),
  ('siri_ouest', 'serigraphie', 'coeur', 500, NULL, 1.30, 35, 10, 4, 7),
  ('siri_ouest', 'serigraphie', 'dos', 1, 49, 5.00, 45, 30, 4, 7),
  ('siri_ouest', 'serigraphie', 'dos', 50, 99, 4.00, 45, 30, 4, 7),
  ('siri_ouest', 'serigraphie', 'dos', 100, 249, 3.20, 45, 30, 4, 7),
  ('siri_ouest', 'serigraphie', 'dos', 250, 499, 2.50, 45, 30, 4, 7),
  ('siri_ouest', 'serigraphie', 'dos', 500, NULL, 2.00, 45, 30, 4, 7),

  -- Broderie Siri (15j ouvrés)
  ('siri_ouest', 'broderie', 'coeur', 1, 49, 5.00, 45, 8, NULL, 15),
  ('siri_ouest', 'broderie', 'coeur', 50, 99, 4.00, 45, 8, NULL, 15),
  ('siri_ouest', 'broderie', 'coeur', 100, 249, 3.50, 45, 8, NULL, 15),
  ('siri_ouest', 'broderie', 'coeur', 250, NULL, 3.00, 45, 8, NULL, 15),
  ('siri_ouest', 'broderie', 'dos', 1, 49, 8.00, 65, 25, NULL, 15),
  ('siri_ouest', 'broderie', 'dos', 50, 99, 6.50, 65, 25, NULL, 15),
  ('siri_ouest', 'broderie', 'dos', 100, 249, 5.50, 65, 25, NULL, 15),
  ('siri_ouest', 'broderie', 'dos', 250, NULL, 4.50, 65, 25, NULL, 15),

  -- DTF Siri (5j ouvrés)
  ('siri_ouest', 'dtf', 'coeur', 1, 49, 4.00, 29, 10, NULL, 5),
  ('siri_ouest', 'dtf', 'coeur', 50, 99, 3.20, 29, 10, NULL, 5),
  ('siri_ouest', 'dtf', 'coeur', 100, 249, 2.50, 29, 10, NULL, 5),
  ('siri_ouest', 'dtf', 'coeur', 250, NULL, 2.00, 29, 10, NULL, 5),
  ('siri_ouest', 'dtf', 'dos', 1, 49, 6.00, 39, 30, NULL, 5),
  ('siri_ouest', 'dtf', 'dos', 50, 99, 4.80, 39, 30, NULL, 5),
  ('siri_ouest', 'dtf', 'dos', 100, 249, 3.80, 39, 30, NULL, 5),
  ('siri_ouest', 'dtf', 'dos', 250, NULL, 3.00, 39, 30, NULL, 5)
ON CONFLICT DO NOTHING;

-- Cybernecard intégré (15j ouvrés toutes techniques)

INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, delai_jours)
VALUES
  ('cybernecard', 'serigraphie', 'coeur', 1, 49, 3.00, 30, 15),
  ('cybernecard', 'serigraphie', 'coeur', 50, 99, 2.50, 30, 15),
  ('cybernecard', 'serigraphie', 'coeur', 100, 249, 2.00, 30, 15),
  ('cybernecard', 'serigraphie', 'coeur', 250, NULL, 1.50, 30, 15),
  ('cybernecard', 'broderie', 'coeur', 1, 49, 4.50, 40, 15),
  ('cybernecard', 'broderie', 'coeur', 50, 99, 3.80, 40, 15),
  ('cybernecard', 'broderie', 'coeur', 100, 249, 3.20, 40, 15),
  ('cybernecard', 'broderie', 'coeur', 250, NULL, 2.80, 40, 15),
  ('cybernecard', 'dtf', 'coeur', 1, 49, 3.50, 25, 15),
  ('cybernecard', 'dtf', 'coeur', 50, 99, 2.80, 25, 15),
  ('cybernecard', 'dtf', 'coeur', 100, 249, 2.20, 25, 15),
  ('cybernecard', 'dtf', 'coeur', 250, NULL, 1.80, 25, 15)
ON CONFLICT DO NOTHING;
