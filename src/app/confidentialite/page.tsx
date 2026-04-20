import Link from 'next/link';

export const metadata = { title: 'Politique de confidentialité — Toque2Me' };

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-sm prose-neutral">
        <nav className="mb-8 text-xs text-neutral-400 not-prose">
          <Link href="/" className="hover:text-neutral-900">Accueil</Link> / <span className="text-neutral-600">Politique de confidentialité</span>
        </nav>

        <h1>Politique de confidentialité</h1>
        <p className="text-neutral-500">Dernière mise à jour : avril 2026</p>

        <h2>1. Responsable du traitement</h2>
        <p>Toque2Me, basé à Bordeaux, est responsable du traitement des données personnelles collectées sur toque2me.com.</p>

        <h2>2. Données collectées</h2>
        <p>Nous collectons les données suivantes :</p>
        <ul>
          <li><strong>Données d'inscription :</strong> nom, prénom, email, entreprise, secteur d'activité</li>
          <li><strong>Données de commande :</strong> adresses de livraison, téléphone, SIRET, historique des devis et commandes</li>
          <li><strong>Données de paiement :</strong> traitées exclusivement par Stripe (nous ne stockons aucun numéro de carte)</li>
          <li><strong>Données de navigation :</strong> pages visitées, appareil, navigateur (via Vercel Analytics, anonymisé)</li>
        </ul>

        <h2>3. Finalités du traitement</h2>
        <ul>
          <li>Gestion des comptes clients et des commandes</li>
          <li>Envoi de devis, confirmations de commande et notifications de suivi</li>
          <li>Amélioration de l'expérience utilisateur et du catalogue</li>
          <li>Respect des obligations légales (facturation, comptabilité)</li>
        </ul>

        <h2>4. Base légale</h2>
        <p>Le traitement est fondé sur l'exécution d'un contrat (commande) et l'intérêt légitime du responsable de traitement (amélioration du service). Les emails marketing ne sont envoyés qu'avec consentement explicite.</p>

        <h2>5. Durée de conservation</h2>
        <ul>
          <li>Données de compte : durée de la relation commerciale + 3 ans</li>
          <li>Données de commande : 10 ans (obligations comptables)</li>
          <li>Données de navigation : 13 mois</li>
        </ul>

        <h2>6. Partage des données</h2>
        <p>Vos données sont partagées avec :</p>
        <ul>
          <li><strong>Supabase</strong> (hébergement base de données) — UE</li>
          <li><strong>Stripe</strong> (paiement sécurisé) — certifié PCI DSS</li>
          <li><strong>Resend</strong> (envoi d'emails transactionnels)</li>
          <li><strong>Vercel</strong> (hébergement du site) — analytics anonymisés</li>
        </ul>
        <p>Aucune donnée n'est vendue ou cédée à des tiers à des fins publicitaires.</p>

        <h2>7. Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li>Droit d'accès, de rectification et de suppression de vos données</li>
          <li>Droit à la portabilité</li>
          <li>Droit d'opposition au traitement</li>
          <li>Droit de retirer votre consentement à tout moment</li>
        </ul>
        <p>Pour exercer ces droits : <strong>contact@toque2me.com</strong></p>

        <h2>8. Cookies</h2>
        <p>Le site utilise uniquement des cookies techniques (session d'authentification, panier) et des cookies analytiques anonymisés (Vercel Analytics). Aucun cookie publicitaire ou de tracking tiers n'est déposé.</p>

        <h2>9. Sécurité</h2>
        <p>Les données sont chiffrées en transit (HTTPS) et au repos (Supabase). Les paiements sont sécurisés via Stripe (certifié PCI DSS niveau 1). L'accès aux données est restreint aux personnes habilitées.</p>
      </div>
    </main>
  );
}
