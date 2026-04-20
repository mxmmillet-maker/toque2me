import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

async function getAdminData() {
  const [products, activeProducts, quotesCount, syncLogs, margins, quotes, clients] = await Promise.all([
    supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('actif', true),
    supabaseAdmin.from('quotes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sync_logs').select('*').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('margins').select('*').order('fournisseur'),
    supabaseAdmin
      .from('quotes')
      .select('id, created_at, statut, total_ht, share_token, lignes, client_id, clients(email, nom, entreprise)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('clients')
      .select('id, email, nom, entreprise, secteur, telephone, siret, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  return {
    totalProducts: products.count ?? 0,
    activeProducts: activeProducts.count ?? 0,
    totalQuotes: quotesCount.count ?? 0,
    totalClients: clients.data?.length ?? 0,
    syncLogs: syncLogs.data ?? [],
    margins: margins.data ?? [],
    quotes: quotes.data ?? [],
    clients: clients.data ?? [],
    orders: [],
  };

  // Fetch orders separately (may not exist yet)
  try {
    const { data: ordersData } = await supabaseAdmin
      .from('orders')
      .select('id, created_at, statut, lignes, montant_ht, montant_ttc, paye, tracking_number, tracking_url, client_id, clients(email, nom, entreprise)')
      .order('created_at', { ascending: false })
      .limit(100);
    result.orders = ordersData ?? [];
  } catch { /* table may not exist */ }

  return result;
}

export default async function AdminPage({ searchParams }: { searchParams: { key?: string } }) {
  if (searchParams.key !== process.env.ADMIN_SECRET) {
    redirect('/');
  }

  const data = await getAdminData();

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Back-office Toque2Me</h1>
          <p className="text-sm text-neutral-500">Gestion devis, clients, marges et workers</p>
        </div>
        <AdminDashboard data={data} />
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
