import React from 'react';
import {PenLine} from 'lucide-react';

export default function PulseComposer({user,onAdd}) {
  const name=user.full_name?.trim() || 'Alliance colleague';
  const initials=name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  return <section aria-label="Share an Alliance update" className="rounded-panel border border-border bg-card p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-foreground">{initials}</span>
      <button type="button" onClick={onAdd} className="min-w-0 flex-1 rounded-full border border-border bg-muted px-5 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary">Share an update with Alliance…</button>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      <p className="text-xs text-muted-foreground">A team moment, project milestone or something we’ve learned.</p>
      <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:underline"><PenLine className="h-4 w-4 text-primary"/>Create a post</button>
    </div>
  </section>;
}