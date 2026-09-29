import React from 'react';
import { Sparkles } from 'lucide-react';
import { GUIDES } from '@/components/alice/aliceGuides';

export default function AliceWelcome({ role, disabled, onStart }) {
  return <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-8 text-center sm:px-8">
    <Sparkles aria-hidden="true" className="mb-5 h-10 w-10 text-assistant" strokeWidth={1.8} />
    <h2 className="font-heading text-lg font-semibold text-foreground">Ask me anything about your projects</h2>
    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">I can help with the projects you have access to and guide you through updating records.</p>
    <div className="mt-7 grid w-full gap-2.5 text-left">
      {Object.entries(GUIDES).filter(([, item]) => item.roles.includes(role)).map(([type, item]) => <button key={type} type="button" onClick={() => onStart(type)} disabled={disabled} className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-assistant hover:bg-muted disabled:opacity-50">{item.label}</button>)}
    </div>
  </div>;
}