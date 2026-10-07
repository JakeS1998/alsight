import React from 'react';
import PulseForm from '@/components/alliance/PulseForm';

export default function PulseComposer({user,onSaved,groupId='',groupName='',groupActions}) {
  const name=user.full_name?.trim() || 'Alliance colleague';
  const initials=name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  return <section aria-label="Share an Alliance update" className="rounded-panel border border-border bg-card p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-foreground">{initials}</span><div className="min-w-0"><h2 className="text-sm font-bold">{name}</h2><p className="mt-1 break-words text-xs text-muted-foreground">{groupId ? groupName : 'Alliance Insider · Alliance colleagues'}</p></div></div>{groupActions}</div>
    <PulseForm key={groupId || 'all-alliance'} groupId={groupId} onSaved={onSaved}/>
  </section>;
}