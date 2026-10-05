import React from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {DOCUMENT_TYPE} from '@/lib/portal';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/StatusBadge';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
const styles={Complete:{label:'Complete',className:'bg-success/10 text-success border-success/20'},Overdue:{label:'Overdue',className:'bg-destructive/10 text-destructive border-destructive/20'}};
export default function ProjectMeetingDocuments({project,user}) {
 const query=useInfiniteQuery({queryKey:['meeting-documents',project.id,project.dataverse_id,user.id,user.role],initialPageParam:{},queryFn:async({pageParam})=>{
  const entities=['LegalDocument','DMA','JCT','Warranty'],scope={project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)},status:{$ne:'inactive'}};
  const pages=await Promise.all(entities.map(async entity=>{if(pageParam[entity]===false)return {entity,items:[],has_more:false};const page=await base44.entities[entity].filter(scope,{limit:25,sort:'-updated_date',...(pageParam[entity] ? {cursor:pageParam[entity]} : {})});return {...page,entity,items:page.items.map(d=>({...d,entity}))};}));
  return {items:pages.flatMap(p=>p.items),next:Object.fromEntries(pages.map(p=>[p.entity,p.has_more ? p.next_cursor : false]))};
 },getNextPageParam:p=>Object.values(p.next).some(Boolean) ? p.next : undefined});
 const documents=query.data?.pages.flatMap(p=>p.items)||[];
 const label=d=>d.entity==='LegalDocument' ? DOCUMENT_TYPE[d.document_type]?.label || d.document_type || d.document_id : d.entity==='Warranty' ? `Warranty · ${d.services || d.document_id || ''}` : d.entity;
 const status=d=>d.executed==='yes' || d.executed==='po' || d.date_of_execution || ['executed','product_warranty'].includes(d.warranty_status) ? 'Complete' : d.executed==='na' ? 'Not required' : (d.signing_target_date || d.warranty_due) && new Date(d.signing_target_date || d.warranty_due)<new Date() ? 'Overdue' : d.sent_for_signing || d.sent_to_client ? 'Out for signature' : d.drafted_date ? 'Drafted' : 'Outstanding';
 return <ReviewQueryState query={query}><div className="space-y-2"><p className="mb-3 text-xs text-muted-foreground">Existing accessible documents only; absence does not mean a document is not required.</p>{documents.map(d=><div key={`${d.entity}:${d.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"><div><p className="text-sm font-medium">{label(d)}</p>{d.link_to_file && <a href={d.link_to_file} target="_blank" rel="noreferrer" className="text-xs underline text-muted-foreground">Open document</a>}</div><StatusBadge status={status(d)} map={styles}/></div>)}{!documents.length && <p className="text-sm text-muted-foreground">No accessible documents recorded for this project.</p>}{query.hasNextPage && <Button variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more documents'}</Button>}</div></ReviewQueryState>;
}