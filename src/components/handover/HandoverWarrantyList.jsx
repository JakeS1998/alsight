import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function HandoverWarrantyList({ item }) {
  const [error, setError] = useState('');
  const open = async warranty => {
    setError('');
    try {
      const url = warranty.file_uri ? (await base44.integrations.Core.CreateFileSignedUrl({ file_uri: warranty.file_uri })).signed_url : warranty.link;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) { setError(err.message); }
  };
  return <div className="space-y-3 rounded-lg border border-border p-3">
    <h3 className="text-sm font-semibold">Linked project warranties</h3>
    <p className="text-xs text-muted-foreground">{item.completed_warranty_count} of {item.warranty_count} completed. This list comes only from this project’s active linked warranties. Sent for seal is not yet sealed.</p>
    {!item.linked_warranties?.length && <p className="text-sm text-muted-foreground">No active warranties linked to this project.</p>}
    <div className="max-h-[60vh] space-y-2 overflow-y-auto">{item.linked_warranties?.map(warranty => <div key={warranty.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-xs ${warranty.completed ? 'border-success/25 bg-success/5' : 'border-border bg-card'}`}>
      <div>{warranty.link || warranty.file_uri ? <button type="button" onClick={() => open(warranty)} className="text-foreground underline">{warranty.name}</button> : <span>{warranty.name}</span>}<p className="text-muted-foreground">{warranty.services || 'Services not recorded'}{!warranty.link && !warranty.file_uri && ' · No document link recorded'}</p></div>
      <span className={`capitalize ${warranty.completed ? 'text-success' : 'text-muted-foreground'}`}>{warranty.completionLabel}</span>
    </div>)}</div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}