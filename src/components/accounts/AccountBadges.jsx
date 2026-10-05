import React from 'react';
import { relationshipLabels, organisationLabel } from '@/components/accounts/accountPresentation';
export default function AccountBadges({ account }) {
  const labels = [...new Set([...relationshipLabels(account),...((account.organisation_type || account.company_type) ? [organisationLabel(account)] : [])].map(label => label.toLowerCase()))];
  return <div className="account-badges">{labels.map(label => <span key={label}>{label}</span>)}{account.uklf_approved && <span>UKLF Approved</span>}<span>{account.status === 'inactive' ? 'Inactive' : 'Active'}</span></div>;
}