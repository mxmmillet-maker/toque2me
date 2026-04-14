'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatStep } from './ChatStep';

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

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    window.addEventListener(OPEN_EVENT, handleOpen);
    window.addEventListener(CLOSE_EVENT, handleClose);
    return () => {
      window.removeEventListener(OPEN_EVENT, handleOpen);
      window.removeEventListener(CLOSE_EVENT, handleClose);
    };
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Bubble button */}
      <button
        onClick={() => setOpen(!open)}
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
          <div className="px-5 py-4 border-b border-neutral-100 flex-shrink-0">
            <h3 className="text-sm font-semibold text-neutral-900">Assistant Toque2Me</h3>
            <p className="text-xs text-neutral-400">Textile & objets personnalisés</p>
          </div>
          <div className="flex-1 px-4 py-4 overflow-hidden">
            <ChatStep context={{}} onRequestClose={handleClose} />
          </div>
        </div>
      )}
    </>
  );
}
