-- ============================================================
-- Migration 002 : Sprint 2 — colonnes manquantes
-- Projet  : Toque2Me
-- Date    : 2026-03-26
-- Syntaxe : ALTER TABLE … ADD COLUMN IF NOT EXISTS (PG 9.6+)
-- ============================================================

-- ------------------------------------------------------------
-- TABLE : products
-- ------------------------------------------------------------

-- Style vestimentaire manuel (casual, chic, sportswear, classique).
-- Utilisé par le worker de classification pour forcer un style
-- au lieu de le déduire automatiquement.
ALTER TABLE products ADD COLUMN IF NOT EXISTS style text DEFAULT null;

-- Exclure un produit de l'affichage catalogue (soft-hide).
-- Le cron de publication vérifie ce flag avant de rendre
-- un produit visible.
ALTER TABLE products ADD COLUMN IF NOT EXISTS exclu boolean DEFAULT false;

-- Indicateur de stock bas, positionné par le worker stock.
-- null = pas encore évalué, true = stock bas, false = OK.
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_bas boolean DEFAULT null;

-- ------------------------------------------------------------
-- TABLE : quotes
-- ------------------------------------------------------------

-- Indique si l'email de confirmation de devis a été envoyé.
-- Positionné à true par le cron d'envoi d'emails.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS email_envoye boolean DEFAULT false;

-- Nombre de relances envoyées au client pour ce devis.
-- Incrémenté par le cron de relance.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS nb_relances integer DEFAULT 0;

-- ============================================================
-- One-liner pour copier-coller rapide dans l'éditeur SQL Supabase :
--
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS style text DEFAULT null; ALTER TABLE products ADD COLUMN IF NOT EXISTS exclu boolean DEFAULT false; ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_bas boolean DEFAULT null; ALTER TABLE quotes ADD COLUMN IF NOT EXISTS email_envoye boolean DEFAULT false; ALTER TABLE quotes ADD COLUMN IF NOT EXISTS nb_relances integer DEFAULT 0;
-- ============================================================
