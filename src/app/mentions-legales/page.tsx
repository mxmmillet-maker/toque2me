import Link from 'next/link';

export const metadata = { title: 'Mentions légales — Toque2Me' };

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-sm prose-neutral">
        <nav className="mb-8 text-xs text-neutral-400 not-prose">
          <Link href="/" className="hover:text-neutral-900">Accueil</Link> / <span className="text-neutral-600">Mentions légales</span>
        </nav>

        <h1>Mentions légales</h1>

        <h2>Éditeur du site</h2>
        <p>
          <strong>Toque2Me</strong><br />
          Plateforme de vente de textile et objets personnalisés pour professionnels<br />
          Bordeaux, France<br />
          Email : contact@toque2me.com
        </p>

        <h2>Hébergement</h2>
        <p>
          Le site toque2me.com est hébergé par :<br />
          <strong>Vercel Inc.</strong><br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
          <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>L'ensemble du contenu du site (textes, images, mise en page, code source) est la propriété de Toque2Me ou de ses partenaires. Toute reproduction, même partielle, est interdite sans autorisation préalable.</p>
        <p>Les logos et visuels des produits sont la propriété de leurs fabricants respectifs et sont utilisés à titre informatif dans le cadre de la relation commerciale.</p>

        <h2>Données personnelles</h2>
        <p>Les données collectées sont traitées conformément à notre <Link href="/confidentialite">politique de confidentialité</Link>.</p>

        <h2>Cookies</h2>
        <p>Le site utilise des cookies techniques nécessaires à son fonctionnement (session, panier, préférences). Des cookies analytiques (Vercel Analytics) peuvent être utilisés pour améliorer l'expérience utilisateur. Aucun cookie publicitaire n'est utilisé.</p>

        <h2>Crédits</h2>
        <p>Design et développement : Toque2Me. Police : Poppins (Google Fonts, SIL Open Font License).</p>
      </div>
    </main>
  );
}
