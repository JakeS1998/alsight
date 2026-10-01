import React from 'react';
import frameworkVersion from '@/components/projects/frameworkVersion';

export default function FrameworkVersionBadge({ projectNumber }) {
  const version = frameworkVersion(projectNumber);
  if (!version) return null;
  return <span aria-label={`Framework ${version}`} className="inline-flex shrink-0 items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">{version}</span>;
}