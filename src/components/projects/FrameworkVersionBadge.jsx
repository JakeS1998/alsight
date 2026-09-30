import React from 'react';

export default function FrameworkVersionBadge({ projectNumber }) {
  const match = /^(?:PROJ\s*)?(\d+)$/i.exec(String(projectNumber || '').trim());
  if (!match) return null;
  const version = Number(match[1]) < 1000 ? 'FW3' : 'FW4';
  return <span aria-label={`Framework ${version}`} className="inline-flex shrink-0 items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">{version}</span>;
}