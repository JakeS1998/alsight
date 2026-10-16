import React,{useState} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {Upload} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {ieCall} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import IEPanel from '@/components/ie/IEPanel';
import IEQueryState from '@/components/ie/IEQueryState';
import IEDocumentForm from '@/components/ie/IEDocumentForm';
import IEDocumentTable from '@/components/ie/IEDocumentTable';
export default function IEDocumentsTab({engagement,canEdit}){
 const cache=useQueryClient(),[adding,setAdding]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState('');
 const query=useInfiniteQuery({queryKey:['ie-documents',engagement.id],initialPageParam:'',queryFn:({pageParam})=>ieCall('documents',{engagement_id:engagement.id,cursor:pageParam}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,retry:false});
 const open=async item=>{setError('');setBusy(item.id);try{const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:item.file_uri});const a=document.createElement('a');a.href=signed_url;a.download=item.file_name;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove();}catch(err){setError(err.message);}finally{setBusy('');}};
 const remove=async item=>{if(!window.confirm(`Remove “${item.title}” from this engagement? This removes the reference, not the stored file.`))return;setError('');setBusy(item.id);try{await ieCall('documentDelete',{engagement_id:engagement.id,id:item.id});await cache.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('ie-')});}catch(err){setError(err.message);}finally{setBusy('');}};
 return <IEPanel title="Documents" description="Reports, research, presentations, branding and other engagement files. Stored privately." actions={canEdit&&<Button size="sm" onClick={()=>setAdding(true)}><Upload/>Upload document</Button>}>
 {error&&<p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}<IEQueryState query={query}>{query.data&&<>{query.data.pages[0].items.length?<IEDocumentTable items={query.data.pages.flatMap(p=>p.items)} canEdit={canEdit} onOpen={open} onDelete={remove} busy={busy}/>:<p className="py-10 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>}{query.hasNextPage&&<Button variant="outline" className="mt-4" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more'}</Button>}</>}</IEQueryState>{adding&&<IEDocumentForm engagementId={engagement.id} onClose={()=>setAdding(false)}/>}
 </IEPanel>;
}