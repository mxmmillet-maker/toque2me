'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const SLIDES = [
  {
    title: 'Vos vêtements pro\npersonnalisés en 3 clics',
    sub: 'Configurez, recevez votre devis, payez. Votre commande part en production immédiatement.',
    cta: 'Configurer mon pack — 30s',
    href: '/configurateur',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: 'Devis en 30 secondes',
  },
  {
    title: 'Tenues de cuisine\nconformes HACCP',
    sub: 'Vestes, tabliers, pantalons — personnalisés avec votre logo. Lavables à 60°C.',
    cta: 'Voir les tenues cuisine',
    href: '/restaurateurs',
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'Conformité garantie',
  },
  {
    title: 'Événement dans 3 semaines ?\nOn gère.',
    sub: 'Notre moteur temporel vous montre uniquement les produits livrables à temps. Zéro mauvaise surprise.',
    cta: 'Configurer mon événement',
    href: '/configurateur?occasion=evenement',
    accent: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'Livraison date garantie',
  },
  {
    title: 'Workwear conforme\npour chaque métier',
    sub: 'EN ISO 20471, EN 1149-5, EN ISO 11612 — filtrez par norme, commandez en ligne.',
    cta: 'Trouver mon métier',
    href: '/btp',
    accent: 'bg-orange-50 text-orange-700 border-orange-200',
    badge: '10 corps de métier',
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 sm:pb-18 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full mb-5 border ${slide.accent}`}>
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
              {slide.badge}
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1] whitespace-pre-line">
              {slide.title}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              {slide.sub}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={slide.href}
                className="px-7 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
              >
                {slide.cta}
              </Link>
              <Link
                href="/catalogue"
                className="px-7 py-3 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Voir le catalogue
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-neutral-900' : 'w-1.5 bg-neutral-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
