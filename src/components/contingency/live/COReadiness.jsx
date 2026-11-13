import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {coCall} from '@/components/contingency/live/useContingencyOperations';
import {Button} from '@/components/ui/button';
export default function COReadiness(){
 const q=useQuery({queryKey:['co','readiness'],queryFn:()=>coCall('readiness'),staleTime:60000,retry:false});
 return <section className="cc-panel"><div className="flex flex-wrap items-center justify-between gap-3"><h2>Outage readiness</h2><Button variant="outline" disabled={q.isFetching} onClick={()=>q.refetch()}>{q.isFetching?'Reviewing readiness…':'Refresh readiness'}</Button></div>
 {q.isPending?<p className="mt-3 text-sm text-muted-foreground">Loading backup coverage and recorded evidence…</p>:q.isError?<p className="mt-3 text-sm text-destructive" role="alert">{q.error.message}</p>:<>
 <p className="mt-3 font-semibold">{q.data.operational_checks_complete?'Operational checks complete; business-owner acceptance still required.':'Not ready for reliance during a real outage.'}</p>
 <p className="mt-2 text-sm text-muted-foreground">{q.data.source_count} enabled sources · {q.data.configured_project_sources} project-folder sources / {q.data.linked_projects} linked projects · {q.data.open_file_exceptions} open file exceptions</p>
 {!!q.data.blockers.length&&<ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{q.data.blockers.map(text=><li key={text}>{text}</li>)}</ul>}
 {!!q.data.warnings?.length&&<div className="mt-4 rounded-panel border border-contingency/30 bg-contingency-pale p-3"><h3 className="text-sm font-semibold">Non-blocking coverage warnings</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{q.data.warnings.map(text=><li key={text}>{text}</li>)}</ul><p className="mt-2 text-xs text-muted-foreground">Affected projects and link errors are listed below in Project legal-folder backups. Readiness applies to configured sources, not the flagged missing documents.</p></div>}
 <p className="mt-3 text-sm text-muted-foreground">Record genuine results in Sources & access → Operational readiness evidence. Use the Testing Agent in the side panel for the rehearsal, including “Download, edit and re-upload a contingency document without writing to SharePoint” and “Confirm that a second administrator is required for activation and recovery”. Restoration and outage sign-in must also be demonstrated.</p>
 <p className="mt-2 text-xs text-muted-foreground">This summary reviews all enabled source cadences, not just the first page. It does not run acceptance tests or grant approval.</p>
 </>}
 </section>;
}