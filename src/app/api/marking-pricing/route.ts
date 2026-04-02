import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// ─── Rate limit : 60 req/h/IP ──────────────────────────────────────────────
const rates = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rates.get(ip);
  if (!entry || now > entry.reset) {
    rates.set(ip, { count: 1, reset: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

// ─── GET /api/marking-pricing ───────────────────────────────────────────────
// Query params (all optional):
//   technique  — filter by technique (broderie, serigraphie, dtf, ...)
//   position   — filter by position (coeur, dos, manche, ...)
//   qty        — filter rows where qte_min <= qty <= qte_max (or qte_max is null)
//   marqueur   — filter by marqueur (siri_ouest, cybernecard, ...)

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const technique = searchParams.get('technique');
  const position = searchParams.get('position');
  const qtyRaw = searchParams.get('qty');
  const marqueur = searchParams.get('marqueur');

  let query = supabaseAdmin
    .from('marking_pricing')
    .select('*')
    .order('technique')
    .order('position')
    .order('qte_min', { ascending: true });

  if (technique) {
    query = query.eq('technique', technique.toLowerCase());
  }
  if (position) {
    query = query.eq('position', position.toLowerCase());
  }
  if (marqueur) {
    query = query.eq('marqueur', marqueur.toLowerCase());
  }
  if (qtyRaw) {
    const qty = parseInt(qtyRaw, 10);
    if (isNaN(qty) || qty < 1) {
      return NextResponse.json({ error: 'qty must be a positive integer' }, { status: 400 });
    }
    query = query.lte('qte_min', qty).or(`qte_max.gte.${qty},qte_max.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[marking-pricing] Supabase error:', error.message);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }

  return NextResponse.json({ rows: data, count: data?.length ?? 0 });
}
