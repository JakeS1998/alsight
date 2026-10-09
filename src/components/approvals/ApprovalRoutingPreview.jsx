import React, {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import FlowRecordPicker from '@/components/dataverse/FlowRecordPicker';
import approvalClient from '@/components/approvals/approvalClient';
export default function ApprovalRoutingPreview({table,title,revision}) {
 const [recordId,setRecordId]=useState('');
 const result=useQuery({queryKey:['approval-routing-preview',table,recordId,revision],enabled:!!recordId,retry:false,queryFn:()=>approvalClient('routingPreview',{table,recordId})});
 return <section className="space-y-3 rounded-panel border border-border bg-card p-5"><div><h3 className="font-heading text-lg font-semibold">Check recipients · {title}</h3><p className="text-sm text-muted-foreground">Choose a document to see who the saved routing rule resolves to. This check does not send an approval.</p></div><FlowRecordPicker table={table} selected={recordId} onSelect={setRecordId}/>
  {recordId && (result.isPending ? <p role="status" className="text-sm text-muted-foreground">Resolving recipients…</p> : result.isError ? <p role="alert" className="text-sm text-destructive">{result.error.message}</p> : <div className="space-y-2 text-sm"><p className="font-semibold">{result.data.document} · {result.data.project}</p>{result.data.approvers.length ? <ul className="space-y-1">{result.data.approvers.map(person=><li key={person.email}>{person.name} · {person.email}</li>)}</ul> : <p>No eligible recipients.</p>}{result.data.reasons.map(reason=><p key={reason} className="text-muted-foreground">{reason}</p>)}</div>)}
 </section>;
}