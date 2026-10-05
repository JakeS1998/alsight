import React from 'react';
import { formatDate, formatCurrency } from '@/lib/portal';
export default function AccountRelationshipSummary({ account, signals, loading, error }) {
  return <section className="account-panel account-relationship-summary">
    <h2>About & Relationship</h2>
    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{account.relationship_summary || account.comments || 'No relationship summary has been recorded.'}</p>
    {account.relationship_summary && account.comments && account.relationship_summary.trim() !== account.comments.trim() && <><h3>Existing account notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{account.comments}</p></>}
    {loading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading account totals…</p> : error ? <p role="alert" className="mt-4 text-sm text-destructive">Account totals are unavailable.</p> : signals && <dl className="account-relationship-totals">
      <div><dt>Active projects</dt><dd>{signals.activeProjects}</dd></div>
      <div><dt>Open opportunities</dt><dd>{signals.openOpportunities}</dd></div>
      {signals.liveValue != null && <div><dt>Live project value</dt><dd>{formatCurrency(signals.liveValue)}</dd></div>}
      <div><dt>Last interaction</dt><dd>{signals.lastInteraction ? formatDate(signals.lastInteraction) : 'Not recorded'}</dd></div>
    </dl>}
  </section>;
}