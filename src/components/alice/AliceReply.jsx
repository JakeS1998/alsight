import React from 'react';
import ReactMarkdown from 'react-markdown';
import AliceRecordLink from '@/components/alice/AliceRecordLink';

const markdownComponents = {
  a: AliceRecordLink,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
  h1: ({ children }) => <h3 className="mb-2 font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 font-semibold">{children}</h3>,
  h3: ({ children }) => <h3 className="mb-2 font-semibold">{children}</h3>,
};
const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
const divider = line => cells(line).every(cell => /^:?-{3,}:?$/.test(cell));
const inline = { p: ({ children }) => <>{children}</>, a: AliceRecordLink };

export default function AliceReply({ content }) {
  const lines = String(content || '').split(/\r?\n/);
  const parts = [];
  let start = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|') || !lines[i + 1].trim().startsWith('|') || !divider(lines[i + 1])) continue;
    if (i > start) parts.push(<ReactMarkdown key={`text-${start}`} components={markdownComponents}>{lines.slice(start, i).join('\n')}</ReactMarkdown>);
    const headers = cells(lines[i]);
    let end = i + 2;
    while (end < lines.length && lines[end].trim().startsWith('|')) end++;
    parts.push(<div key={`table-${i}`} className="my-3 overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[360px] text-left text-xs">
        <thead className="bg-muted"><tr>{headers.map((header, index) => <th key={index} className="border-b border-border px-2 py-2 font-semibold"><ReactMarkdown components={inline}>{header}</ReactMarkdown></th>)}</tr></thead>
        <tbody>{lines.slice(i + 2, end).map((row, rowIndex) => <tr key={rowIndex} className="border-b border-border last:border-0">{cells(row).map((cell, index) => <td key={index} className="px-2 py-2 align-top"><ReactMarkdown components={inline}>{cell}</ReactMarkdown></td>)}</tr>)}</tbody>
      </table>
    </div>);
    i = end - 1;
    start = end;
  }
  if (start < lines.length) parts.push(<ReactMarkdown key={`text-${start}`} components={markdownComponents}>{lines.slice(start).join('\n')}</ReactMarkdown>);
  return <div className="min-w-0 break-words leading-relaxed">{parts}</div>;
}