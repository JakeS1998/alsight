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
    <section className="account-panel"><h2>ALSight ASE Rating</h2><ASERating account={account} /><h3>Why this rating?</h3><p className="mt-2 text-sm text-muted-foreground">{account.ase_reason || (account.ase_score ? 'An ASE score is recorded, but its assessment rationale has not been provided.' : 'This account has not been assessed. No rating or financial-health conclusion has been inferred.')}</p>{account.ase_assessed_at && <p className="mt-4 text-xs text-muted-foreground">Last assessed: {formatDate(account.ase_assessed_at)}</p>}</section>
    <AccountKeyInformation account={account} owner={signals?.owner} />
    <section className="account-panel"><h2>Key People</h2>{!contacts.length ? <p className="text-sm text-muted-foreground">No linked contacts are recorded.</p> : <div className="account-people">{contacts.slice(0,5).map(contact => <div key={contact.id}><Link to={`/accounts/${account.id}/contacts/${contact.id}`} className="hover:underline">{contact.full_name}</Link><p>{contact.job_title || contact.officer_role || 'Role not recorded'}</p>{contact.email && <a className="text-xs text-muted-foreground" href={`mailto:${contact.email}`}>{contact.email}</a>}</div>)}</div>}</section>
    <section className="account-panel"><h2>Relationship Summary</h2><p className="text-sm text-muted-foreground">{account.relationship_summary || account.comments || 'No relationship summary has been recorded.'}</p>{account.relationship_summary && account.comments && <><h3>Existing account notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{account.comments}</p></>}{summaryLoading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading account totals…</p> : summaryError ? <p role="alert" className="mt-4 text-sm text-destructive">Account totals are unavailable.</p> : signals && <dl className="account-card-facts mt-5"><div><dt>Active projects</dt><dd>{signals.activeProjects}</dd></div><div><dt>Open opportunities</dt><dd>{signals.openOpportunities}</dd></div>{signals.liveValue != null && <div><dt>Live project value</dt><dd>{formatCurrency(signals.liveValue)}</dd></div>}<div><dt>Last interaction</dt><dd>{signals.lastInteraction ? formatDate(signals.lastInteraction) : 'Not recorded'}</dd></div></dl>}</section>
    <AccountStructure account={account} />
    <AccountRecentActivity account={account} />
    <AccountCurrentWork account={account} projects={projects} />
    <section className="account-panel"><h2>ALICE Account Insight</h2><p className="text-sm text-muted-foreground">Explore the recorded relationship, project activity and opportunities. ALICE can help interpret available evidence, without inventing ASE scores or company structures.</p>{INTERNAL_ROLES.includes(user?.role) && <Button variant="outline" className="mt-5" onClick={launch}>Ask ALICE about this account</Button>}</section>
  </div>;
}