'use client';

import { useState, useEffect } from 'react';
import { TypologySelector } from '@/components/agent/TypologySelector';
import { QCMStep } from '@/components/agent/QCMStep';
import { ResultsStep } from '@/components/agent/ResultsStep';
import { ChatStep } from '@/components/agent/ChatStep';

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

  const fetchResults = async (ctx: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Montre-moi les produits les plus adaptés à mes critères.' }],
          context: { ...ctx, sessionId: Date.now().toString() },
        }),
      });

      const data = await res.json();
      if (data.fallback && data.products) {
        setResults(data.products.slice(0, 4));
      } else {
        // Si streaming, on fait un appel séparé pour les résultats
        const res2 = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Liste les 4 meilleurs produits.' }],
            context: { ...ctx, sessionId: Date.now().toString() },
          }),
        });

        const contentType = res2.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const d2 = await res2.json();
          setResults(d2.products || []);
        }
      }
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
    };
    setContext(ctx);
    await fetchResults(ctx);
    setStep('results');
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Configurateur
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Trouvez le produit idéal en 3 étapes
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(['qcm', 'results', 'chat'] as Step[]).map((s, i) => {
            const labels = ['Vos besoins', 'Sélection', 'Affinage'];
            const stepOrder = ['qcm', 'results', 'chat'];
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    step === s ? 'bg-neutral-900 text-white' :
                    stepOrder.indexOf(step) > i ? 'bg-neutral-200 text-neutral-600' :
                    'bg-neutral-100 text-neutral-400'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-[10px] text-neutral-400">{labels[i]}</span>
                </div>
                {i < 2 && <div className="w-8 h-px bg-neutral-200 mb-4" />}
              </div>
            );
          })}
        </div>

        {step === 'qcm' && (
          <QCMStep onComplete={handleQCMComplete} />
        )}

        {step === 'results' && (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
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
            className="mt-6 text-xs text-neutral-400 hover:text-neutral-700 underline underline-offset-2"
          >
            Recommencer
          </button>
        )}
      </div>
    </main>
  );
}
