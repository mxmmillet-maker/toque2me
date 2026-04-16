import Link from 'next/link';
import { OpenChatWithContextButton } from '@/components/home/OpenChatWithContextButton';

const METIERS = [
  { href: '/sante/cabinet-medical', label: 'Cabinet médical', desc: 'Médecin, kiné, dentiste, spécialistes', icon: '🩺' },
  { href: '/sante/clinique', label: 'Clinique / Hôpital', desc: 'Personnel soignant, aide-soignant, infirmier', icon: '🏥' },
  { href: '/sante/spa-institut', label: 'Spa & Institut de beauté', desc: 'Esthétique, bien-être, massage', icon: '💆' },
  { href: '/sante/pharmacie', label: 'Pharmacie / Laboratoire', desc: 'Blouses blanches, antibactérien', icon: '💊' },
  { href: '/sante/dentaire', label: 'Dentaire / Orthodontie', desc: 'Tuniques col V, cache-cœur', icon: '🦷' },
  { href: '/sante/veterinaire', label: 'Vétérinaire', desc: 'Confort, résistance, hygiène', icon: '🐾' },
];

export default function SantePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
          Tenues pour santé, beauté & bien-être
        </h1>
        <p className="mt-4 text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto">
          Tuniques, blouses, cache-cœur, traitements antibactériens.
          Personnalisés avec votre logo — livrés sous 7 jours.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Votre activité
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {METIERS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-start gap-3 p-4 border border-neutral-200 rounded-xl hover:border-neutral-400 hover:shadow-sm transition-all"
            >
              <span className="text-2xl flex-shrink-0">{m.icon}</span>
              <div>
                <h3 className="text-sm font-medium text-neutral-900">{m.label}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <OpenChatWithContextButton
            label="Configurer ma tenue médicale"
            secteur="sante"
            occasion="workwear"
          />
        </div>
      </section>

      {/* Guide */}
      <section className="bg-neutral-50 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Vêtements pro santé — ce qu&apos;il faut savoir</h2>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">Matières adaptées</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Polycoton haute résistance, lavable à 60°C minimum. Traitements antibactériens disponibles
              pour les environnements sensibles (cabinet, clinique, dentaire).
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">Coupes professionnelles</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Tuniques col V, cache-cœur femme, cols mao, pantalons à cordon — pensés pour le mouvement
              et le confort sur de longues journées. Poches nombreuses pour les outils.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">Personnalisation</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Broderie recommandée pour les tuniques médicales (résiste au lavage haute température).
              Logo cabinet/clinique cœur gauche, nom collaborateur en option.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
