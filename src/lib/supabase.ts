import { createClient } from '@supabase/supabase-js';

// ─── Client public (anon key — soumis aux RLS) ──────────────────────────────
// Utilisable côté client ET côté serveur

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
