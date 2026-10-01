import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/portal';
const columns = {
  actions: [['action','Action'],['owner','Owner'],['due_date','Due'],['priority','Priority'],['status','Status']],
  decisions: [['decision_title','Decision'],['decision','Outcome'],['decision_maker','Decision maker'],['required_by','Required by'],['date_agreed','Agreed'],['financial_adjustment','Contract adjustment'],['programme_impact','Programme impact'],['status','Status']],
  risks: [['reference','Reference'],['title','Risk'],['owner','Owner'],['mitigation','Mitigation'],['target_resolution','Target resolution'],['risk_index','Risk index'],['rag','RAG'],['status','Status']],
};
export default function PMPathwayRegister({ projectId, kind, initial }) {
  const { user } = useAuth();
  const query = useInfiniteQuery({ queryKey: ['pm-pathway-register', user?.id, projectId, kind], initialPageParam: null,
    initialData: { pages: [initial], pageParams: [null] },
    queryFn: async ({ pageParam }) => (await base44.functions.invoke('manageValuation', { action: 'pathway_register', projectId, kind, cursor: pageParam })).data.page,
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined, staleTime: 30000,
  });
  const rows = query.data.pages.flatMap(page => page.items);
  return <div className="space-y-3">
    {query.error && <p role="alert" className="text-sm text-destructive">Unable to load entries. <button className="underline" onClick={() => query.refetch()}>Retry</button></p>}
    {!rows.length ? <p className="text-sm text-muted-foreground">No entries recorded yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{columns[kind].map(([key,label]) => <th key={key} className="p-2 font-semibold">{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t border-border">{columns[kind].map(([key]) => <td key={key} className="min-w-24 whitespace-pre-wrap p-2 align-top">{key === 'financial_adjustment' ? formatCurrency(row[key] || 0) : String(row[key] ?? '—').replaceAll('_', ' ')}</td>)}</tr>)}</tbody></table></div>}
    {query.hasNextPage && <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? 'Loading…' : 'Load more'}</Button>}
  </div>;
}