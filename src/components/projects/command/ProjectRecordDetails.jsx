import React from 'react';
export default function ProjectRecordDetails({internal,children}) {
  if(!internal)return children;
  return <details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer text-sm font-semibold">Project record &amp; editing</summary><p className="mt-2 text-xs text-muted-foreground">All existing programme fields, assignments, links and editing controls.</p><div className="mt-5">{children}</div></details>;
}