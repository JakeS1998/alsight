import React from 'react';
import AccountKeyPeople from '@/components/accounts/AccountKeyPeople';
import ASERating from '@/components/accounts/ASERating';
import AccountKeyInformation from '@/components/accounts/AccountKeyInformation';
import AccountStructure from '@/components/accounts/AccountStructure';
import AccountRecentActivity from '@/components/accounts/AccountRecentActivity';
import AccountCurrentWork from '@/components/accounts/AccountCurrentWork';
import CompaniesHousePanel from '@/components/accounts/CompaniesHousePanel';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency, INTERNAL_ROLES } from '@/lib/portal';
import { hasCompanyRegistry } from '@/components/accounts/accountSections';
import { aseRoles } from '@/components/ase/aseClient';
export default function AccountOverview({ account, contacts, projects, signals, user, summaryLoading, summaryError, onAccountEnriched }) {
  const showCompaniesHouse = hasCompanyRegistry(account) && aseRoles.includes(user?.role);
  const launch = () => window.dispatchEvent(new CustomEvent('alsight-open-alice',{ detail: { prompt: `Review account ${account.name} (account ID ${account.id}). Summarise only records I can access, current projects and opportunities, relationship activity and recorded ASE evidence. Do not invent financial or ownership data.`, autoSend: true } }));
  return <div className="account-overview-grid">
    {INTERNAL_ROLES.includes(user?.role) && <section className="account-panel"><h2>ALSight ASE · All Seeing Eye</h2><ASERating account={account}/><p className="mt-3 text-xs text-muted-foreground">Select the dial to explore calculated components, evidence, confidence and assessment history.</p></section>}
    <AccountKeyInformation account={account} showRegistryDetails={!showCompaniesHouse} />
    <AccountKeyPeople account={account} />
    <section className="account-panel"><h2>Relationship Summary</h2><p className="text-sm text-muted-foreground">{account.relationship_summary || account.comments || 'No relationship summary has been recorded.'}</p>{account.relationship_summary && account.comments && account.relationship_summary.trim()!==account.comments.trim() && <><h3>Existing account notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{account.comments}</p></>}{summaryLoading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading account totals…</p> : summaryError ? <p role="alert" className="mt-4 text-sm text-destructive">Account totals are unavailable.</p> : signals && <dl className="account-card-facts mt-5"><div><dt>Active projects</dt><dd>{signals.activeProjects}</dd></div><div><dt>Open opportunities</dt><dd>{signals.openOpportunities}</dd></div>{signals.liveValue != null && <div><dt>Live project value</dt><dd>{formatCurrency(signals.liveValue)}</dd></div>}<div><dt>Last interaction</dt><dd>{signals.lastInteraction ? formatDate(signals.lastInteraction) : 'Not recorded'}</dd></div></dl>}</section>
    {showCompaniesHouse && <CompaniesHousePanel account={account} onUpdated={onAccountEnriched}/>}
    <AccountStructure account={account} />
    <AccountRecentActivity account={account} />
    <AccountCurrentWork account={account} projects={projects} />
    {INTERNAL_ROLES.includes(user?.role) && <section className="account-panel"><h2>ALICE Account Insight</h2><p className="text-sm text-muted-foreground">Ask ALICE to interpret this account’s accessible projects, opportunities, relationship activity and ASE evidence.</p><Button variant="outline" className="mt-5" onClick={launch}>Ask ALICE about this account</Button></section>}
  </div>;
}