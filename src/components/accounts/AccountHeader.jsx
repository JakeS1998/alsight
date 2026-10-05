import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import AccountBadges from '@/components/accounts/AccountBadges';
import { websiteUrl } from '@/components/accounts/accountPresentation';
import { useAuth } from '@/lib/AuthContext';
export default function AccountHeader({ account, owner, actions }) {
  const { user } = useAuth();
  const photo = useQuery({ queryKey: ['account-hero',account.id,user?.id,user?.role], staleTime: 86400000, queryFn: async () => (await base44.functions.invoke('findAccountHeaderImage',{ accountId: account.id })).data });
  const identifiers = [['Company Number',account.company_number],['VAT',account.vat_number],['LA Code',account.local_authority_code],['Public-body ID',account.public_body_identifier],['Account owner',owner || 'Not assigned']];
  return <><Link to="/accounts" className="mb-4 inline-block text-sm font-medium text-muted-foreground hover:text-foreground">← Back to Accounts</Link><header className="account-hero">
    {photo.data?.url && <Image src={photo.data.url} alt={photo.data.caption || `${account.name} offices`} className="account-hero-photo" />}
    <div className="account-hero-copy"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/70">Account 360</p><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-heading font-bold">{account.name}</h1>{actions}</div><AccountBadges account={account} /><div className="account-hero-identifiers">{identifiers.filter(([,value]) => value).map(([label,value]) => <span key={label}>{label}: {value}</span>)}{websiteUrl(account.website) && <a href={websiteUrl(account.website)} target="_blank" rel="noreferrer">Website ↗</a>}</div></div>
  </header></>;
}