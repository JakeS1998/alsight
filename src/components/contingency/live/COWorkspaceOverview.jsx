import React from 'react';
import COUpdates from '@/components/contingency/live/COUpdates';
export default function COWorkspaceOverview({data}){
 const active=['active','recovering'].includes(data.incident?.status);
 return <div className="space-y-4"><section className="cc-panel"><h2>Contingency workspace</h2><p className="mt-3 text-sm text-muted-foreground">{active?'Use Documents to download files and access the latest contingency working copies, Records for replicated information, and Recovery to review the return to normal.':'The workspace is on standby. Employee access to copied records and documents opens after approved incident activation.'}</p>{data.incident?.status==='active'&&data.membership.can_edit&&<p className="mt-2 text-sm text-muted-foreground">Upload edited files from their document details; replacements remain in contingency until approved recovery.</p>}</section><COUpdates data={data}/></div>;
}