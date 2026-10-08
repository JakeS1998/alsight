import React from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingWelcome({ next, saving }) {
  return <div className="space-y-7">
    <div><h1 className="font-heading text-3xl font-bold">Welcome to ALSight</h1><p className="mt-4 text-sm leading-relaxed text-muted-foreground">You’re signed in. Let’s get your workspace ready in a few simple steps.</p></div>
    <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />This should take just a few minutes.</p>
    <Button className="h-12 w-full" disabled={saving} onClick={next}>{saving && <Loader2 className="animate-spin" />}Let’s get started</Button>
  </div>;
}