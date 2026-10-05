import React from 'react';
import AccountKeyPeople from '@/components/accounts/AccountKeyPeople';
import ASERating from '@/components/accounts/ASERating';
import AccountKeyInformation from '@/components/accounts/AccountKeyInformation';
import AccountStructure from '@/components/accounts/AccountStructure';
import AccountRecentActivity from '@/components/accounts/AccountRecentActivity';
import AccountCurrentWork from '@/components/accounts/AccountCurrentWork';
import CompaniesHousePanel from '@/components/accounts/CompaniesHousePanel';
import AccountRelationshipSummary from '@/components/accounts/AccountRelationshipSummary';
import AccountInsightCard from '@/components/accounts/AccountInsightCard';
import { INTERNAL_ROLES } from '@/lib/portal';
import { hasCompanyRegistry } from '@/components/accounts/accountSections';
import { aseRoles } from '@/components/ase/aseClient';
import ASECommercialConcentration from '@/components/ase/ASECommercialConcentration';
export default function AccountOverview({ account, contacts, projects, signals, user, summaryLoading, summaryError, onAccountEnriched }) {
  const showCompaniesHouse = hasCompanyRegistry(account) && aseRoles.includes(user?.role);
  return <div className="account-overview-grid">
    {INTERNAL_ROLES.includes(user?.role) && <section className="account-panel account-assessment-panel"><h2>ALSight ASE · All Seeing Eye</h2><ASERating account={account} expanded /><p className="mt-4 text-xs text-muted-foreground">Select the assessment to explore components, evidence, confidence and assessment history.</p></section>}
    <AccountKeyInformation account={account} showRegistryDetails={!showCompaniesHouse} />
    <AccountRelationshipSummary account={account} signals={signals} loading={summaryLoading} error={summaryError} />
    <AccountKeyPeople account={account} />
    {showCompaniesHouse ? <div className="account-commercial-row"><AccountStructure account={account}/><ASECommercialConcentration key={account.id} account={account} card/></div> : <AccountStructure account={account}/>}
    <div className="account-work-row"><AccountCurrentWork account={account} projects={projects}/>{INTERNAL_ROLES.includes(user?.role) && <AccountInsightCard account={account}/>}</div>
    <AccountRecentActivity account={account} />
    {showCompaniesHouse && <div className="account-registry-section"><CompaniesHousePanel account={account} onUpdated={onAccountEnriched}/></div>}
  </div>;
}