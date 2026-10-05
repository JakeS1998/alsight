import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isPublicBody } from '@/components/accounts/accountPresentation';
export default function AccountStructure({ account }) {
  const { user } = useAuth();
  const parent = useQuery({ queryKey: ['account-parent',account.parent_account_id,user?.id,user?.role], enabled: !!account.parent_account_id, queryFn: async () => {
    const page = await base44.entities.Account.filter({ $or: [{ id: account.parent_account_id },{ dataverse_id: account.parent_account_id }] }, { limit: 1,fields: ['name'] }); return page.items[0] || null;
  } });
  const publicBody = isPublicBody(account);
  return <section className="account-panel"><h2>{publicBody ? 'Organisation Information' : 'Corporate / Ownership Structure'}</h2>{publicBody ? <><p className="text-sm text-muted-foreground">{account.local_authority_code ? `Local-authority code: ${account.local_authority_code}` : 'Local-authority code not recorded.'}</p><p className="mt-3 text-sm text-muted-foreground">{account.public_body_identifier ? `Public-body identifier: ${account.public_body_identifier}` : 'Additional organisation information is not recorded.'}</p></> : <>{parent.isFetching ? <p role="status" className="text-sm">Loading recorded parent organisation…</p> : parent.data ? <p className="text-sm">Recorded parent: <Link className="font-semibold underline" to={`/accounts/${parent.data.id}`}>{parent.data.name}</Link></p> : <p className="text-sm text-muted-foreground">No verified corporate hierarchy is recorded. No ownership or control relationships have been inferred.</p>}{parent.error && <p className="mt-3 text-sm text-destructive">Recorded parent details are unavailable.</p>}{account.ch_links_psc && <a className="mt-4 inline-block text-sm font-semibold underline underline-offset-4" href={account.ch_links_psc} target="_blank" rel="noreferrer">View recorded Companies House PSC source ↗</a>}</>}</section>;
}