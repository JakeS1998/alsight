import React from 'react';
import AlsightAttention from '@/components/AlsightAttention';
import {Link} from 'react-router-dom';
import { formatDate, formatCurrency } from '@/lib/portal';
export default function AccountRelationshipSummary({ account, signals, loading, error }) {
  return <section className="account-panel account-relationship-summary">
    <h2>Our relationship</h2>
    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{account.relationship_summary || account.comments || 'No relationship summary has been recorded.'}</p>
    {account.relationship_summary && account.comments && account.relationship_summary.trim() !== account.comments.trim() && <><h3>Existing account notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{account.comments}</p></>}
    {loading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading account totals…</p> : error ? <p role="alert" className="mt-4 text-sm text-destructive">Account totals are unavailable.</p> : signals && <dl className="account-relationship-totals">
      <div><dt>Active projects</dt><dd>{signals.activeProjects}</dd></div>
      <div><dt>Open opportunities</dt><dd>{signals.openOpportunities}</dd></div>
      {signals.liveValue != null && <div><dt>Live project value</dt><dd>{formatCurrency(signals.liveValue)}</dd></div>}
      <div><dt>Last interaction</dt><dd>{signals.lastInteraction ? formatDate(signals.lastInteraction) : 'Not recorded'}</dd></div>
    </dl>}
  {!loading && !error && signals?.lastInteraction && Date.now()-Date.parse(signals.lastInteraction)>=21*86400000 && <div className="mt-4"><AlsightAttention title="Relationship interaction record is older than 21 days" explanation="The last meaningful interaction recorded in the accessible ALSight information is not recent. Review the relationship history or add an interaction record; no instruction to contact the organisation is implied." actions={[{label:'Review interactions',to:`/accounts/${account.id}?tab=activity`}]}/></div>}
  <nav className="mt-4 flex flex-wrap gap-3 text-xs font-medium" aria-label="Connected relationship records">{[['View projects','projects'],['View contacts','contacts'],['Review interactions','activity']].map(([label,tab])=><Link className="underline" key={tab} to={`/accounts/${account.id}?tab=${tab}`}>{label}</Link>)}</nav>
  </section>;
}