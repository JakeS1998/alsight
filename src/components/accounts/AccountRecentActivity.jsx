import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatDateTime } from '@/lib/portal';
export default function AccountRecentActivity({ account }) {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['account-recent-activity',account.id,user?.id,user?.role], queryFn: async () => {
    const scope = { account_id: { $in: [account.id,account.dataverse_id].filter(Boolean) } };
    const [activity,conversations] = await Promise.all([base44.entities.CRMActivity.filter(scope,{ sort: '-occurred_at',limit: 5 }),base44.entities.Conversation.filter(scope,{ sort: '-occurred_at',limit: 5 })]);
    return [...activity.items,...conversations.items].sort((a,b) => String(b.occurred_at).localeCompare(String(a.occurred_at))).slice(0,5);
  } });
  return <section className="account-panel"><h2>Recent Activity</h2>{query.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading recent activity…</p> : query.error ? <p role="alert" className="text-sm text-destructive">Recent activity is unavailable.</p> : !query.data.length ? <p className="text-sm text-muted-foreground">No activity is visible for this account.</p> : <ol className="space-y-4">{query.data.map(row => <li key={row.id} className="text-sm"><p className="font-semibold">{row.subject || row.summary}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(row.occurred_at)} · {row.author_name || 'Team member'}</p></li>)}</ol>}</section>;
}