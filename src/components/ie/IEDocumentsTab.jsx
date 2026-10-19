import React,{useState} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {Link2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {ieCall} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import IEPanel from '@/components/ie/IEPanel';
import IEQueryState from '@/components/ie/IEQueryState';
import IEDocumentForm from '@/components/ie/IEDocumentForm';
import IEDocumentTable from '@/components/ie/IEDocumentTable';
import useDeletion from '@/components/deletion/useDeletion';
export default function IEDocumentsTab({engagement,canEdit}){
 const cache=useQueryClient(),[adding,setAdding]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState(''),deletion=useDeletion('IEDocument');
 const query=useInfiniteQuery({queryKey:['ie-documents',engagement.id],initialPageParam:'',queryFn:({pageParam})=>ieCall('documents',{engagement_id:engagement.id,cursor:pageParam}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,retry:false});
 const open=async item=>{setError('');setBusy(item.id);try{const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:item.file_uri});const a=document.createElement('a');a.href=signed_url;a.download=item.file_name;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove();}catch(err){setError(err.message);}finally{setBusy('');}};
 const items=deletion.visible(query.data?.pages.flatMap(page=>page.items));
 const remove=item=>deletion.request({id:item.id,label:`document reference “${item.title}”`,description:'This removes the reference from this engagement, not the underlying document or SharePoint file.',onDelete:async()=>{await ieCall('documentDelete',{engagement_id:engagement.id,id:item.id});await cache.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('ie-')});}});
 return <IEPanel title="Documents" description="SharePoint links to reports, research, presentations, branding and other engagement documents. SharePoint permissions apply." actions={canEdit&&<Button size="sm" onClick={()=>setAdding(true)}><Link2/>Add SharePoint link</Button>}>
 {error&&<p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}<IEQueryState query={query}>{query.data&&<>{items.length?<IEDocumentTable items={items} canEdit={canEdit} onOpen={open} onDelete={remove} busy={busy}/>:<p className="py-10 text-center text-sm text-muted-foreground">No document links added yet.</p>}{query.hasNextPage&&<Button variant="outline" className="mt-4" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more'}</Button>}</>}</IEQueryState>{adding&&<IEDocumentForm engagementId={engagement.id} onClose={()=>setAdding(false)}/>}
 </IEPanel>;
}