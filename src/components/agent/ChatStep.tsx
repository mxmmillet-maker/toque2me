'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
