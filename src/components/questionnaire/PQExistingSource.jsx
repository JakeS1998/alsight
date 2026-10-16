import React from 'react';
import {Button} from '@/components/ui/button';
export default function PQExistingSource({data,loading,onRetry}){
 const source=data.record?.source_import,approval=data.recordedApproval;
 return <div className="space-y-2 text-sm">
  {data.locked&&<p className="rounded-md border border-border bg-muted p-3">Read-only: a project number has been assigned. Questionnaire answers cannot be changed or reopened.</p>}
  {approval&&<p role="status" className="rounded-md border border-success/30 bg-success/10 p-3 text-success">PQ approved · {new Date(approval.approvedAt).toLocaleDateString('en-GB')} · Existing project PQ date. This records the project’s existing approval, not a new sequential approval.</p>}
  {source?.status==='imported'&&<p className="text-muted-foreground">Populated from {source.document_name}. Fields not found in the source remain blank.</p>}
  {source?.status==='error'&&<div role="alert" className="space-y-2 rounded-md border border-destructive/30 p-3"><p className="text-destructive">Questionnaire import could not be completed: {source.error}</p><Button type="button" size="sm" variant="outline" disabled={loading} onClick={onRetry}>Retry SharePoint import</Button></div>}
  {data.locked&&data.sourceUrl&&!approval&&<p className="text-muted-foreground">No project PQ approval date is recorded. No automatic approval has been applied.</p>}
 </div>;
}