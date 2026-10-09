import React from 'react';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import AccountBadges from '@/components/accounts/AccountBadges';
import { websiteUrl } from '@/components/accounts/accountPresentation';
import { useAuth } from '@/lib/AuthContext';
import { isCouncilAccount } from '@/components/accounts/accountSections';
import { Building2, Landmark } from 'lucide-react';
export default function AccountHeader({ account, owner, actions }) {
  const { user } = useAuth();
  const {state} = useLocation();
  const directoryPath = ['/suppliers','/clients'].includes(state?.directoryPath) ? state.directoryPath : account.account_type === 'client' || account.relationship_types?.includes('client') ? '/clients' : '/suppliers';
  const AccountIcon = isCouncilAccount(account) ? Landmark : Building2;
  const photo = useQuery({ queryKey: ['account-hero',account.id,user?.id,user?.role,'static-photos-v1'], staleTime: 86400000, queryFn: async () => (await base44.functions.invoke('findAccountHeaderImage',{ accountId: account.id })).data });
  const identifiers = [['Relationship owner',owner || 'Not assigned'],['Location',[account.address_city,account.address_postcode].filter(Boolean).join(' · ')]];
  return <><Link to={directoryPath} className="mb-4 inline-block text-sm font-medium text-muted-foreground hover:text-foreground">← Back to {directoryPath === '/clients' ? 'Clients' : 'Suppliers'}</Link><header className="account-hero">
    {photo.data?.url && <div className="account-hero-photo"><Image src={photo.data.url} alt={photo.data.caption || `${account.name} offices`} className="h-full w-full object-cover" /></div>}
    <div className="account-hero-copy"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/70">Relationship · Journey: Relationship</p><div className="account-heading-row flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-4"><span className="account-heading-icon" aria-hidden="true"><AccountIcon className="h-7 w-7" /></span><h1 className="font-heading font-bold">{account.name}</h1></div>{actions}</div><AccountBadges account={account} /><RecordUpdatedAt record={account} className="mt-3 text-sidebar-foreground/70" /><div className="account-hero-identifiers">{identifiers.filter(([,value]) => value).map(([label,value]) => <span key={label}>{label}: {value}</span>)}{websiteUrl(account.website) && <a href={websiteUrl(account.website)} target="_blank" rel="noreferrer">Website ↗</a>}</div></div>
  </header></>;
}