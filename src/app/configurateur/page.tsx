'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QCMStep } from '@/components/agent/QCMStep';
import { ResultsStep } from '@/components/agent/ResultsStep';
import { ChatStep } from '@/components/agent/ChatStep';
import { BriefInput, type ExtractedBrief } from '@/components/agent/BriefInput';
import { LivePreviewSidebar } from '@/components/configurateur/LivePreviewSidebar';
import Link from 'next/link';

type Step = 'qcm' | 'results' | 'chat';

const SESSION_KEY = 'toque2me_configurateur';

export default function ConfigurateurPage() {
  const [step, setStep] = useState<Step>('qcm');
  const [context, setContext] = useState<any>({});
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [livePreview, setLivePreview] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Restaurer depuis sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setStep(state.step || 'qcm');
        setContext(state.context || {});
        setResults(state.results || []);
        setLivePreview(state.livePreview || []);
      }
    } catch { /* ignore */ }
  }, []);

  // Sauvegarder
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step, context, results, livePreview }));
    } catch { /* ignore */ }
  }, [step, context, results, livePreview]);

  const fetchResults = async (ctx: any, forPreview = false) => {
    if (forPreview) setPreviewLoading(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/agent/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ctx }),
      });
      const data = await res.json();
      const products = (data.products || []).slice(0, 4);
      if (forPreview) setLivePreview(products);
      else setResults(products);
    } catch {
      if (forPreview) setLivePreview([]);
      else setResults([]);
    } finally {
      if (forPreview) setPreviewLoading(false);
      else setLoading(false);
    }
  };

  // Preview live : quand le context bouge pendant le QCM, on refetch en arrière-plan
  const updatePreview = (partialCtx: any) => {
    const merged = { ...context, ...partialCtx };
    setContext(merged);
    // Refetch preview seulement si on a au moins secteur + typologies
    if (merged.secteur && merged.typologies?.length) {
      fetchResults(merged, true);
    }
  };

  const handleQCMComplete = async (answers: any) => {
    const ctx = {
      typologies: answers.pieces,
      secteur: answers.secteur,
      budget_global: answers.budget_global,
      nb_personnes: answers.nb_personnes,
      usage: answers.usage,
      style: answers.style,
      type_etablissement: answers.type_etablissement,
    };
    setContext(ctx);
    await fetchResults(ctx);
    setStep('results');
  };

  const goToStep = (target: Step) => {
    const order: Step[] = ['qcm', 'results', 'chat'];
    if (order.indexOf(target) < order.indexOf(step)) {
      setStep(target);
    }
  };

  const reset = () => {
    setStep('qcm');
    setContext({});
    setResults([]);
    setLivePreview([]);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const STEP_LABELS = { qcm: 'Vos besoins', results: 'Sélection', chat: 'Affiner' };
  const STEP_ORDER: Step[] = ['qcm', 'results', 'chat'];
  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-600">Configurateur</span>
        </nav>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            Configurez votre pack
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Trouvez le produit idéal en 3 étapes — vos suggestions apparaissent en temps réel
          </p>
        </div>

        {/* Progress bar mobile-first */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            {STEP_ORDER.map((s, i) => {
              const isPast = currentIdx > i;
              const isCurrent = step === s;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => isPast && goToStep(s)}
                    disabled={!isPast}
                    className="flex items-center gap-2 disabled:cursor-default flex-shrink-0"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      isCurrent ? 'bg-neutral-900 text-white scale-110' :
                      isPast ? 'bg-emerald-500 text-white' :
                      'bg-neutral-100 text-neutral-400'
                    }`}>
                      {isPast ? (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-xs font-medium hidden sm:inline ${
                      isCurrent ? 'text-neutral-900' : isPast ? 'text-neutral-500' : 'text-neutral-400'
                    }`}>{STEP_LABELS[s]}</span>
                  </button>
                  {i < STEP_ORDER.length - 1 && (
                    <div className={`h-px flex-1 transition-colors ${
                      isPast ? 'bg-emerald-500' : 'bg-neutral-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Layout 2 colonnes sur desktop, 1 colonne + sidebar en bas sur mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {step === 'qcm' && (
                  <div>
                    {/* Brief texte libre */}
                    <BriefInput onExtracted={async (data: ExtractedBrief) => {
                      const ctx = {
                        typologies: data.typologies?.length ? data.typologies : undefined,
                        secteur: data.secteur || undefined,
                        nb_personnes: data.nb_personnes || undefined,
                        budget_global: undefined,
                        usage: data.usage || undefined,
                        style: data.style || undefined,
                        deadline: data.deadline || undefined,
                        repartition_hf: undefined,
                      };
                      setContext(ctx);
                      if (ctx.typologies && ctx.typologies.length > 0 && data.confidence > 0.6) {
                        await fetchResults(ctx);
                        setStep('results');
                      } else if (ctx.secteur && ctx.typologies?.length) {
                        // Preview live pendant que l'utilisateur continue le QCM
                        fetchResults(ctx, true);
                      }
                    }} />

                    <div className="relative my-6 flex items-center">
                      <div className="flex-1 border-t border-neutral-200" />
                      <span className="px-3 text-xs text-neutral-400">ou répondez aux questions</span>
                      <div className="flex-1 border-t border-neutral-200" />
                    </div>

                    <QCMStep onComplete={handleQCMComplete} loading={loading} onPartialUpdate={updatePreview} />
                  </div>
                )}

                {step === 'results' && (
                  loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <ResultsStep products={results} onRefine={() => setStep('chat')} />
                  )
                )}

                {step === 'chat' && (
                  <div className="h-[600px] border border-neutral-100 rounded-2xl overflow-hidden">
                    <ChatStep context={context} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Reset */}
            {step !== 'qcm' && (
              <button
                onClick={reset}
                className="mt-6 text-xs text-slate-400 hover:text-neutral-900 underline underline-offset-2 transition-colors"
              >
                Recommencer
              </button>
            )}
          </div>

          {/* Sidebar live — desktop à droite, mobile en bas */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              <LivePreviewSidebar
                products={step === 'qcm' ? livePreview : results}
                loading={step === 'qcm' ? previewLoading : loading}
                nbPersonnes={context.nb_personnes}
                title={step === 'qcm' ? 'Aperçu temps réel' : 'Votre sélection'}
                subtitle={step === 'qcm' ? 'Se met à jour à chaque réponse' : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
