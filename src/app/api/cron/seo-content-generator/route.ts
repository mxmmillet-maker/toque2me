import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const SYSTEM_PROMPT =
  'Tu es un rédacteur SEO expert en textile professionnel. ' +
  'Génère une description produit de 2-3 phrases, optimisée pour le référencement. ' +
  'Mentionne les matières, le grammage si disponible, les certifications. ' +
  'Style professionnel mais accessible.';

const MAX_PRODUCTS_PER_RUN = 10;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      statut: 'ignoré',
      details: 'ANTHROPIC_API_KEY non définie',
    });
  }

  const start = Date.now();
  let nbTraites = 0;
  let nbErreurs = 0;
  const details: string[] = [];

  // Trouver les produits avec description vide ou très courte
  const { data: products, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('id, ref_fournisseur, nom, description, grammage, certifications, categorie, fournisseur')
    .eq('actif', true)
    .or('description.is.null,description.eq.,description.lt.50')
    .limit(MAX_PRODUCTS_PER_RUN);

  if (fetchError) {
    await supabaseAdmin.from('sync_logs').insert({
      fournisseur: 'seo-content',
      nb_produits_traites: 0,
      nb_produits_nouveaux: 0,
      nb_erreurs: 1,
      statut: 'erreur',
      details: `Erreur fetch produits: ${fetchError.message}`,
    });

    return NextResponse.json({
      statut: 'erreur',
      details: fetchError.message,
      duree_ms: Date.now() - start,
    });
  }

  // Filtrer côté JS les descriptions < 50 chars (le .lt sur text n'est pas fiable)
  const toProcess = (products ?? []).filter(
    (p) => !p.description || p.description.length < 50
  );

  for (const product of toProcess) {
    try {
      const userPrompt = buildPrompt(product);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Anthropic API ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const generatedDesc = data.content?.[0]?.text?.trim();

      if (!generatedDesc) {
        throw new Error('Réponse vide de Claude');
      }

      // Mettre à jour le produit en base
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ description: generatedDesc })
        .eq('id', product.id);

      if (updateError) {
        throw new Error(`Update échoué: ${updateError.message}`);
      }

      nbTraites++;
      details.push(`${product.ref_fournisseur}: OK`);
    } catch (e: any) {
      nbErreurs++;
      details.push(`${product.ref_fournisseur}: ${e.message}`);
    }
  }

  const statut = nbErreurs === 0 ? 'ok' : nbErreurs < toProcess.length ? 'partiel' : 'erreur';

  // Log en base
  await supabaseAdmin.from('sync_logs').insert({
    fournisseur: 'seo-content',
    nb_produits_traites: nbTraites,
    nb_produits_nouveaux: nbTraites,
    nb_erreurs: nbErreurs,
    statut,
    details: details.join(' | ') || 'Aucun produit à traiter',
  });

  return NextResponse.json({
    statut,
    nb_traites: nbTraites,
    nb_erreurs: nbErreurs,
    details,
    duree_ms: Date.now() - start,
  });
}

function buildPrompt(product: any): string {
  const parts = [`Produit : ${product.nom}`];

  if (product.ref_fournisseur) {
    parts.push(`Référence : ${product.ref_fournisseur}`);
  }
  if (product.fournisseur) {
    parts.push(`Fournisseur : ${product.fournisseur}`);
  }
  if (product.categorie) {
    parts.push(`Catégorie : ${product.categorie}`);
  }
  if (product.grammage) {
    parts.push(`Grammage : ${product.grammage} g/m²`);
  }
  if (product.certifications?.length) {
    parts.push(`Certifications : ${product.certifications.join(', ')}`);
  }
  if (product.description) {
    parts.push(`Description actuelle (à améliorer) : ${product.description}`);
  }

  parts.push('\nGénère une description SEO de 2-3 phrases en français.');

  return parts.join('\n');
}
