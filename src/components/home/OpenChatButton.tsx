'use client';

import { openChat } from '@/components/agent/ChatBubble';

export function OpenChatButton() {
  return (
    <button
      onClick={() => openChat()}
      className="px-8 py-3.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm border border-neutral-800"
    >
      Configurer mon pack — 30s
    </button>
  );
}
