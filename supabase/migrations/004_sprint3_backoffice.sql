-- ============================================================
-- Migration 004 : Sprint 3 — Back-office client, commandes, marquage
-- Projet  : Toque2Me
-- Date    : 2026-04-02
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLE : products — enrichissement variantes & marquage
-- ────────────────────────────────────────────────────────────

-- Variantes taille/couleur (sync depuis fournisseurs)
-- Structure: [{sku, couleur, taille, stock, ean}]
ALTER TABLE products ADD COLUMN IF NOT EXISTS variantes jsonb DEFAULT '[]';

-- Techniques de marquage compatibles avec ce produit
ALTER TABLE products ADD COLUMN IF NOT EXISTS marquage_dispo text[] DEFAULT '{}';

-- Délai de production fournisseur (jours ouvrés, hors marquage)
ALTER TABLE products ADD COLUMN IF NOT EXISTS delai_prod_jours integer;

-- ────────────────────────────────────────────────────────────
-- TABLE : clients — enrichissement profil agence
-- ────────────────────────────────────────────────────────────

ALTER TABLE clients ADD COLUMN IF NOT EXISTS telephone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS siret text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS adresse jsonb;
-- Structure adresse: {rue, cp, ville, pays}

-- ────────────────────────────────────────────────────────────
-- TABLE : client_projects
-- Les "clients" de l'agence (client final / projet)
-- Un client Toque2Me (agence) a plusieurs clients finaux
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nom         text NOT NULL,              -- nom du client final ou du projet
  secteur     text,                       -- secteur du client final
  site_web    text,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_projects_client ON client_projects(client_id);

-- RLS
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_projects ON client_projects
  FOR ALL USING (client_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- TABLE : project_logos
-- Logos des clients finaux (un projet peut avoir plusieurs logos)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_logos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  nom           text NOT NULL,            -- "Logo principal", "Logo monochrome", etc.
  url           text NOT NULL,            -- URL Supabase Storage
  format        text,                     -- 'svg', 'ai', 'pdf', 'png', 'eps'
  largeur_px    integer,
  hauteur_px    integer,
  nb_couleurs   integer,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_logos_project ON project_logos(project_id);

-- RLS via jointure sur client_projects
ALTER TABLE project_logos ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_logos ON project_logos
  FOR ALL USING (
    project_id IN (SELECT id FROM client_projects WHERE client_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────
-- TABLE : logo_configs
-- Combinaison logo + technique + position + taille déjà payée
-- Si même config existe et payée → frais technique = 0€ (réassort)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS logo_configs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_id               uuid NOT NULL REFERENCES project_logos(id) ON DELETE CASCADE,
  technique             text NOT NULL,    -- 'broderie', 'serigraphie', 'dtf'
  position              text NOT NULL,    -- 'coeur', 'dos', 'manche_gauche', 'manche_droite', 'cuisse'
  largeur_cm            numeric NOT NULL, -- largeur du marquage
  frais_technique_payes boolean DEFAULT false,
  created_at            timestamptz DEFAULT now(),

  -- Unicité : un seul frais technique par combinaison logo+technique+position+taille
  UNIQUE (logo_id, technique, position, largeur_cm)
);

CREATE INDEX IF NOT EXISTS idx_logo_configs_logo ON logo_configs(logo_id);

-- RLS via jointure
ALTER TABLE logo_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_configs ON logo_configs
  FOR ALL USING (
    logo_id IN (
      SELECT pl.id FROM project_logos pl
      JOIN client_projects cp ON pl.project_id = cp.id
      WHERE cp.client_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- TABLE : marking_pricing
-- Grille tarifaire marquage par marqueur × technique × position
-- Pricing dégressif par palier de quantité
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marking_pricing (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marqueur        text NOT NULL,          -- 'cybernecard', 'siri_ouest'
  technique       text NOT NULL,          -- 'broderie', 'serigraphie', 'dtf', 'gravure'
  position        text NOT NULL,          -- 'coeur', 'dos', 'manche', 'cuisse', 'casquette_face'

  -- Pricing dégressif
  qte_min         integer NOT NULL,
  qte_max         integer,
  prix_unitaire   numeric NOT NULL,       -- prix HT par pièce marquée

  -- Frais fixes
  frais_technique numeric DEFAULT 29,     -- frais cliché/setup par logo (une fois)

  -- Contraintes techniques
  largeur_max_cm  numeric,                -- largeur max du marquage en cm
  hauteur_max_cm  numeric,                -- hauteur max
  nb_couleurs_max integer,                -- nb couleurs max (sérigraphie)

  -- Délai
  delai_jours     integer NOT NULL,       -- jours ouvrés de production marquage

  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marking_pricing_lookup
  ON marking_pricing(marqueur, technique, position, qte_min);

-- Pas de RLS — table de référence, lecture publique, écriture admin only
ALTER TABLE marking_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY marking_public_read ON marking_pricing
  FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- TABLE : orders
-- Suivi de commande (créée quand un devis est validé/payé)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id              uuid REFERENCES quotes(id),
  client_id             uuid REFERENCES clients(id),
  project_id            uuid REFERENCES client_projects(id),

  -- Routage
  circuit               text NOT NULL,    -- 'A' (Cybernecard auto) ou 'B' (TopTex+Siri assisté)
  statut                text DEFAULT 'en_attente',
  -- Statuts possibles :
  --   en_attente → commande_fournisseur → en_production
  --   → bat_envoye → bat_valide → en_marquage → expedie → livre

  -- Lignes commande (copie snapshot du devis au moment de la validation)
  lignes                jsonb NOT NULL,
  -- Chaque ligne inclut le marquage choisi :
  -- [{ref, nom, qty, prix_unitaire, marquage: {technique, position, largeur_cm, logo_url, prix_unitaire}}]

  -- Circuit A — Cybernecard
  commande_cyber_id     text,
  bat_url               text,
  bat_valide            boolean DEFAULT false,
  bat_valide_at         timestamptz,

  -- Circuit B — TopTex + Siri Ouest
  mail_siri_brouillon   text,             -- brouillon généré
  mail_siri_envoye      boolean DEFAULT false,
  mail_siri_envoye_at   timestamptz,
  commande_toptex_id    text,

  -- Paiement
  stripe_payment_intent text,
  stripe_checkout_url   text,
  montant_ht            numeric,
  montant_ttc           numeric,
  paye                  boolean DEFAULT false,
  paye_at               timestamptz,

  -- Livraison
  tracking_number       text,
  tracking_url          text,
  date_expedition       date,
  date_livraison_est    date,

  -- Timestamps
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_quote ON orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_orders_statut ON orders(statut);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_orders ON orders
  FOR ALL USING (client_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- TABLE : quotes — enrichissement pour le parcours commande
-- ────────────────────────────────────────────────────────────

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS circuit text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deadline_client date;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES client_projects(id);

-- ============================================================
-- One-liner pour copier-coller dans l'éditeur SQL Supabase :
--
-- Copiez le contenu complet de ce fichier dans l'éditeur SQL.
-- Toutes les commandes sont idempotentes (IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================
