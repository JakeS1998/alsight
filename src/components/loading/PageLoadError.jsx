import React from 'react';
import { RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageLoadError({ onRetry }) {
  return <section role="alert" className="mx-auto my-10 w-full max-w-xl rounded-panel border border-border bg-card p-6 text-center shadow-sm sm:my-16 sm:p-10">
    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-panel bg-primary/10 text-foreground"><MessageCircle className="h-6 w-6" aria-hidden="true" /></div>
    <h2 className="font-heading text-xl font-bold text-foreground">Let's give that another go</h2>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Sorry, we couldn't open this page just now. Try again when you're ready, or use the menu to head somewhere else.</p>
    <Button type="button" onClick={onRetry} className="mt-6"><RefreshCw className="h-4 w-4" aria-hidden="true" />Retry</Button>
  </section>;
}