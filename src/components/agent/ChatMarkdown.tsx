'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 -mx-1">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-neutral-200/60">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-2 py-1.5 text-left font-semibold border-b border-neutral-300 whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1.5 border-b border-neutral-200 whitespace-nowrap">
            {children}
          </td>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
