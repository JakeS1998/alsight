import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingComplete({ finish, saving }) {
  return <div className="space-y-6">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success"><Check className="h-10 w-10" /></div>
    <div><h1 className="font-heading text-3xl font-bold">You’re ready to go</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Your ALSight workspace is ready. Any connections you set up are saved for future visits.</p></div>
    <p className="text-sm text-muted-foreground">Skipped a connection? You can finish setting it up, or reconnect at any time, in Account Settings.</p>
    <Button className="h-12 w-full" disabled={saving} onClick={finish}>{saving && <Loader2 className="animate-spin" />}Go to ALSight</Button>
  </div>;
}