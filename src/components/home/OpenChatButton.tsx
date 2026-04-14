'use client';

import { openChat } from '@/components/agent/ChatBubble';

export function OpenChatButton() {
  return (
    <button
      onClick={() => openChat()}
      className="px-8 py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
    >
      Configurer mon pack
    </button>
  );
}
