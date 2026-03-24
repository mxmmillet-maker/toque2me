import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function DevisPublicPage({ params }: { params: { token: string } }) {
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('share_token', params.token)
    .single();

  if (!quote) return notFound();

  const lignes = quote.lignes || [];
  const totalHt = Number(quote.total_ht);
  const tva = Math.ceil(totalHt * 0.2 * 100) / 100;
  const totalTtc = Math.ceil(totalHt * 1.2 * 100) / 100;
  const validite = new Date(quote.created_at);
  validite.setDate(validite.getDate() + 30);

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100">
            <h1 className="text-lg font-bold text-neutral-900">TOQUE2ME</h1>
            <p className="text-xs text-neutral-400">Devis N° {quote.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-neutral-400">
              {new Date(quote.created_at).toLocaleDateString('fr-FR')} — valide jusqu&apos;au {validite.toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Lignes */}
          <div className="px-6 py-4 space-y-3">
            {lignes.map((l: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-neutral-900">{l.nom}</p>
                  <p className="text-xs text-neutral-400">Réf. {l.ref} — {l.qty} pce{l.qty > 1 ? 's' : ''}</p>
                </div>
                <span className="font-medium text-neutral-900 tabular-nums">{l.total_ligne_ht?.toFixed(2)} €</span>
              </div>
            ))}
          </div>

          {/* Totaux */}
          <div className="px-6 py-4 border-t border-neutral-100 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Total HT</span>
              <span className="font-medium tabular-nums">{totalHt.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">TVA (20%)</span>
              <span className="font-medium tabular-nums">{tva.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-200">
              <span className="font-semibold text-neutral-900">Total TTC</span>
              <span className="text-lg font-bold text-neutral-900 tabular-nums">{totalTtc.toFixed(2)} €</span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 py-5 bg-neutral-50 border-t border-neutral-100 text-center space-y-3">
            <a
              href={`/api/devis/pdf?token=${params.token}`}
              target="_blank"
              className="inline-flex items-center px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Télécharger le PDF
            </a>
            <p className="text-xs text-neutral-400">
              Vous aussi, configurez vos textiles pro sur{' '}
              <Link href="/configurateur" className="text-neutral-700 underline underline-offset-2">Toque2Me</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
