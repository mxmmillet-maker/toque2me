'use client';

import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import { MicButton } from './MicButton';
import { ChatMarkdown } from './ChatMarkdown';
import { useCart } from '@/lib/cart';
import {
  buildSteps,
  qualificationToPromptContext,
  buildQualificationSummary,
  getTypologyOptions,
  type QualificationContext,
  type QualificationStep,
  type PieceConfig,
} from '@/lib/agent/qualification-steps';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatStepProps {
  context: any;
  initialMessages?: Message[];
  onRequestClose?: () => void;
}

const SESSION_KEY = 'toque2me_chat_state';

function loadChatState(): { messages: Message[]; qualifCtx: Partial<QualificationContext>; stepIndex: number; qualifDone: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveChatState(messages: Message[], qualifCtx: Partial<QualificationContext>, stepIndex: number, qualifDone: boolean) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ messages, qualifCtx, stepIndex, qualifDone }));
  } catch { /* quota exceeded */ }
}

export interface ChatStepHandle {
  reset: () => void;
}

export const ChatStep = forwardRef<ChatStepHandle, ChatStepProps>(function ChatStep({ context, initialMessages = [], onRequestClose }, ref) {
  // Restore from cache
  const cached = typeof window !== 'undefined' ? loadChatState() : null;

  const [messages, setMessages] = useState<Message[]>(cached?.messages || initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Qualification state — restored from cache
  const [qualifCtx, setQualifCtx] = useState<Partial<QualificationContext>>(cached?.qualifCtx || {});
  const steps = useMemo(() => buildSteps(qualifCtx), [qualifCtx]);
  const [stepIndex, setStepIndex] = useState(cached?.stepIndex || 0);
  const [qualifDone, setQualifDone] = useState(cached?.qualifDone || false);
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [briefText, setBriefText] = useState('');
  const [alerteVisible, setAlerteVisible] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const { add: addToCart } = useCart();

  // Reset function
  const resetChat = useCallback(() => {
    setMessages([]);
    setQualifCtx({});
    setStepIndex(0);
    setQualifDone(false);
    setMultiSelection([]);
    setBriefText('');
    setInput('');
    setAddedToCart(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  useImperativeHandle(ref, () => ({ reset: resetChat }), [resetChat]);

  // Persist state on changes
  useEffect(() => {
    saveChatState(messages, qualifCtx, stepIndex, qualifDone);
  }, [messages, qualifCtx, stepIndex, qualifDone]);

  const questionRef = useRef<HTMLDivElement>(null);

  // Scroll: show the question + buttons, aligned to bottom unless content is taller than container
  useEffect(() => {
    if (!chatContainerRef.current) return;
    // Small delay to let DOM render
    requestAnimationFrame(() => {
      if (!chatContainerRef.current || !questionRef.current) {
        // No question visible (qualifDone) → scroll to bottom for messages
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
        return;
      }
      const container = chatContainerRef.current;
      const question = questionRef.current;
      const containerHeight = container.clientHeight;
      const questionTop = question.offsetTop;
      const questionHeight = question.scrollHeight;

      if (questionHeight > containerHeight) {
        // Question + buttons taller than container → align top
        container.scrollTop = questionTop;
      } else {
        // Scroll so question + buttons are at the bottom of the visible area
        container.scrollTop = questionTop + questionHeight - containerHeight;
      }
    });
  }, [stepIndex, messages.length, alerteVisible]);

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

  // Current step — skip steps whose condition is not met
  const currentStep: QualificationStep | null = useMemo(() => {
    if (qualifDone) return null;
    for (let i = stepIndex; i < steps.length; i++) {
      const step = steps[i];
      if (!step.condition || step.condition(qualifCtx)) {
        if (i !== stepIndex) setStepIndex(i);
        return step;
      }
    }
    return null;
  }, [stepIndex, qualifCtx, qualifDone, steps]);

  // Options effectives du step courant (dynamiques pour typologies)
  const currentOptions = useMemo(() => {
    if (!currentStep) return [];
    if (currentStep.id === 'typologies') return getTypologyOptions(qualifCtx);
    return currentStep.options;
  }, [currentStep?.id, qualifCtx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preselect options on multi-select steps
  useEffect(() => {
    if (currentStep?.type === 'multi' && currentStep.preselect) {
      const preselected = currentStep.preselect(qualifCtx);
      if (preselected.length > 0) {
        setMultiSelection(preselected);
      }
    }
  }, [currentStep?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to next step (shared logic)
  const goToNext = (step: QualificationStep, value: string | string[], newCtx: Partial<QualificationContext>) => {
    // If step has explicit next(), use it
    if (step.next) {
      const nextId = step.next(value, newCtx);
      if (nextId === null) {
        finishQualification(newCtx);
        return;
      }
      // Rebuild steps with new context to find dynamic steps
      const newSteps = buildSteps(newCtx);
      const nextIdx = newSteps.findIndex(s => s.id === nextId);
      if (nextIdx !== -1) {
        setStepIndex(nextIdx);
        return;
      }
    }

    // Rebuild steps to include any newly generated per-piece steps
    const newSteps = buildSteps(newCtx);
    const currentIdx = newSteps.findIndex(s => s.id === step.id);

    for (let i = (currentIdx >= 0 ? currentIdx : stepIndex) + 1; i < newSteps.length; i++) {
      if (!newSteps[i].condition || newSteps[i].condition!(newCtx)) {
        setStepIndex(i);
        return;
      }
    }
    finishQualification(newCtx);
  };

  // Map step IDs to context fields
  const mapStepToCtx = (stepId: string, value: string | string[]): Partial<QualificationContext> => {
    // Étapes style par pièce : style_T-shirts, style_Polos, etc.
    if (stepId.startsWith('style_')) {
      const typo = stepId.replace('style_', '');
      const existing = qualifCtx.pieces_config || [];
      const pieceIdx = existing.findIndex(p => p.typology === typo);
      const piece: PieceConfig = pieceIdx >= 0 ? { ...existing[pieceIdx], style: value as string } : { typology: typo, style: value as string };
      const updated = pieceIdx >= 0 ? [...existing.slice(0, pieceIdx), piece, ...existing.slice(pieceIdx + 1)] : [...existing, piece];
      return { pieces_config: updated };
    }

    // Étapes couleur par pièce : couleur_T-shirts, couleur_Polos, etc.
    if (stepId.startsWith('couleur_')) {
      const typo = stepId.replace('couleur_', '');
      const existing = qualifCtx.pieces_config || [];
      const pieceIdx = existing.findIndex(p => p.typology === typo);
      const piece: PieceConfig = pieceIdx >= 0 ? { ...existing[pieceIdx], couleurs: value as string[] } : { typology: typo, couleurs: value as string[] };
      const updated = pieceIdx >= 0 ? [...existing.slice(0, pieceIdx), piece, ...existing.slice(pieceIdx + 1)] : [...existing, piece];
      return { pieces_config: updated };
    }

    return { [stepId]: value };
  };

  // Handle single choice
  const handleChoice = (step: QualificationStep, option: { value: string; label: string; alerte?: string }) => {
    if (option.alerte) {
      setAlerteVisible(option.alerte);
      setTimeout(() => setAlerteVisible(null), 3000);
    }

    setMessages(prev => [...prev, { role: 'user', content: option.label }]);

    const mapped = mapStepToCtx(step.id, option.value);
    const newCtx = { ...qualifCtx, ...mapped };
    setQualifCtx(newCtx);

    goToNext(step, option.value, newCtx);
  };

  // Handle multi-select confirm
  const handleMultiConfirm = (step: QualificationStep) => {
    setMessages(prev => [...prev, { role: 'user', content: multiSelection.join(', ') }]);

    const mapped = mapStepToCtx(step.id, multiSelection);
    const newCtx = { ...qualifCtx, ...mapped };
    setQualifCtx(newCtx);
    setMultiSelection([]);

    goToNext(step, multiSelection, newCtx);
  };

  // Finish qualification → send to Claude
  const finishQualification = (ctx: Partial<QualificationContext>) => {
    setQualifDone(true);
    const summary = buildQualificationSummary(ctx as QualificationContext);
    setMessages(prev => [...prev, { role: 'assistant', content: `Parfait, voici votre profil :\n\n${summary}\n\nJe prépare votre sélection...` }]);

    const promptCtx = qualificationToPromptContext(ctx as QualificationContext);
    const nbPers = context?.nb_personnes ? `${context.nb_personnes} personnes` : '';

    // Si brief libre, envoyer le brief directement
    if (ctx.brief_text) {
      const prompt = `Brief client : "${ctx.brief_text}". ${nbPers}. Analyse le besoin et propose directement un mix chiffré.`;
      sendToAssistant(prompt, { ...context, ...promptCtx });
      return;
    }

    // Sinon construire le prompt depuis les pièces configurées
    const piecesDesc = (ctx.pieces_config || []).map(pc => {
      const parts = [pc.typology];
      if (pc.style) parts.push(pc.style);
      if (pc.couleurs?.length) parts.push(pc.couleurs.join('/'));
      return parts.join(' ');
    }).join(', ') || ctx.typologies?.join(', ') || 'textile pro';

    const marquage = ctx.marquage && ctx.marquage !== 'neutre' ? `Marquage : ${ctx.marquage}.` : 'Sans marquage.';
    const coupe = ctx.coupe ? `Coupe : ${ctx.coupe}.` : '';
    const prompt = `Pièces : ${piecesDesc}. ${coupe} ${marquage} ${nbPers}. Propose directement un mix chiffré.`;

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
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pb-2 max-h-[500px]">
        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-neutral-900 text-white rounded-br-md whitespace-pre-wrap'
                : 'bg-neutral-100 text-neutral-800 rounded-bl-md'
            }`}>
              {m.content ? (
                m.role === 'assistant' ? (
                  <ChatMarkdown content={m.content} />
                ) : (
                  m.content
                )
              ) : (streaming && i === messages.length - 1 ? (
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

        {/* Qualification */}
        {currentStep && !streaming && (
          <div ref={questionRef} className="space-y-3">
            <div className="flex justify-start">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-neutral-100 text-neutral-800 text-sm">
                <p className="font-medium">{currentStep.question}</p>
                {currentStep.sous_titre && (
                  <p className="text-xs text-slate-500 mt-1">{currentStep.sous_titre}</p>
                )}
              </div>
            </div>

            {/* Brief textarea */}
            {currentStep.type === 'brief' && (
              <div className="pl-2">
                <textarea
                  value={briefText}
                  onChange={(e) => setBriefText(e.target.value)}
                  placeholder="On ouvre un restaurant et il faut habiller 15 personnes..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                />
              </div>
            )}

            {/* Boutons single/multi */}
            {currentStep.type !== 'brief' && (
              <div className="flex flex-wrap gap-2 pl-2">
                {currentOptions.map((opt) => {
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
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Zone sticky bottom : boutons toujours visibles au-dessus du clavier ── */}
      <div className="flex-shrink-0 border-t border-neutral-100 pt-2 space-y-2 bg-white">
        {/* Bouton validation multi-select */}
        {currentStep?.type === 'multi' && multiSelection.length > 0 && !streaming && (
          <button
            onClick={() => handleMultiConfirm(currentStep)}
            className="w-full px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Valider ({multiSelection.length} sélectionné{multiSelection.length > 1 ? 's' : ''})
          </button>
        )}

        {/* Bouton envoi brief */}
        {currentStep?.type === 'brief' && !streaming && (
          <button
            onClick={() => {
              if (!briefText.trim()) return;
              setMessages(prev => [...prev, { role: 'user', content: briefText.trim() }]);
              const newCtx = { ...qualifCtx, brief_text: briefText.trim(), approche: 'guide' as string };
              setQualifCtx(newCtx);
              finishQualification(newCtx);
            }}
            disabled={!briefText.trim()}
            className="w-full px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-30 transition-colors"
          >
            Envoyer
          </button>
        )}

        {/* Actions sélection */}
        {!streaming && extractedRefs.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                for (const ref of extractedRefs) {
                  addToCart({ ref, nom: ref, qty: 10 });
                }
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 2500);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors shadow-sm ${
                addedToCart
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {addedToCart ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Ajouté
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Ajouter au panier ({extractedRefs.length})
                </>
              )}
            </button>
            <Link
              href="/panier"
              onClick={() => {
                if (onRequestClose && window.innerWidth < 640) onRequestClose();
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              Voir le panier
            </Link>
          </div>
        )}

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
    </div>
  );
});
