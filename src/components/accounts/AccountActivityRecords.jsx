import React, { useState } from 'react';
import fullName from '@/components/data/fullName';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/portal';
export default function AccountActivityRecords({ account,user }) {
  const [cursor,setCursor] = useState(null), [history,setHistory] = useState([]);
  const query = useQuery({ queryKey: ['account-activity-records',account.id,user?.id,user?.role,cursor],queryFn: () => base44.entities.CRMActivity.filter({ account_id: { $in: [account.id,account.dataverse_id].filter(Boolean) } },{ sort: '-occurred_at',limit: 30,...(cursor ? { cursor } : {}) }) });
  return <section className="account-panel"><h2>Account Activity</h2>{query.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading activity…</p> : query.error ? <p role="alert" className="text-sm text-destructive">Account activity is unavailable.</p> : <>{!query.data.items.length ? <p className="text-sm text-muted-foreground">No CRM activities are visible for this account.</p> : <ol className="space-y-5">{query.data.items.map(row => <li key={row.id}><p className="text-sm font-semibold">{row.subject}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(row.occurred_at)} · {fullName(row.author_name,row.author_id)} · {row.type?.replaceAll('_',' ')}</p>{row.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{row.description}</p>}</li>)}</ol>}<div className="mt-5 flex justify-between"><Button variant="outline" disabled={!history.length || query.isFetching} onClick={() => { setCursor(history.at(-1)); setHistory(old => old.slice(0,-1)); }}>Previous</Button><Button variant="outline" disabled={!query.data.has_more || query.isFetching} onClick={() => { setHistory(old => [...old,cursor]); setCursor(query.data.next_cursor); }}>Next</Button></div></>}</section>;
}