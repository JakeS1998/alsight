import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function AccountStructure({ account }) {
  const { user } = useAuth();
  const parent = useQuery({ queryKey: ['account-parent',account.parent_account_id,user?.id,user?.role], enabled: !!account.parent_account_id, queryFn: async () => {
    if (/^[a-f0-9]{24}$/i.test(account.parent_account_id)) return base44.entities.Account.get(account.parent_account_id);
    const page = await base44.entities.Account.filter({ dataverse_id: account.parent_account_id }, { limit: 1,fields: ['name'] }); return page.items[0] || null;
  } });
  if (!account.parent_account_id) return null;
  return <section className="account-panel"><h2>Parent Organisation</h2>{parent.isFetching ? <p role="status" className="text-sm">Loading recorded parent organisation…</p> : parent.error ? <p role="alert" className="text-sm text-destructive">Recorded parent details are unavailable.</p> : parent.data ? <p className="text-sm">Recorded parent: <Link className="font-semibold underline" to={`/accounts/${parent.data.id}`}>{parent.data.name}</Link></p> : <p className="text-sm text-muted-foreground">The recorded parent organisation is not available to view.</p>}</section>;
}