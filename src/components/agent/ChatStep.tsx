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

export function ChatStep({ context, initialMessages = [] }: ChatStepProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMicTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + ' ' + text : text));
  }, []);

  // Extraire les refs produit des messages de l'assistant
  const extractedRefs = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);
    const allText = assistantMessages.join(' ');
    // Patterns : "Réf. K5002", "| K750 |", "(Réf. NS6006)"
    const refPattern = /\b([A-Z]{1,4}\d{2,5}[A-Z]{0,3})\b/g;
    const matches = allText.match(refPattern) || [];
    // Dédupliquer et filtrer les faux positifs (mots courants, montants)
    const excluded = new Set(['HT', 'TTC', 'TVA', 'ISO', 'HACCP', 'EN', 'EUR', 'PDF']);
    const unique = Array.from(new Set(matches)).filter(r => !excluded.has(r) && r.length >= 3);
    return unique;
  }, [messages]);

  const send = async () => {
    if (!input.trim() || streaming) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages([...newMessages, { role: 'assistant', content: err.error || 'Erreur. Réessayez.' }]);
        setStreaming(false);
        return;
      }

      // Fallback (non-streaming)
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
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Erreur de connexion. Réessayez.' }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-8">
            Posez une question pour affiner votre recherche
          </p>
        )}
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
        {/* Bouton devis si des refs sont détectées */}
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

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ex: je cherche un polo résistant pour mon restaurant..."
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
    </div>
  );
}
