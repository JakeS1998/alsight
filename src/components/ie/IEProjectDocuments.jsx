import React from 'react';
import {ExternalLink} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ProjectDraftingTab from '@/components/projects/ProjectDraftingTab';
import IEQueryState from '@/components/ie/IEQueryState';
import useIELegalDocuments from '@/components/ie/useIELegalDocuments';
export default function IEProjectDocuments({engagementId,project}){
 const {query,legalDocs,dmas,jcts,accountMap,psoChecks}=useIELegalDocuments(engagementId);
 const links=[['Project documents folder',project.link_to_legals],['Project sign-off',project.link_to_pso],['PCS',project.link_to_pcs]].filter(([,url])=>/^https:\/\//i.test(url||''));
 return <IEQueryState query={query}>{query.data&&<div className="space-y-5">
  {!!links.length&&<div className="flex flex-wrap gap-5">{links.map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"><ExternalLink className="h-4 w-4"/>{label}</a>)}</div>}
  <ProjectDraftingTab project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts} accountMap={accountMap} psoChecks={psoChecks} readOnly/>
  {query.hasNextPage&&<Button variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more documents'}</Button>}
 </div>}</IEQueryState>;
}