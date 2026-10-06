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
export default function AccountOverview({ account, contacts, projects, signals, user, summaryLoading, summaryError, onSummaryRetry, onAccountEnriched }) {
  const showCompaniesHouse = hasCompanyRegistry(account) && aseRoles.includes(user?.role);
  return <div className="account-overview-grid">
    {INTERNAL_ROLES.includes(user?.role) && <section className="account-panel account-assessment-panel" aria-label="All Seeing Eye assessment"><ASERating account={account} expanded /></section>}
    <div className="account-summary-column">
      <AccountRelationshipSummary account={account} signals={signals} loading={summaryLoading} error={summaryError} onRetry={onSummaryRetry} />
      <AccountKeyPeople account={account} />
    </div>
    <AccountRecentActivity account={account} />
    <div className="account-work-row"><AccountCurrentWork account={account} projects={projects}/>{INTERNAL_ROLES.includes(user?.role) && <AccountInsightCard account={account}/>}</div>
    <AccountKeyInformation account={account} showRegistryDetails={!showCompaniesHouse} />
    {showCompaniesHouse ? <div className="account-commercial-row"><AccountStructure account={account}/><ASECommercialConcentration key={account.id} account={account} card/></div> : <AccountStructure account={account}/>}
    {showCompaniesHouse && <div className="account-registry-section"><CompaniesHousePanel account={account} onUpdated={onAccountEnriched}/></div>}
  </div>;
}