import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Textile personnalisé Bordeaux — Broderie, impression pro | Toque2Me',
  description:
    'Fournisseur de textile personnalisé à Bordeaux. T-shirts, polos, sweats brodés ou imprimés avec votre logo. Devis en 3 minutes, livraison Gironde et toute la France.',
  openGraph: {
    title: 'Textile personnalisé Bordeaux — Toque2Me',
    description:
      'Broderie et impression textile pour professionnels à Bordeaux. Devis gratuit en 3 minutes.',
  },
};

const SECTEURS = [
  {
    icon: '🍷',
    label: 'Vignobles & Caves',
    desc: 'Polos brodés, tabliers de dégustation, vestes pour les vendanges',
    href: '/catalogue?categorie=Polos',
  },
  {
    icon: '🍽️',
    label: 'Restauration & CHR',
    desc: 'Tabliers, vestes de chef, t-shirts serveurs — conformité HACCP',
    href: '/restaurateurs',
  },
  {
    icon: '🦺',
    label: 'BTP & Artisans',
    desc: 'Haute visibilité, vêtements normés EN ISO 20471, broderie logo',
    href: '/btp',
  },
  {
    icon: '🏢',
    label: 'Agences & Startups',
    desc: 'Packs onboarding, merch équipe, goodies événementiels',
    href: '/configurateur',
  },
  {
    icon: '🎉',
    label: 'Événementiel',
    desc: 'T-shirts marathon, staff festival, associations sportives',
    href: '/catalogue?categorie=T-shirts',
  },
  {
    icon: '🏥',
    label: 'Santé & Bien-être',
    desc: 'Tuniques, blouses, polos brodés pour cabinets et cliniques',
    href: '/catalogue?categorie=Polos',
  },
];

const FAQ = [
  {
    q: 'Quels sont les délais de livraison à Bordeaux ?',
    a: 'Les commandes sans marquage sont livrées sous 3 à 5 jours ouvrés. Avec broderie ou impression, comptez 10 à 15 jours ouvrés. Livraison gratuite dès 150 € HT.',
  },
  {
    q: 'Quel est le minimum de commande ?',
    a: 'Pas de minimum pour les vêtements vierges. Pour la personnalisation (broderie ou impression), le minimum est de 10 pièces par visuel.',
  },
  {
    q: 'Quelles techniques de marquage proposez-vous ?',
    a: 'Broderie (la plus durable, idéale pour polos et vestes), sérigraphie (grands volumes), transfert DTF (petites séries, multi-couleurs) et impression numérique DTG (photo-réaliste).',
  },
  {
    q: 'Peut-on venir voir les produits sur place à Bordeaux ?',
    a: 'Oui, sur rendez-vous. Nous pouvons aussi envoyer des échantillons gratuits pour valider la matière et les coloris avant commande.',
  },
  {
    q: 'Travaillez-vous avec les associations et clubs sportifs bordelais ?',
    a: 'Absolument. Nous proposons des tarifs dégressifs adaptés aux clubs, associations et comités d\'entreprise. Devis spécifique sur demande.',
  },
];

export default function BordeauxPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const localLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Toque2Me — Textile personnalisé Bordeaux',
    description:
      'Fournisseur de textile personnalisé pour professionnels à Bordeaux. Broderie, sérigraphie, DTF.',
    url: 'https://toque2me.com/bordeaux',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bordeaux',
      postalCode: '33000',
      addressRegion: 'Nouvelle-Aquitaine',
      addressCountry: 'FR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 44.8378,
      longitude: -0.5792,
    },
    areaServed: [
      { '@type': 'City', name: 'Bordeaux' },
      { '@type': 'City', name: 'Mérignac' },
      { '@type': 'City', name: 'Pessac' },
      { '@type': 'City', name: 'Talence' },
      { '@type': 'City', name: 'Bègles' },
      { '@type': 'AdministrativeArea', name: 'Gironde' },
    ],
    priceRange: '€€',
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-20 text-center">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-5">
            Bordeaux &middot; Gironde &middot; Nouvelle-Aquitaine
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
            Textile personnalisé<br />
            pour les pros bordelais
          </h1>
          <p className="mt-6 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Broderie, sérigraphie, DTF — sur t-shirts, polos, sweats, tabliers.
            Devis en 3 minutes, livraison Gironde et toute la France.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/configurateur"
              className="px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Demander un devis gratuit
            </Link>
            <Link
              href="/catalogue"
              className="px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* Secteurs locaux */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-neutral-900 text-center mb-10">
          On habille tous les secteurs à Bordeaux
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTEURS.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="group p-5 border border-slate-100 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <span className="text-2xl block mb-2">{s.icon}</span>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:underline underline-offset-2">
                {s.label}
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Pourquoi Toque2Me */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-10">
            Pourquoi les pros de Bordeaux nous choisissent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Proximité</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Basés à Bordeaux, nous connaissons le tissu économique local.
                Rendez-vous possible sur place, échantillons offerts.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Prix pro dégressifs</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Tarifs B2B transparents qui baissent avec la quantité.
                Pas de frais cachés, tout est dans le devis.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Délais maîtrisés</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                3 à 5 jours sans marquage, 10 à 15 jours avec personnalisation.
                Urgences traitées au cas par cas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu SEO */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">
          Votre fournisseur textile pro à Bordeaux
        </h2>
        <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
          <p>
            Toque2Me accompagne les entreprises, restaurants, associations et artisans de
            Bordeaux et de toute la Gironde dans la personnalisation de leur textile professionnel.
            Que vous soyez un restaurant du quartier Saint-Pierre, un domaine viticole
            de Pessac-Léognan, une startup de la Darwin ou un artisan de Mérignac,
            nous avons le produit et la technique de marquage adaptés à votre projet.
          </p>
          <p>
            Notre catalogue référence plus de 2 900 produits issus de fournisseurs européens
            reconnus : t-shirts, polos, sweats, vestes, tabliers, casquettes, bagagerie.
            Chaque article est disponible en broderie, sérigraphie, transfert DTF ou
            impression numérique DTG, selon le rendu et le budget souhaités.
          </p>
          <p>
            Les secteurs les plus actifs à Bordeaux sont la restauration et l&apos;hôtellerie
            (tabliers brodés, vestes de chef), le BTP (haute visibilité, vêtements normés),
            l&apos;événementiel (t-shirts staff pour la Fête du Vin, marathons, festivals)
            et les entreprises tech qui équipent leurs équipes avec des packs onboarding
            personnalisés.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-xl font-bold text-neutral-900 mb-8">
            Questions fréquentes — Textile personnalisé à Bordeaux
          </h2>
          <div className="space-y-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">{f.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Prêt à habiller votre équipe ?
        </h2>
        <p className="text-slate-500 mb-8">
          Devis gratuit en 3 minutes, sans engagement.
        </p>
        <Link
          href="/configurateur"
          className="inline-flex items-center px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
        >
          Configurer mon devis
        </Link>
      </section>
    </main>
  );
}
