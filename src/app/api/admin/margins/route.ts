import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  // Auth obligatoire — header Authorization: Bearer <ADMIN_SECRET>
  const auth = req.headers.get('authorization');
  const expected = process.env.ADMIN_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const allowed = ['coefficient', 'franco_port_ht', 'frais_port_ht'];
  const safeUpdates: Record<string, number> = {};
  for (const key of allowed) {
    if (key in updates && typeof updates[key] === 'number') {
      safeUpdates[key] = updates[key];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'no valid fields' }, { status: 400 });
  }

  const { error } = await supabase.from('margins').update(safeUpdates).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
