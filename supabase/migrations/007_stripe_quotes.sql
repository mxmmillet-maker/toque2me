-- ============================================================
-- Migration 007 : Colonnes Stripe sur quotes
-- Projet  : Toque2Me
-- Date    : 2026-04-15
-- ============================================================

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS stripe_checkout_url text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS email_envoye boolean DEFAULT false;
