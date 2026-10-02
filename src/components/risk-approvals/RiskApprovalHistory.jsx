import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import RiskApprovalTimeline from '@/components/risk-approvals/RiskApprovalTimeline';
import RiskIssuedSnapshot from '@/components/risk-approvals/RiskIssuedSnapshot';
import useRiskApprovalAction from '@/components/risk-approvals/useRiskApprovalAction';
export default function RiskApprovalHistory({ projectId }) {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const action = useRiskApprovalAction(data => setSnapshot(data.snapshot));
  const query = useInfiniteQuery({ queryKey: ['risk-approval-history', projectId], enabled: open, initialPageParam: undefined, queryFn: async ({ pageParam }) => (await base44.functions.invoke('manageRiskApprovals', { action: 'history', project_id: projectId, ...(pageParam ? { cursor: pageParam } : {}) })).data, getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  return <section className="space-y-3">
    <Button variant="ghost" size="sm" onClick={() => setOpen(value => !value)}>{open ? 'Hide' : 'Show'} issued-version history</Button>
    {open && <>
      {query.isPending && <p role="status">Loading issue history…</p>}{query.error && <p role="alert" className="text-sm text-destructive">Unable to load issue history.</p>}
      {query.data?.pages.flatMap(page => page.items).map(packet => <div key={packet.id} className="space-y-2 rounded-lg border p-3"><p className="text-sm font-bold">{packet.reference} · {packet.status}</p><p className="text-xs text-muted-foreground">Issued by {packet.issued_by_name} · {new Date(packet.issued_at).toLocaleString('en-GB')}</p><RiskApprovalTimeline packet={packet} /><Button size="sm" variant="outline" disabled={action.busy} onClick={() => action.run({ action: 'snapshot', packet_id: packet.id })}>View locked register</Button></div>)}
      {query.data && !query.data.pages[0].items.length && <p className="text-sm text-muted-foreground">No issued versions yet.</p>}
      {query.hasNextPage && <Button size="sm" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Load more versions</Button>}
      {action.error && <p role="alert" className="text-sm text-destructive">{action.error}</p>}
      {snapshot && <><Button size="sm" variant="ghost" onClick={() => setSnapshot(null)}>Close register</Button><RiskIssuedSnapshot snapshot={snapshot} /></>}
    </>}
  </section>;
}