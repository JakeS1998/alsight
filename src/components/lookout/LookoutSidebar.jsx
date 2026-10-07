import React from 'react';
import {Link} from 'react-router-dom';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Newspaper} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import lookoutRequest from '@/components/lookout/lookoutClient';
import '@/components/lookout/lookout.css';
export default function LookoutSidebar() {
  const {user}=useAuth();
  const query=useInfiniteQuery({queryKey:['lookout','published',user?.id],initialPageParam:null,queryFn:({pageParam})=>lookoutRequest('list',{cursor:pageParam}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined,staleTime:30000,refetchInterval:60000});
  return <aside className="lookout-theme lookout-paper p-4" aria-label="The Lookout"><h2 className="lookout-heading flex items-center gap-2"><Newspaper className="h-4 w-4"/>The Lookout</h2><p className="lookout-muted mt-2 text-xs">Your weekly view across Alliance.</p>{query.isPending?<p role="status" className="mt-3 text-xs">Loading issues…</p>:query.error?<p role="alert" className="mt-3 text-xs">{query.error.message} <button className="underline" onClick={()=>query.refetch()}>Retry</button></p>:<div className="mt-3 space-y-2">{query.data.pages.flatMap(page=>page.items).map(issue=><Link key={issue.id} to={`/lookout/${issue.id}`} className="lookout-kpi block !p-3 text-xs"><strong>Issue {String(issue.issue_number).padStart(3,'0')}</strong><time className="mt-1 block" dateTime={issue.publication_date}>{new Date(issue.publication_date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</time><span className="mt-1 block underline">Read & download PDF</span></Link>)}{!query.data.pages[0].items.length && <p className="text-xs">The first approved issue will appear here after publication.</p>}</div>}{query.hasNextPage && <button disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()} className="mt-3 text-xs underline">{query.isFetchingNextPage?'Loading…':'Older issues'}</button>}{user?.role==='admin' && <Link to="/admin/lookout" className="lookout-button mt-4 block text-center">Manage The Lookout</Link>}</aside>;
}