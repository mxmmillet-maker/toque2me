import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://toque2me.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalogue`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/configurateur`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/restaurateurs`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/btp`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/btp/electriciens`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/btp/chantier`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/bordeaux`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/guides/restauration`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/guides/electricien`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/guides/chantier`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Pages produits
  const { data: products } = await supabase
    .from('products')
    .select('ref_fournisseur, updated_at')
    .order('nom');

  const productPages: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: `${BASE_URL}/catalogue/${p.ref_fournisseur}`,
    lastModified: p.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages];
}
