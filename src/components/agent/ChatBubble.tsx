'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatStep, type ChatStepHandle } from './ChatStep';

// Event system pour piloter le chat depuis l'extérieur (HP, nav, etc.)
const OPEN_EVENT = 'toque2me:chat:open';
const CLOSE_EVENT = 'toque2me:chat:close';

export function openChat() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function closeChat() {
  window.dispatchEvent(new Event(CLOSE_EVENT));
}

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);

  useEffect(() => {
    const handleOpen = () => { setOpen(true); setShowTeaser(false); setTeaserDismissed(true); };
    const handleClose = () => setOpen(false);
    window.addEventListener(OPEN_EVENT, handleOpen);
    window.addEventListener(CLOSE_EVENT, handleClose);

    // Teaser : afficher après 4s, seulement 1 fois par session
    const alreadyShown = sessionStorage.getItem('toque2me_teaser_shown');
    if (!alreadyShown) {
      const timer = setTimeout(() => {
        setShowTeaser(true);
        sessionStorage.setItem('toque2me_teaser_shown', '1');
      }, 4000);
      return () => { clearTimeout(timer); window.removeEventListener(OPEN_EVENT, handleOpen); window.removeEventListener(CLOSE_EVENT, handleClose); };
    }

    return () => {
      window.removeEventListener(OPEN_EVENT, handleOpen);
      window.removeEventListener(CLOSE_EVENT, handleClose);
    };
  }, []);

  const chatRef = useRef<ChatStepHandle>(null);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleReset = useCallback(() => { chatRef.current?.reset(); }, []);

  const dismissTeaser = () => { setShowTeaser(false); setTeaserDismissed(true); };

  return (
    <>
      {/* Teaser message */}
      {showTeaser && !open && !teaserDismissed && (
        <div className="fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg px-4 py-3 max-w-[260px] relative">
            <button
              onClick={dismissTeaser}
              className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-200 text-neutral-500 rounded-full flex items-center justify-center text-xs hover:bg-neutral-300"
            >
              x
            </button>
            <p className="text-sm font-medium text-neutral-900 mb-1">Besoin d'aide pour choisir ?</p>
            <p className="text-xs text-neutral-500 mb-2">Répondez à 4 questions, recevez votre sélection en 30 secondes.</p>
            <button
              onClick={() => { setShowTeaser(false); setTeaserDismissed(true); setOpen(true); }}
              className="text-xs font-medium text-neutral-900 underline underline-offset-2"
            >
              C'est parti
            </button>
            {/* Triangle pointer */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-neutral-200 rotate-45" />
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => { setOpen(!open); setShowTeaser(false); setTeaserDismissed(true); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition-all flex items-center justify-center"
        aria-label="Assistant Toque2Me"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-50 sm:w-[380px] h-[70vh] sm:h-[500px] bg-white border border-neutral-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 flex-shrink-0 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Assistant Toque2Me</h3>
              <p className="text-xs text-neutral-400">Textile & objets personnalisés</p>
            </div>
            <button
              onClick={handleReset}
              className="text-[10px] text-neutral-400 hover:text-neutral-900 px-2 py-1 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
              title="Nouvelle recherche"
            >
              Nouvelle recherche
            </button>
          </div>
          <div className="flex-1 px-4 py-4 overflow-hidden">
            <ChatStep ref={chatRef} context={{}} onRequestClose={handleClose} />
          </div>
        </div>
      )}
    </>
  );
}
