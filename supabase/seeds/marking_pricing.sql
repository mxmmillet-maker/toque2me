-- ============================================================
-- Seed : Grille tarifaire marquage
-- Sources : tarifs Siri Ouest (règles Max) + estimations marché
-- À affiner avec les vrais tarifs Cybernecard API
-- ============================================================

-- Nettoyer avant re-seed
DELETE FROM marking_pricing;

-- ────────────────────────────────────────────────────────────
-- BRODERIE — Siri Ouest
-- ────────────────────────────────────────────────────────────

-- Coeur (7cm, ~5000 points)
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, delai_jours) VALUES
  ('siri_ouest', 'broderie', 'coeur', 1, 9, 6.90, 29, 7, 7, 5),
  ('siri_ouest', 'broderie', 'coeur', 10, 49, 5.90, 29, 7, 7, 5),
  ('siri_ouest', 'broderie', 'coeur', 50, 99, 4.90, 29, 7, 7, 5),
  ('siri_ouest', 'broderie', 'coeur', 100, 249, 4.50, 29, 7, 7, 5),
  ('siri_ouest', 'broderie', 'coeur', 250, 499, 4.20, 29, 7, 7, 5),
  ('siri_ouest', 'broderie', 'coeur', 500, NULL, 3.90, 29, 7, 7, 5);

-- Dos (25cm, ~15000 points)
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, delai_jours) VALUES
  ('siri_ouest', 'broderie', 'dos', 1, 9, 15.90, 29, 25, 30, 5),
  ('siri_ouest', 'broderie', 'dos', 10, 49, 14.50, 29, 25, 30, 5),
  ('siri_ouest', 'broderie', 'dos', 50, 99, 13.00, 29, 25, 30, 5),
  ('siri_ouest', 'broderie', 'dos', 100, 249, 12.00, 29, 25, 30, 5),
  ('siri_ouest', 'broderie', 'dos', 250, 499, 11.00, 29, 25, 30, 5),
  ('siri_ouest', 'broderie', 'dos', 500, NULL, 10.00, 29, 25, 30, 5);

-- Manche (5cm)
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, delai_jours) VALUES
  ('siri_ouest', 'broderie', 'manche', 1, 9, 5.90, 29, 5, 5, 5),
  ('siri_ouest', 'broderie', 'manche', 10, 49, 4.90, 29, 5, 5, 5),
  ('siri_ouest', 'broderie', 'manche', 50, 99, 4.20, 29, 5, 5, 5),
  ('siri_ouest', 'broderie', 'manche', 100, NULL, 3.90, 29, 5, 5, 5);

-- ────────────────────────────────────────────────────────────
-- SÉRIGRAPHIE — Siri Ouest
-- ────────────────────────────────────────────────────────────

-- Coeur (1 couleur)
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, nb_couleurs_max, delai_jours) VALUES
  ('siri_ouest', 'serigraphie', 'coeur', 25, 49, 3.90, 35, 10, 10, 4, 10),
  ('siri_ouest', 'serigraphie', 'coeur', 50, 99, 3.20, 35, 10, 10, 4, 10),
  ('siri_ouest', 'serigraphie', 'coeur', 100, 249, 2.50, 35, 10, 10, 4, 10),
  ('siri_ouest', 'serigraphie', 'coeur', 250, 499, 2.20, 35, 10, 10, 4, 10),
  ('siri_ouest', 'serigraphie', 'coeur', 500, NULL, 1.90, 35, 10, 10, 4, 10);

-- Dos (1 couleur)
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, nb_couleurs_max, delai_jours) VALUES
  ('siri_ouest', 'serigraphie', 'dos', 25, 49, 5.50, 35, 30, 40, 4, 10),
  ('siri_ouest', 'serigraphie', 'dos', 50, 99, 4.50, 35, 30, 40, 4, 10),
  ('siri_ouest', 'serigraphie', 'dos', 100, 249, 3.50, 35, 30, 40, 4, 10),
  ('siri_ouest', 'serigraphie', 'dos', 250, 499, 3.00, 35, 30, 40, 4, 10),
  ('siri_ouest', 'serigraphie', 'dos', 500, NULL, 2.50, 35, 30, 40, 4, 10);

