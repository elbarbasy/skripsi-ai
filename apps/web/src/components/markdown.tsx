'use client';

import ReactMarkdown from 'react-markdown';

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-academic max-w-none text-sm leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
