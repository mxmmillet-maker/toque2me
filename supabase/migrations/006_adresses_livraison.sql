-- ============================================================
-- Migration 006 : Adresses de livraison multiples par client
-- Projet  : Toque2Me
-- Date    : 2026-04-15
-- ============================================================

CREATE TABLE IF NOT EXISTS client_adresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label       text NOT NULL,              -- "Siège", "Entrepôt Lyon", "Restaurant Bordeaux"
  nom         text,                       -- nom du destinataire
  rue         text NOT NULL,
  complement  text,                       -- étage, bâtiment, etc.
  cp          text NOT NULL,
  ville       text NOT NULL,
  pays        text DEFAULT 'France',
  telephone   text,                       -- téléphone livraison
  instructions text,                      -- "Sonner au 2e", "Livrer avant 10h"
  par_defaut  boolean DEFAULT false,      -- adresse par défaut
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_adresses_client ON client_adresses(client_id);

-- RLS
ALTER TABLE client_adresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_adresses ON client_adresses
  FOR ALL USING (client_id = auth.uid());
