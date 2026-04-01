'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { MicButton } from './MicButton';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatStepProps {
  context: any;
  initialMessages?: Message[];
}

// Questions de qualification avec boutons
const QUALIFICATION_STEPS = [
  {
    question: 'Quel environnement de travail ?',
    options: [
      { label: '🍽️ Salle / Accueil', value: 'salle et accueil client' },
      { label: '👨‍🍳 Cuisine', value: 'cuisine, lavage 60°C minimum requis' },
      { label: '🏢 Bureau / Corporate', value: 'bureau et environnement corporate' },
      { label: '🏗️ Extérieur / Chantier', value: 'extérieur et chantier' },
      { label: '🔀 Mixte', value: 'environnement mixte intérieur/extérieur' },
    ],
  },
  {
    question: 'Quel style recherchez-vous ?',
    options: [
      { label: 'Casual chic', value: 'style casual chic, élégant mais décontracté' },
      { label: 'Classique / Sobre', value: 'style classique et sobre, professionnel' },
      { label: 'Sportswear', value: 'style sportswear, dynamique et moderne' },
      { label: 'Workwear', value: 'style workwear technique et résistant' },
    ],
  },
  {
    question: 'Répartition de l\'équipe ?',
    options: [
      { label: '👫 Mixte H/F', value: 'équipe mixte hommes et femmes' },
      { label: '👨 Majorité hommes', value: 'équipe majoritairement masculine' },
      { label: '👩 Majorité femmes', value: 'équipe majoritairement féminine' },
      { label: '🧑 Unisexe', value: 'tenues unisexes pour tous' },
    ],
  },
];

export function ChatStep({ context, initialMessages = [] }: ChatStepProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [qualifStep, setQualifStep] = useState(0);
  const [qualifAnswers, setQualifAnswers] = useState<string[]>([]);
  const [qualifDone, setQualifDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, qualifStep]);

  const handleMicTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + ' ' + text : text));
  }, []);

  // Extraire les refs produit des messages assistant
  const extractedRefs = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);
    const allText = assistantMessages.join(' ');
    const refPattern = /\b([A-Z]{1,4}\d{2,5}[A-Z]{0,3})\b/g;
    const matches = allText.match(refPattern) || [];
    const excluded = new Set(['HT', 'TTC', 'TVA', 'ISO', 'HACCP', 'EN', 'EUR', 'PDF']);
    return Array.from(new Set(matches)).filter(r => !excluded.has(r) && r.length >= 3);
  }, [messages]);

  const handleQualifChoice = (option: { label: string; value: string }) => {
    const newAnswers = [...qualifAnswers, option.value];
    setQualifAnswers(newAnswers);

    // Ajouter comme message utilisateur (visible dans le chat)
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: option.label },
    ]);

    if (qualifStep < QUALIFICATION_STEPS.length - 1) {
      setQualifStep(qualifStep + 1);
    } else {
      // Toutes les questions répondues → envoyer à Claude
      setQualifDone(true);
      const qualifContext = newAnswers.join('. ');
      const initialPrompt = `Voici mes critères : ${context.typologies?.join(', ') || 'textile pro'}. ${qualifContext}. Propose-moi un mix adapté pour ${context.nb_personnes || 'mon équipe'} personnes.`;
      sendToAssistant(initialPrompt);
    }
  };

  const sendToAssistant = async (content: string) => {
    const userMsg: Message = { role: 'user', content };
    // N'ajouter au chat que si c'est pas le prompt initial (déjà les boutons)
    const newMessages = qualifDone && messages.length > 0 && messages[messages.length - 1].content !== content
      ? [...messages, userMsg]
      : [...messages];

    // Pour le premier envoi auto, on n'affiche pas le prompt technique
    const apiMessages = [...newMessages.filter(m => m.role === 'user' || m.role === 'assistant'), { role: 'user' as const, content }];

    setMessages(newMessages);
    setStreaming(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages([...newMessages, { role: 'assistant', content: err.error || 'Erreur. Réessayez.' }]);
        setStreaming(false);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const fallbackText = data.message || 'Voici notre sélection basée sur vos critères.';
        setMessages([...newMessages, { role: 'assistant', content: fallbackText }]);
        setStreaming(false);
        return;
      }

      // Streaming SSE
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Erreur de connexion. Réessayez.' }]);
    } finally {
      setStreaming(false);
    }
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    const content = input.trim();
    setInput('');
    const userMsg: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    try {
      const allMsgs = [...messages, userMsg];
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMsgs, context }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages([...allMsgs, { role: 'assistant', content: err.error || 'Erreur. Réessayez.' }]);
        setStreaming(false);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        setMessages([...allMsgs, { role: 'assistant', content: data.message || 'Voici notre sélection.' }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      setMessages([...allMsgs, { role: 'assistant', content: '' }]);

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
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erreur de connexion. Réessayez.' }]);
    } finally {
      setStreaming(false);
    }
  };

  const currentQuestion = !qualifDone ? QUALIFICATION_STEPS[qualifStep] : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[500px]">
        {messages.length === 0 && !currentQuestion && (
          <p className="text-sm text-neutral-400 text-center py-8">
            Posez une question pour affiner votre recherche
          </p>
        )}

        {/* Messages du chat */}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-neutral-900 text-white rounded-br-md'
                  : 'bg-neutral-100 text-neutral-800 rounded-bl-md'
              }`}
            >
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

        {/* Boutons de qualification */}
        {currentQuestion && !streaming && (
          <div className="space-y-3">
            <div className="flex justify-start">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-neutral-100 text-neutral-800 text-sm">
                {currentQuestion.question}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-2">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleQualifChoice(opt)}
                  className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-full hover:border-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
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

      {/* Input libre (disponible après qualification ou à tout moment) */}
      {qualifDone && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ajuster, préciser, demander une alternative..."
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
