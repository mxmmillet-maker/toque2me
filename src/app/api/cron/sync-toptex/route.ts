import { NextRequest, NextResponse } from 'next/server';
import { syncSupplier, ToptexAdapter } from '@/workers';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncSupplier(ToptexAdapter);
  return NextResponse.json(result);
}
