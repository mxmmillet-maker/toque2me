'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { MicButton } from './MicButton';
import {
  getStepsForContext,
  qualificationToPromptContext,
  buildQualificationSummary,
  BUDGET_TRANCHE_MAP,
  type QualificationContext,
  type QualificationStep,
} from '@/lib/agent/qualification-steps';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatStepProps {
  context: any;
  initialMessages?: Message[];
}

export function ChatStep({ context, initialMessages = [] }: ChatStepProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Qualification state
  const secteur = context?.secteur || '';
  const steps = useMemo(() => getStepsForContext(secteur), [secteur]);
  const [stepIndex, setStepIndex] = useState(0);
  const [qualifDone, setQualifDone] = useState(false);
  const [qualifCtx, setQualifCtx] = useState<Partial<QualificationContext>>({ secteur });
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [alerteVisible, setAlerteVisible] = useState<string | null>(null);

  // Scroll to bottom on new messages, scroll to top on new step
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, alerteVisible]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [stepIndex]);

  const handleMicTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + ' ' + text : text));
  }, []);

  // Refs extraction from assistant messages
  const extractedRefs = useMemo(() => {
    const allText = messages.filter(m => m.role === 'assistant').map(m => m.content).join(' ');
    const matches = allText.match(/\b([A-Z]{1,4}\d{2,5}[A-Z]{0,3})\b/g) || [];
    const excluded = new Set(['HT', 'TTC', 'TVA', 'ISO', 'HACCP', 'EN', 'EUR', 'PDF']);
    return Array.from(new Set(matches)).filter(r => !excluded.has(r) && r.length >= 3);
  }, [messages]);

  // Current step
  const currentStep: QualificationStep | null = !qualifDone && stepIndex < steps.length ? steps[stepIndex] : null;

  // Handle single choice
  const handleChoice = (step: QualificationStep, option: { value: string; label: string; alerte?: string }) => {
    // Show alerte if present
    if (option.alerte) {
      setAlerteVisible(option.alerte);
      setTimeout(() => setAlerteVisible(null), 3000);
    }

    // Add as user message
    setMessages(prev => [...prev, { role: 'user', content: option.label }]);

    // Update qualification context
    const newCtx = { ...qualifCtx, [step.id]: option.value };

    // Special handling
    if (step.id === 'budget_oui_non') {
      newCtx.a_budget = option.value === 'oui';
    }
    if (step.id === 'budget_tranche') {
      newCtx.budget_global = BUDGET_TRANCHE_MAP[option.value];
    }

    setQualifCtx(newCtx);

    // Determine next step
    if (step.next) {
      const nextId = step.next(option.value, newCtx);
      if (nextId === null) {
        // End of flow
        finishQualification(newCtx);
        return;
      }
      // Find step by id
      const nextIdx = steps.findIndex(s => s.id === nextId);
      if (nextIdx !== -1) {
        setStepIndex(nextIdx);
        return;
      }
    }

    // Move to next step
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      // Check if next step's condition is met
      const nextStep = steps[nextIndex];
      if (nextStep.condition && !nextStep.condition(newCtx)) {
        // Skip this step, try the one after
        const skipIdx = steps.findIndex((s, i) => i > nextIndex && (!s.condition || s.condition(newCtx)));
        if (skipIdx !== -1) {
          setStepIndex(skipIdx);
        } else {
          finishQualification(newCtx);
        }
      } else {
        setStepIndex(nextIndex);
      }
    } else {
      finishQualification(newCtx);
    }
  };

  // Handle multi-select confirm
  const handleMultiConfirm = (step: QualificationStep) => {
    setMessages(prev => [...prev, { role: 'user', content: multiSelection.join(', ') }]);
    const newCtx = { ...qualifCtx, [step.id]: multiSelection };
    setQualifCtx(newCtx);
    setMultiSelection([]);

    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setStepIndex(nextIndex);
    } else {
      finishQualification(newCtx);
    }
  };

  // Finish qualification → send to Claude
  const finishQualification = (ctx: Partial<QualificationContext>) => {
    setQualifDone(true);
    const summary = buildQualificationSummary(ctx as QualificationContext);
    setMessages(prev => [...prev, { role: 'assistant', content: `Parfait, voici votre profil :\n\n${summary}\n\nJe prépare votre sélection...` }]);

    const promptCtx = qualificationToPromptContext(ctx as QualificationContext);
    const pieces = context?.typologies?.join(', ') || 'textile pro';
    const nbPers = context?.nb_personnes ? `${context.nb_personnes} personnes` : '';
    const prompt = `Critères : ${pieces}. ${Object.values(ctx).filter(v => v && typeof v === 'string').join('. ')}. ${nbPers}. Propose directement un mix chiffré.`;

    sendToAssistant(prompt, { ...context, ...promptCtx, metier: ctx.metier });
  };

  // Send message to Claude API
  const sendToAssistant = async (content: string, ctxOverride?: any) => {
    setStreaming(true);
    const apiCtx = ctxOverride || context;
    const apiMessages = [...messages.filter(m => m.content), { role: 'user' as const, content }];

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context: apiCtx }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: err.error || 'Erreur. Réessayez.' }]);
        setStreaming(false);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Voici notre sélection.' }]);
        setStreaming(false);
        return;
      }

      // Streaming SSE
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion. Réessayez.' }]);
    } finally {
      setStreaming(false);
    }
  };

  // Free text send (after qualification)
  const send = async () => {
    if (!input.trim() || streaming) return;
    const content = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content }]);
    sendToAssistant(content);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[500px]">
        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-neutral-900 text-white rounded-br-md'
                : 'bg-neutral-100 text-neutral-800 rounded-bl-md'
            }`}>
              {m.content || (streaming && i === messages.length - 1 ? (
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              ) : '')}
            </div>
          </div>
        ))}

        {/* Alerte norme dure */}
        {alerteVisible && (
          <div className="mx-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            ⚠️ {alerteVisible}
          </div>
        )}

        {/* Qualification buttons */}
        {currentStep && !streaming && (
          <div className="space-y-3">
            <div className="flex justify-start">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-neutral-100 text-neutral-800 text-sm">
                <p className="font-medium">{currentStep.question}</p>
                {currentStep.sous_titre && (
                  <p className="text-xs text-slate-500 mt-1">{currentStep.sous_titre}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-2">
              {currentStep.options.map((opt) => {
                const isMulti = currentStep.type === 'multi';
                const isSelected = isMulti && multiSelection.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (isMulti) {
                        setMultiSelection(prev =>
                          prev.includes(opt.value)
                            ? prev.filter(v => v !== opt.value)
                            : [...prev, opt.value]
                        );
                      } else {
                        handleChoice(currentStep, opt);
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium border rounded-full transition-colors ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    {opt.emoji && <span className="mr-1.5">{opt.emoji}</span>}
                    {opt.label}
                    {opt.sub && <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{opt.sub}</span>}
                  </button>
                );
              })}
            </div>
            {/* Multi-select confirm */}
            {currentStep.type === 'multi' && multiSelection.length > 0 && (
              <button
                onClick={() => handleMultiConfirm(currentStep)}
                className="ml-2 px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded-full hover:bg-neutral-800 transition-colors"
              >
                Valider ({multiSelection.length})
              </button>
            )}
          </div>
        )}

        {/* Bouton devis */}
        {!streaming && extractedRefs.length > 0 && (
          <div className="flex justify-center py-2">
            <Link
              href={`/calculateur?refs=${extractedRefs.join(',')}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Chiffrer cette sélection ({extractedRefs.length} produit{extractedRefs.length > 1 ? 's' : ''})
            </Link>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Free text input (after qualification) */}
      {qualifDone && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ajuster, comparer, demander une alternative..."
            disabled={streaming}
            className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50"
          />
          <MicButton onTranscript={handleMicTranscript} />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-30 transition-colors"
          >
            Envoyer
          </button>
        </div>
      )}
    </div>
  );
}
