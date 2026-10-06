import React from 'react';

const tones = {
  complete: 'border-success bg-success text-sidebar-foreground',
  in_progress: 'border-primary bg-primary text-primary-foreground',
  pending: 'border-muted-foreground bg-card text-muted-foreground',
  empty: 'border-border bg-card text-muted-foreground',
};

export default function DocumentStageMarker({ icon: Icon, status, last }) {
  return <>
    {!last && <span aria-hidden="true" className="absolute bottom-[-24px] left-4 top-8 w-0.5 -translate-x-1/2 bg-border" />}
    <span aria-hidden="true" className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${tones[status] || tones.empty}`}>
      <Icon className="h-4 w-4" />
    </span>
  </>;
}