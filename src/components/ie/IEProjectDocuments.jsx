import React from 'react';
import {ExternalLink} from 'lucide-react';
import IEPanel from '@/components/ie/IEPanel';
import IEProjectDocumentList from '@/components/ie/IEProjectDocumentList';
export default function IEProjectDocuments({engagementId,project}){
 const links=[['Project documents folder',project.link_to_legals],['Project Questionnaire',project.link_to_project_questionnaire],['RIBA 4 report',project.link_to_riba4_report],['Project sign-off',project.link_to_pso],['PCS',project.link_to_pcs]].filter(([,url])=>/^https:\/\//i.test(url||''));
 return <div className="space-y-5">
  <IEPanel title={`${project.project_number} documents`} description="Documents from the linked project. SharePoint permissions apply.">
   {links.length?<div className="flex flex-wrap gap-5">{links.map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"><ExternalLink className="h-4 w-4"/>{label}</a>)}</div>:<p className="text-sm text-muted-foreground">No project folder or report links recorded.</p>}
  </IEPanel>
  {[['legal','Legal documents'],['dma','Development Management Agreements'],['jct','Construction contracts']].map(([kind,title])=><IEProjectDocumentList key={kind} engagementId={engagementId} kind={kind} title={title}/>)}
 </div>;
}