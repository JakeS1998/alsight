import React from 'react';
export default function PageDataAccessNotice({title}) {
 return <section className="space-y-3 rounded-panel border border-border bg-card p-6">
  <h1 className="font-heading text-2xl font-semibold">{title}</h1>
  <p className="text-sm text-muted-foreground">Page access is enabled, but your existing role does not permit access to this page’s data. Page settings do not change data permissions.</p>
 </section>;
}