import React from 'react';
import { Mail, UserRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingDetails({ user, next, saving }) {
  return <div className="space-y-6">
    <div><h1 className="font-heading text-2xl font-bold sm:text-3xl">Let’s check your details</h1><p className="mt-3 text-sm text-muted-foreground">These are the details linked to your ALSight account.</p></div>
    <dl className="space-y-3 text-left">
      {[{ label: 'Name', value: user?.full_name || 'Not provided', Icon: UserRound }, { label: 'Email', value: user?.email, Icon: Mail }].map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-4 rounded-lg bg-muted p-4"><Icon className="h-5 w-5 shrink-0 text-muted-foreground" /><div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd></div></div>)}
    </dl>
    <Button className="h-12 w-full" disabled={saving} onClick={next}>{saving && <Loader2 className="animate-spin" />}Everything looks right</Button>
    <p className="text-xs text-muted-foreground">Something isn’t right? Contact your ALSight administrator using “Need help?” below.</p>
  </div>;
}