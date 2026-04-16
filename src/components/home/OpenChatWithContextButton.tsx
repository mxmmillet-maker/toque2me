'use client';

import { openChat, type ChatPrefillContext } from '@/components/agent/ChatBubble';

interface Props extends ChatPrefillContext {
  label?: string;
  variant?: 'dark' | 'light';
  className?: string;
}

export function OpenChatWithContextButton({ label = 'Configurer mon pack', variant = 'dark', className, ...prefill }: Props) {
  const base = 'px-8 py-3.5 text-sm font-medium rounded-lg transition-colors';
  const colors = variant === 'light'
    ? 'bg-white text-neutral-900 hover:bg-neutral-100'
    : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm';

  return (
    <button
      onClick={() => openChat(prefill)}
      className={`${base} ${colors} ${className || ''}`}
    >
      {label}
    </button>
  );
}