-- ────────────────────────────────────────────────────────────
-- DTF (Transfert) — Siri Ouest
-- ────────────────────────────────────────────────────────────

-- Coeur
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, delai_jours) VALUES
  ('siri_ouest', 'dtf', 'coeur', 1, 9, 5.50, 15, 10, 10, 10),
  ('siri_ouest', 'dtf', 'coeur', 10, 49, 4.50, 15, 10, 10, 10),
  ('siri_ouest', 'dtf', 'coeur', 50, 99, 3.90, 15, 10, 10, 10),
  ('siri_ouest', 'dtf', 'coeur', 100, NULL, 3.50, 15, 10, 10, 10);

-- Dos
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, delai_jours) VALUES
  ('siri_ouest', 'dtf', 'dos', 1, 9, 8.50, 15, 30, 40, 10),
  ('siri_ouest', 'dtf', 'dos', 10, 49, 7.00, 15, 30, 40, 10),
  ('siri_ouest', 'dtf', 'dos', 50, 99, 5.90, 15, 30, 40, 10),
  ('siri_ouest', 'dtf', 'dos', 100, NULL, 5.00, 15, 30, 40, 10);

-- ────────────────────────────────────────────────────────────
-- CYBERNECARD — Estimations (à remplacer par données API)
-- Cybernecard fait produit + marquage ensemble
-- ────────────────────────────────────────────────────────────

-- Broderie coeur
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, delai_jours) VALUES
  ('cybernecard', 'broderie', 'coeur', 1, 24, 7.50, 25, 7, 7, 7),
  ('cybernecard', 'broderie', 'coeur', 25, 49, 5.90, 25, 7, 7, 7),
  ('cybernecard', 'broderie', 'coeur', 50, 99, 5.20, 25, 7, 7, 7),
  ('cybernecard', 'broderie', 'coeur', 100, 249, 4.80, 25, 7, 7, 7),
  ('cybernecard', 'broderie', 'coeur', 250, NULL, 4.50, 25, 7, 7, 7);

-- Broderie dos
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, delai_jours) VALUES
  ('cybernecard', 'broderie', 'dos', 1, 24, 16.00, 25, 25, 30, 7),
  ('cybernecard', 'broderie', 'dos', 25, 49, 14.00, 25, 25, 30, 7),
  ('cybernecard', 'broderie', 'dos', 50, 99, 13.00, 25, 25, 30, 7),
  ('cybernecard', 'broderie', 'dos', 100, NULL, 12.00, 25, 25, 30, 7);

-- Sérigraphie coeur
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, nb_couleurs_max, delai_jours) VALUES
  ('cybernecard', 'serigraphie', 'coeur', 25, 49, 3.50, 30, 10, 10, 4, 10),
  ('cybernecard', 'serigraphie', 'coeur', 50, 99, 2.80, 30, 10, 10, 4, 10),
  ('cybernecard', 'serigraphie', 'coeur', 100, 249, 2.30, 30, 10, 10, 4, 10),
  ('cybernecard', 'serigraphie', 'coeur', 250, NULL, 1.90, 30, 10, 10, 4, 10);

-- Sérigraphie dos
INSERT INTO marking_pricing (marqueur, technique, position, qte_min, qte_max, prix_unitaire, frais_technique, largeur_max_cm, hauteur_max_cm, nb_couleurs_max, delai_jours) VALUES
  ('cybernecard', 'serigraphie', 'dos', 25, 49, 5.00, 30, 30, 40, 4, 10),
  ('cybernecard', 'serigraphie', 'dos', 50, 99, 4.00, 30, 30, 40, 4, 10),
  ('cybernecard', 'serigraphie', 'dos', 100, 249, 3.20, 30, 30, 40, 4, 10),
  ('cybernecard', 'serigraphie', 'dos', 250, NULL, 2.80, 30, 30, 40, 4, 10);
