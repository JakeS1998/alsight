import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/portal';
import AccountBadges from '@/components/accounts/AccountBadges';
import ASERating from '@/components/accounts/ASERating';
export default function AccountCard({ account, signals }) {
  const facts = [['Primary location',[account.address_city,account.address_postcode].filter(Boolean).join(' · ') || 'Not recorded'],['Relationship owner',signals.owner],['Active projects',signals.activeProjects],['Open opportunities',signals.openOpportunities],...(signals.liveValue != null ? [['Live project value',formatCurrency(signals.liveValue)]] : []),['Last interaction',signals.lastInteraction ? formatDate(signals.lastInteraction) : 'Not recorded']];
  return <Link className="account-card" to={`/accounts/${account.id}`}>
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2>{account.name}</h2><AccountBadges account={account} /></div><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" /></div>
    <dl className="account-card-facts">{facts.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="account-card-bottom"><ASERating account={account} compact /><span>{account.company_number ? `Company No. ${account.company_number}` : account.local_authority_code ? `LA Code ${account.local_authority_code}` : account.public_body_identifier || 'Identifier not recorded'}</span></div>
  </Link>;
}