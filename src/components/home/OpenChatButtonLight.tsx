'use client';

import { openChat } from '@/components/agent/ChatBubble';

export function OpenChatButtonLight() {
  return (
    <button
      onClick={() => openChat()}
      className="px-8 py-3.5 bg-white text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors"
    >
      Configurer mon pack — 30s
    </button>
  );
}
