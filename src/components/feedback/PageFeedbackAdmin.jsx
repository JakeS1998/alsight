import React,{useEffect,useState} from 'react';
import {useQuery,useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import FeedbackFilters,{emptyFeedbackFilters} from '@/components/feedback/FeedbackFilters';
import FeedbackSummary from '@/components/feedback/FeedbackSummary';
import FeedbackRecords from '@/components/feedback/FeedbackRecords';
import {feedbackCall,feedbackFilters} from '@/components/feedback/feedbackClient';
export default function PageFeedbackAdmin() {
 const {user}=useAuth(),client=useQueryClient();
 const [filters,setFilters]=useState({...emptyFeedbackFilters}),[applied,setApplied]=useState({...emptyFeedbackFilters});
 useEffect(()=>{const timer=setTimeout(()=>setApplied(filters),350);return()=>clearTimeout(timer);},[filters]);
 const enabled=user?.role==='admin';
 const options=useQuery({queryKey:['page-feedback','options',user?.id],enabled,queryFn:()=>feedbackCall({action:'options'})});
 const summary=useQuery({queryKey:['page-feedback','summary',user?.id,applied],enabled,retry:false,queryFn:()=>feedbackCall({action:'summary',filters:feedbackFilters(applied)})});
 const records=useInfiniteQuery({queryKey:['page-feedback','records',user?.id,applied],enabled,retry:false,initialPageParam:undefined,queryFn:({pageParam})=>feedbackCall({action:'list',filters:feedbackFilters(applied),...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 if(!enabled)return null;
 const error=summary.error||records.error||options.error;
 return <section className="space-y-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-heading text-xl font-semibold">Page Feedback</h2><p className="mt-1 text-sm text-muted-foreground">Usefulness ratings and comments, stored exclusively in Base44. All summaries reflect the filters below.</p></div><Button type="button" variant="outline" disabled={summary.isFetching||records.isFetching} onClick={()=>client.invalidateQueries({queryKey:['page-feedback']})}>Refresh feedback</Button></div><FeedbackFilters filters={filters} onChange={setFilters} pages={options.data?.pages}/>{(summary.isFetching||records.isFetching)&&<p role="status" className="text-sm text-muted-foreground">Loading feedback…</p>}{error&&<p role="alert" className="text-sm text-destructive">{error.response?.data?.error||error.message}</p>}{summary.data&&<FeedbackSummary data={summary.data}/>}<section className="rounded-panel border border-border bg-card p-4"><h3 className="mb-3 font-heading font-semibold">Individual submissions</h3>{records.data&&<FeedbackRecords rows={records.data.pages.flatMap(page=>page.items)}/>} {records.hasNextPage&&<Button type="button" variant="outline" className="mt-4" disabled={records.isFetchingNextPage} onClick={()=>records.fetchNextPage()}>{records.isFetchingNextPage?'Loading…':'Load more feedback'}</Button>}</section></section>;
}