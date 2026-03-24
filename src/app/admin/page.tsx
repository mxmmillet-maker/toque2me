import { createClient } from '@supabase/supabase-js';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getStats() {
  const [products, activeProducts, quotes, syncLogs] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('actif', true),
    supabase.from('quotes').select('*', { count: 'exact', head: true }),
    supabase.from('sync_logs').select('*').order('created_at', { ascending: false }).limit(20),
  ]);

  const { data: margins } = await supabase.from('margins').select('*').order('fournisseur');

  return {
    totalProducts: products.count ?? 0,
    activeProducts: activeProducts.count ?? 0,
    totalQuotes: quotes.count ?? 0,
    syncLogs: syncLogs.data ?? [],
    margins: margins ?? [],
  };
}

export default async function AdminPage() {
  const stats = await getStats();

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Back-office Toque2Me</h1>
          <p className="text-sm text-neutral-500">Pilotage catalogue, marges et workers</p>
        </div>
        <AdminDashboard stats={stats} />
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
