import React from 'react';
import { CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingConnectionStep({ title, description, connected, loading, error, connect, next, saving, note }) {
  return <div className="space-y-6">
    <div><h1 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
    <div className="rounded-panel bg-muted p-5 text-sm">
      {loading ? <p role="status" className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Checking your connection…</p> : connected ? <p role="status" className="flex items-center justify-center gap-2 font-medium text-success"><CheckCircle2 className="h-5 w-5" />Your account is connected</p> : <p className="flex items-start gap-3 text-left text-muted-foreground"><Info className="h-5 w-5 shrink-0 text-primary" />{note || 'Microsoft will securely ask you to approve access. Your existing work sign-in may be recognised; ALSight never sees your Microsoft password.'}</p>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button className="h-12 w-full" disabled={loading || saving} onClick={connected ? next : connect}>{saving && <Loader2 className="animate-spin" />}{connected ? 'Continue' : 'Connect Microsoft account'}</Button>
    {!connected && <Button variant="link" className="text-muted-foreground" disabled={loading || saving} onClick={next}>Set up later</Button>}
  </div>;
}