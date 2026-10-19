import React,{useState} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {Plus} from 'lucide-react';
import {ieCall} from '@/components/ie/ieClient';
import IEQueryState from '@/components/ie/IEQueryState';
import IEPanel from '@/components/ie/IEPanel';
import IEWorkForm from '@/components/ie/IEWorkForm';
import IEWorkTable from '@/components/ie/IEWorkTable';
import IEWorkSummary from '@/components/ie/IEWorkSummary';
import {IE_WORK_AREAS} from '@/components/ie/ieWorkConfig';
import {Button} from '@/components/ui/button';
import useDeletion from '@/components/deletion/useDeletion';
export default function IEWorkTab({engagement,kind,canEdit}){
 const cache=useQueryClient(),[editing,setEditing]=useState(null),busy='',config=IE_WORK_AREAS[kind],deletion=useDeletion('IEWorkItem');
 const query=useInfiniteQuery({queryKey:['ie-work',engagement.id,kind],initialPageParam:'',queryFn:({pageParam})=>ieCall('workList',{engagement_id:engagement.id,kind,cursor:pageParam}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined,retry:false});
 const items=deletion.visible(query.data?.pages.flatMap(page=>page.items));
 const remove=item=>deletion.request({id:item.id,label:`${config.singular} “${item.title}”`,onDelete:async()=>{await ieCall('workDelete',{engagement_id:engagement.id,id:item.id});await cache.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('ie-')});}});
 return <div className="space-y-5"><IEPanel title={config.title} description={config.description} actions={canEdit&&<Button size="sm" onClick={()=>setEditing({})}><Plus/>Add {config.singular}</Button>}>
 <IEQueryState query={query}>{query.data&&<>{items.length?<IEWorkTable items={items} kind={kind} canEdit={canEdit} onEdit={setEditing} onDelete={remove} busy={busy}/>:<p className="py-10 text-center text-sm text-muted-foreground">No {kind==='research'?'research items':kind==='creative'?'deliverables':'activities'} recorded yet.</p>}{query.hasNextPage&&<Button className="mt-4" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more'}</Button>}</>}</IEQueryState>
 </IEPanel>{query.data&&<IEWorkSummary rows={query.data.pages[0].summary} kind={kind}/>}{editing&&<IEWorkForm engagement={engagement} kind={kind} item={editing.id?editing:null} onClose={()=>setEditing(null)}/>}</div>;
}