import Link from 'next/link';

export const metadata = { title: 'Conditions Générales de Vente — Toque2Me' };

export default function CGVPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-sm prose-neutral">
        <nav className="mb-8 text-xs text-neutral-400 not-prose">
          <Link href="/" className="hover:text-neutral-900">Accueil</Link> / <span className="text-neutral-600">CGV</span>
        </nav>

        <h1>Conditions Générales de Vente</h1>
        <p className="text-neutral-500">Dernière mise à jour : avril 2026</p>

        <h2>1. Objet</h2>
        <p>Les présentes CGV régissent les ventes de textiles et objets personnalisés réalisées par Toque2Me (ci-après "le Prestataire") auprès de professionnels (ci-après "le Client"). Toute commande implique l'acceptation sans réserve des présentes conditions.</p>

        <h2>2. Commandes</h2>
        <p>Les commandes sont passées exclusivement via la plateforme toque2me.com. Le Client génère un devis, le valide et procède au paiement en ligne. La commande est confirmée à réception du paiement.</p>
        <p>Le Prestataire se réserve le droit de refuser toute commande pour motif légitime (contenu contraire à l'ordre public, fichiers de marquage inexploitables, etc.).</p>

        <h2>3. Prix</h2>
        <p>Les prix sont indiqués en euros hors taxes (HT). La TVA applicable (20%) est ajoutée au moment du paiement. Les prix sont dégressifs selon les quantités commandées et sont susceptibles d'être modifiés sans préavis, les commandes en cours restant au prix convenu.</p>

        <h2>4. Paiement</h2>
        <p>Le paiement s'effectue par carte bancaire via Stripe (paiement sécurisé). Le paiement est exigible à la commande. Aucune commande n'est mise en production avant réception intégrale du paiement.</p>

        <h2>5. Livraison</h2>
        <p>Les délais de livraison sont indicatifs et dépendent du type de personnalisation (broderie, sérigraphie, DTF) et de la disponibilité des produits. Le Prestataire s'engage à informer le Client de tout retard significatif.</p>
        <p>La livraison est gratuite pour toute commande supérieure à 150 € HT. En dessous de ce seuil, des frais de port de 12,50 € HT s'appliquent.</p>

        <h2>6. Marquage et personnalisation</h2>
        <p>Le Client fournit les fichiers nécessaires au marquage (logo, texte) dans un format exploitable (SVG, AI, PDF vectoriel, PNG haute résolution). Le Prestataire n'est pas responsable de la qualité du rendu si les fichiers fournis sont de résolution insuffisante.</p>
        <p>Un bon à tirer (BAT) peut être soumis au Client pour validation avant production. L'absence de réponse sous 48h ouvrées vaut acceptation.</p>

        <h2>7. Droit de rétractation</h2>
        <p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux produits personnalisés (marqués avec le logo ou texte du Client). Les produits non personnalisés peuvent être retournés sous 14 jours.</p>

        <h2>8. Réclamations</h2>
        <p>Toute réclamation doit être adressée par email dans les 7 jours suivant la livraison. Le Client doit fournir des photos du problème constaté. Le Prestataire s'engage à proposer un remplacement ou un avoir en cas de défaut avéré.</p>

        <h2>9. Responsabilité</h2>
        <p>Le Prestataire agit en qualité d'intermédiaire entre le Client et les fabricants/marqueurs. Sa responsabilité est limitée au montant de la commande concernée. Le Prestataire ne saurait être tenu responsable des retards de livraison imputables aux transporteurs.</p>

        <h2>10. Droit applicable</h2>
        <p>Les présentes CGV sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents de Bordeaux.</p>
      </div>
    </main>
  );
}
