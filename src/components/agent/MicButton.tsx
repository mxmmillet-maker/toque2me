'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface MicButtonProps {
  onTranscript: (text: string) => void;
}

export function MicButton({ onTranscript }: MicButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        setInterim(interimText);

        if (finalText) {
          onTranscript(finalText);
          stop();
        }

        // Reset silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => stop(), 8000);
      };

      recognition.onerror = () => stop();
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim('');
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  const toggle = () => {
    if (listening) {
      stop();
    } else {
      setListening(true);
      setInterim('');
      recognitionRef.current?.start();
      // Timeout 8s silence
      silenceTimerRef.current = setTimeout(() => stop(), 8000);
    }
  };

  if (!supported) return null;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={`p-2.5 rounded-xl transition-all ${
          listening
            ? 'bg-red-50 text-red-600 ring-2 ring-red-200'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
        aria-label={listening ? 'Arrêter l\'écoute' : 'Dicter'}
      >
        {listening ? (
          // Animated waves
          <div className="flex items-center gap-0.5 w-5 h-5 justify-center">
            <span className="w-0.5 bg-red-500 rounded-full animate-pulse h-3" />
            <span className="w-0.5 bg-red-500 rounded-full animate-pulse h-4 [animation-delay:150ms]" />
            <span className="w-0.5 bg-red-500 rounded-full animate-pulse h-2 [animation-delay:300ms]" />
            <span className="w-0.5 bg-red-500 rounded-full animate-pulse h-5 [animation-delay:100ms]" />
            <span className="w-0.5 bg-red-500 rounded-full animate-pulse h-3 [animation-delay:250ms]" />
          </div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Interim transcript */}
      {listening && interim && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap max-w-64 truncate">
          {interim}
        </div>
      )}
    </div>
  );
}
