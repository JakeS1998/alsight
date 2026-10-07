import React from 'react';
import PulseForm from '@/components/alliance/PulseForm';

export default function PulseComposer({user,onSaved,groupId=''}) {
  const name=user.full_name?.trim() || 'Alliance colleague';
  const initials=name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  return <section aria-label="Share an Alliance update" className="rounded-panel border border-border bg-card p-5 shadow-sm">
    <div className="flex items-center gap-3"><span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-foreground">{initials}</span><div><h2 className="text-sm font-bold">{name}</h2><p className="mt-1 text-xs text-muted-foreground">{groupId ? 'Private group · Members only' : 'Alliance Insider · Alliance colleagues'}</p></div></div>
    <PulseForm key={groupId || 'all-alliance'} groupId={groupId} onSaved={onSaved}/>
  </section>;
}