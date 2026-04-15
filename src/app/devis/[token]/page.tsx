import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PayButton } from '@/components/devis/PayButton';

export default async function DevisPublicPage({ params }: { params: { token: string } }) {
  const { data: quote } = await supabaseAdmin
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
                <div className="flex items-start gap-3">
                  {l.image_url && (
                    <img src={l.image_url} alt={l.nom} className="w-12 h-12 rounded-lg object-cover bg-neutral-50 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-neutral-900">{l.nom}</p>
                    <p className="text-xs text-neutral-400">
                      Réf. {l.ref} — {l.qty} pce{l.qty > 1 ? 's' : ''}
                      {l.couleur_nom && (
                        <span className="ml-1">
                          — <span className="inline-block w-2.5 h-2.5 rounded-full align-middle mr-0.5" style={{ backgroundColor: l.couleur_hexa || '#ccc' }} /> {l.couleur_nom}
                        </span>
                      )}
                    </p>
                  </div>
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
            {quote.statut === 'paye' ? (
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Devis payé
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <PayButton shareToken={params.token} />
                <a
                  href={`/api/devis/pdf?token=${params.token}`}
                  target="_blank"
                  className="inline-flex items-center px-6 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  Télécharger le PDF
                </a>
              </div>
            )}
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
