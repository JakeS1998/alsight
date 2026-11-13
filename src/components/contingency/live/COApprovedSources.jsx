import React from 'react';
import {Button} from '@/components/ui/button';
export default function COApprovedSources({data,run,busy}){
 return <section className="cc-panel"><h2>Approved backup coverage</h2>
 {!data.datasets.length?<p className="mt-3 text-sm text-muted-foreground">No approved sources yet.</p>:<div className="mt-4 space-y-2">{data.datasets.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-panel border p-3">
 <span>{d.label} · {d.enabled?'Enabled':'Disabled'}<span className="block text-xs text-muted-foreground">{d.kind==='dataverse'?(d.scope_ids?.length?`${d.scope_ids.length} approved records`:'Whole-table reads'):'Approved document folder'}</span></span>
 <Button variant="outline" disabled={busy} onClick={()=>run('source_review',{id:d.id,enabled:!d.enabled})}>{d.enabled?'Disable':'Enable'}</Button>
 {d.kind==='dataverse'&&!!d.scope_ids?.length&&<Button variant="outline" disabled={busy} onClick={()=>{if(window.confirm('Approve ongoing reads of the whole configured table? This resets readiness evidence but does not activate users or authorise Microsoft writes.'))run('source_expand',{id:d.id,confirmation:'APPROVE ESTATE READS'});}}>Approve whole-table reads</Button>}
 </div>)}</div>}</section>;
}