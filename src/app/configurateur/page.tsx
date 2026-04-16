'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChatStep, type ChatStepHandle } from '@/components/agent/ChatStep';
import { LivePreviewSidebar } from '@/components/configurateur/LivePreviewSidebar';
import Link from 'next/link';

export default function ConfigurateurPage() {
  const searchParams = useSearchParams();
  const chatRef = useRef<ChatStepHandle>(null);
  const [livePreview, setLivePreview] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [context, setContext] = useState<any>({});
  const [prefillApplied, setPrefillApplied] = useState(false);

  // Prefill depuis query params (arrivée depuis /btp/electricien, /sante, etc.)
  useEffect(() => {
    if (prefillApplied) return;
    const secteur = searchParams.get('secteur');
    const metier = searchParams.get('metier');
    const typologies = searchParams.get('typologies')?.split(',').filter(Boolean);
    const occasion = searchParams.get('occasion');

    if (secteur || metier || typologies?.length) {
      const newCtx = {
        secteur: secteur || undefined,
        metier: metier || undefined,
        typologies: typologies || undefined,
        occasion: occasion || 'workwear',
      };
      setContext(newCtx);
      // Appliquer le prefill dans le ChatStep dès qu'il est prêt
      setTimeout(() => chatRef.current?.prefill(newCtx), 100);
      // Fetch preview live immédiatement si on a de quoi
      if (secteur && typologies?.length) {
        fetchPreview(newCtx);
      }
    }
    setPrefillApplied(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchPreview = async (ctx: any) => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/agent/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ctx }),
      });
      const data = await res.json();
      setLivePreview((data.products || []).slice(0, 4));
    } catch {
      setLivePreview([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const reset = () => {
    chatRef.current?.reset();
    setLivePreview([]);
    setContext({});
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-600">Configurateur</span>
        </nav>

        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
              Configurez votre pack
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quelques questions rapides — vos suggestions apparaissent en temps réel
            </p>
          </div>
          <button
            onClick={reset}
            className="text-xs text-slate-400 hover:text-neutral-900 underline underline-offset-2 transition-colors flex-shrink-0"
          >
            Recommencer
          </button>
        </div>

        {/* Layout 2 colonnes : conversation à gauche, preview live à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Colonne principale : ChatStep conversationnel */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="min-h-[500px] lg:h-[600px] border border-neutral-100 rounded-2xl overflow-hidden bg-white"
            >
              <ChatStep
                ref={chatRef}
                context={context}
                onRequestClose={() => {}}
                onContextChange={(newCtx) => {
                  // Convertir le qualifCtx (chatbot) vers le format context (API results)
                  const ctx: any = {
                    secteur: newCtx.secteur || context.secteur,
                    metier: newCtx.metier || context.metier,
                    typologies: newCtx.typologies,
                    style: newCtx.style,
                    usage: newCtx.usage,
                    nb_personnes: newCtx.nb_personnes,
                    budget_global: newCtx.budget_global,
                  };
                  setContext(ctx);
                  // Fetch preview dès qu'on a secteur + typologies
                  if (ctx.secteur && ctx.typologies?.length) {
                    fetchPreview(ctx);
                  }
                }}
              />
            </motion.div>
          </div>

          {/* Sidebar live preview — sticky desktop, bas mobile */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              <LivePreviewSidebar
                products={livePreview}
                loading={previewLoading}
                nbPersonnes={context.nb_personnes}
                title="Aperçu temps réel"
                subtitle="Se met à jour à chaque réponse"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
