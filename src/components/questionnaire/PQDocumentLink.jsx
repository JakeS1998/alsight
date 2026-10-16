import React from 'react';
import {ExternalLink,FileSearch,AlertCircle} from 'lucide-react';
import DataverseRecordEdit from '@/components/dataverse/DataverseRecordEdit';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';
export default function PQDocumentLink({project,onUpdated,psoOutstanding=false}){
 const link=project.link_to_project_questionnaire;
 return <DataverseRecordEdit table="projects" record={project} onUpdated={onUpdated}>
  <div className="rounded-xl border border-border bg-card p-4">
   <InlineDataverseField field="link_to_project_questionnaire" label="PQ document link">
    <div className="flex min-w-0 items-center gap-3">
     <FileSearch className="h-4 w-4 shrink-0 text-primary"/>
     <div className="min-w-0 space-y-1">
      <p className="text-sm font-semibold">Project Questionnaire</p>
      {link?<a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm underline underline-offset-4">Open document in SharePoint<ExternalLink className="h-3.5 w-3.5 shrink-0"/></a>:<p className="text-xs text-muted-foreground">No PQ document linked. Add its SharePoint reference using the pencil.</p>}
      {psoOutstanding&&<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><AlertCircle className="h-3 w-3"/>PSO outstanding</span>}
     </div>
    </div>
   </InlineDataverseField>
   <p className="mt-2 text-xs text-muted-foreground">Link changes are saved to Dataverse. The PQ page populates from the saved SharePoint document.</p>
  </div>
 </DataverseRecordEdit>;
}