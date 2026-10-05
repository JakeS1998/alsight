import React from 'react';
import { Link } from 'react-router-dom';
import ASERating from '@/components/accounts/ASERating';
import AccountKeyInformation from '@/components/accounts/AccountKeyInformation';
import AccountStructure from '@/components/accounts/AccountStructure';
import AccountRecentActivity from '@/components/accounts/AccountRecentActivity';
import AccountCurrentWork from '@/components/accounts/AccountCurrentWork';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency, INTERNAL_ROLES } from '@/lib/portal';
export default function AccountOverview({ account, contacts, projects, signals, user, summaryLoading, summaryError }) {
  const launch = () => window.dispatchEvent(new CustomEvent('alsight-open-alice',{ detail: { prompt: `Review account ${account.name} (account ID ${account.id}). Summarise only records I can access, current projects and opportunities, relationship activity and recorded ASE evidence. Do not invent financial or ownership data.`, autoSend: true } }));
  return <div className="account-overview-grid">
    {INTERNAL_ROLES.includes(user?.role) && <section className="account-panel"><h2>ALSight ASE · All Seeing Eye</h2><ASERating account={account}/><p className="mt-3 text-xs text-muted-foreground">Select the dial to explore calculated components, evidence, confidence and assessment history.</p></section>}
    <AccountKeyInformation account={account} owner={signals?.owner} />
    <section className="account-panel"><h2>Key People</h2>{!contacts.length ? <p className="text-sm text-muted-foreground">No linked contacts are recorded.</p> : <div className="account-people">{contacts.slice(0,5).map(contact => <div key={contact.id}><Link to={`/accounts/${account.id}/contacts/${contact.id}`} className="hover:underline">{contact.full_name}</Link><p>{contact.job_title || contact.officer_role || 'Role not recorded'}</p>{contact.email && <a className="text-xs text-muted-foreground" href={`mailto:${contact.email}`}>{contact.email}</a>}</div>)}</div>}</section>
    <section className="account-panel"><h2>Relationship Summary</h2><p className="text-sm text-muted-foreground">{account.relationship_summary || account.comments || 'No relationship summary has been recorded.'}</p>{account.relationship_summary && account.comments && <><h3>Existing account notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{account.comments}</p></>}{summaryLoading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading account totals…</p> : summaryError ? <p role="alert" className="mt-4 text-sm text-destructive">Account totals are unavailable.</p> : signals && <dl className="account-card-facts mt-5"><div><dt>Active projects</dt><dd>{signals.activeProjects}</dd></div><div><dt>Open opportunities</dt><dd>{signals.openOpportunities}</dd></div>{signals.liveValue != null && <div><dt>Live project value</dt><dd>{formatCurrency(signals.liveValue)}</dd></div>}<div><dt>Last interaction</dt><dd>{signals.lastInteraction ? formatDate(signals.lastInteraction) : 'Not recorded'}</dd></div></dl>}</section>
    <AccountStructure account={account} />
    <AccountRecentActivity account={account} />
    <AccountCurrentWork account={account} projects={projects} />
    <section className="account-panel"><h2>ALICE Account Insight</h2><p className="text-sm text-muted-foreground">{summaryLoading ? 'Loading recorded account context…' : summaryError ? 'Recorded account context is unavailable.' : signals ? `Visible account context: ${signals.activeProjects} active projects and ${signals.openOpportunities} open opportunities. ${signals.lastInteraction ? `The last interaction was recorded on ${formatDate(signals.lastInteraction)}.` : 'No interaction is recorded.'}` : 'No account context is available.'}</p><p className="mt-3 text-xs text-muted-foreground">Ask ALICE to interpret the accessible records. These figures are recorded context, not an AI financial or ownership assessment.</p>{INTERNAL_ROLES.includes(user?.role) && <Button variant="outline" className="mt-5" onClick={launch}>Ask ALICE about this account</Button>}</section>
  </div>;
}