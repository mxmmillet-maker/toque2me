import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/espace-client';

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Pas grave si on ne peut pas set ici
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Créer/mettre à jour la ligne client si elle n'existe pas
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingClient) {
        await supabase.from('clients').insert({
          id: data.user.id,
          email: data.user.email,
          nom: data.user.user_metadata?.nom || null,
          entreprise: data.user.user_metadata?.entreprise || null,
        });
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // En cas d'erreur, rediriger vers la page de connexion
  return NextResponse.redirect(`${origin}/connexion?error=auth_callback_failed`);
}
