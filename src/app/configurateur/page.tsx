'use client';

import { useState, useEffect } from 'react';
import { QCMStep } from '@/components/agent/QCMStep';
import { ResultsStep } from '@/components/agent/ResultsStep';
import { ChatStep } from '@/components/agent/ChatStep';
import { BriefInput, type ExtractedBrief } from '@/components/agent/BriefInput';
import Link from 'next/link';

type Step = 'qcm' | 'results' | 'chat';

const SESSION_KEY = 'toque2me_configurateur';

export default function ConfigurateurPage() {
  const [step, setStep] = useState<Step>('qcm');
  const [context, setContext] = useState<any>({});
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Restaurer l'état depuis sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setStep(state.step || 'qcm');
        setContext(state.context || {});
        setResults(state.results || []);
      }
    } catch { /* ignore */ }
  }, []);

  // Sauvegarder l'état
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step, context, results }));
    } catch { /* ignore */ }
  }, [step, context, results]);

  // Pousser chaque changement d'étape principale dans l'historique du navigateur
  const [isPopState, setIsPopState] = useState(false);
  useEffect(() => {
    if (isPopState) {
      setIsPopState(false);
      return;
    }
    // Pousse un état dans l'historique sauf au premier rendu
    window.history.pushState({ configurateurStep: step }, '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Écouter le popstate (back/forward du navigateur)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.configurateurStep) {
        setIsPopState(true);
        setStep(e.state.configurateurStep);
      } else if (e.state?.qcmSubStep !== undefined) {
        // Le QCM gère ses propres sous-étapes via un callback
        setIsPopState(true);
        setStep('qcm');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchResults = async (ctx: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ctx }),
      });

      const data = await res.json();
      setResults((data.products || []).slice(0, 4));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
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
    // On ne peut revenir qu'aux étapes déjà visitées (pas avancer)
    if (order.indexOf(target) < order.indexOf(step)) {
      setStep(target);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-600">Configurateur</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            Configurateur
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Trouvez le produit idéal en 3 étapes
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10">
          {(['qcm', 'results', 'chat'] as Step[]).map((s, i) => {
            const labels = ['Vos besoins', 'Sélection', 'Affinage'];
            const stepOrder = ['qcm', 'results', 'chat'];
            const currentIdx = stepOrder.indexOf(step);
            const isPast = currentIdx > i;
            const isCurrent = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => isPast && goToStep(s)}
                  disabled={!isPast}
                  className="flex flex-col items-center gap-1 disabled:cursor-default"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isCurrent ? 'bg-neutral-900 text-white' :
                    isPast ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-[10px] ${isPast ? 'text-slate-500' : 'text-slate-400'}`}>{labels[i]}</span>
                </button>
                {i < 2 && <div className="w-8 h-px bg-slate-200 mb-4" />}
              </div>
            );
          })}
        </div>

        {step === 'qcm' && (
          <>
            {/* Brief texte libre — raccourci pour les agences pressées */}
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
              // Si assez d'info, skip direct aux résultats
              if (ctx.typologies && ctx.typologies.length > 0 && data.confidence > 0.6) {
                await fetchResults(ctx);
                setStep('results');
              }
              // Sinon le QCM reste visible, pré-rempli via context
            }} />

            <div className="relative my-6 flex items-center">
              <div className="flex-1 border-t border-neutral-200" />
              <span className="px-3 text-xs text-neutral-400">ou répondez aux questions</span>
              <div className="flex-1 border-t border-neutral-200" />
            </div>

            <QCMStep onComplete={handleQCMComplete} loading={loading} />
          </>
        )}

        {step === 'results' && (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <ResultsStep
              products={results}
              onRefine={() => setStep('chat')}
            />
          )
        )}

        {step === 'chat' && (
          <ChatStep context={context} />
        )}

        {/* Reset */}
        {step !== 'qcm' && (
          <button
            onClick={() => {
              setStep('qcm');
              setContext({});
              setResults([]);
              sessionStorage.removeItem(SESSION_KEY);
            }}
            className="mt-8 text-xs text-slate-400 hover:text-neutral-900 underline underline-offset-2 transition-colors"
          >
            Recommencer
          </button>
        )}
      </div>
    </main>
  );
}
