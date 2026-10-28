import React from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { STAFF_WORKSPACE_ROLES } from '@/lib/portal';
import { Button } from '@/components/ui/button';
import NetworxActivityFeed from '@/components/networx/NetworxActivityFeed';
import networxClient from '@/components/networx/networxClient';
import NetworxEmailButton from '@/components/networx/NetworxEmailButton';
import NetworxActivityActions from '@/components/networx/NetworxActivityActions';
export default function NetworxActivities({ entity, recordId }) {
  const {user} = useAuth(), cache=useQueryClient(), allowed = STAFF_WORKSPACE_ROLES.includes(user?.role) && user?.page_access?.network !== false;
  const query = useInfiniteQuery({queryKey:['networx-activities',user?.id,user?.role,entity,recordId],queryFn:({pageParam})=>networxClient({action:'list',entity,recordId,cursor:pageParam}),initialPageParam:null,getNextPageParam:page=>page.nextCursor || undefined,enabled:allowed && Boolean(recordId),retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:false});
  if (!allowed) return null;
  const first = query.data?.pages[0], rows = query.data?.pages.flatMap(page=>page.items || []) || [], notice = query.data?.pages.at(-1)?.notice;
  return <section className="space-y-4 rounded-panel border border-border bg-card p-5" aria-label="Networx Dataverse activity">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-base font-semibold">Networx</h2><p className="mt-1 text-sm text-muted-foreground">Email conversations and relationship activity.</p></div><div className="flex flex-wrap gap-2">{first?.state==='ready' && <><NetworxEmailButton entity={entity} recordId={recordId}/><NetworxActivityActions entity={entity} recordId={recordId}/></>}<Button type="button" size="sm" variant="outline" disabled={query.isFetching} onClick={()=>{query.refetch();cache.invalidateQueries({queryKey:['networx-email-thread',user?.id,user?.role,entity,recordId]});}}><RefreshCw className={query.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}/>Refresh</Button></div></header>
    {query.isPending && <p role="status" className="text-sm text-muted-foreground">Loading Dataverse activity…</p>}
    {query.error && <div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{query.error.message}</p><p className="text-muted-foreground">No activity has been changed. <Link to="/account-settings" className="font-medium underline">Review my Dataverse connection</Link>, or use Refresh to try again.</p></div>}
    {first && first.state !== 'ready' && <div className="space-y-3 text-sm text-muted-foreground"><p>{first.message}</p>{first.state==='connection_required' && <Button asChild variant="outline"><Link to="/account-settings">Connect my Dataverse account</Link></Button>}</div>}
    {first?.state==='ready' && <>{!rows.length ? <p className="text-sm text-muted-foreground">No Dataverse activity is visible for this record under your account.</p> : <NetworxActivityFeed rows={rows} entity={entity} recordId={recordId} user={user}/>}{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}{query.hasNextPage && <Button type="button" variant="outline" disabled={query.isFetching} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading activity…' : 'Load more activity'}</Button>}</>}
    <p className="border-t border-border pt-3 text-xs text-muted-foreground">Latest activity first · Your Dataverse permissions apply. Incoming replies appear after Microsoft synchronization; refresh to check for updates.</p>
  </section>;
}