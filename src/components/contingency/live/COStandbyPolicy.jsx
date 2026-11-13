import React,{useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
export default function COStandbyPolicy({data,run,busy}){
 const[mode,setMode]=useState(data.config.mode),[enabled,setEnabled]=useState(data.config.enabled),[rpo,setRpo]=useState(data.config.policy?.rpo_minutes||60),[rto,setRto]=useState(data.config.policy?.rto_minutes||120),[retention,setRetention]=useState(data.config.policy?.retention_days||365);
 useEffect(()=>{setMode(data.config.mode);setEnabled(data.config.enabled);},[data.config.mode,data.config.enabled]);
 return <section className="cc-panel"><h2>Nightly standby and replication policy</h2>
 <p className="mt-2 text-sm text-muted-foreground">Approved sources sync nightly at 02:00 UK time. After the first full copy, only new files, new folders and changed files are added; unchanged file copies are retained, without opening access to employees. Two-person approval is for incident activation, not for running standby.</p>
 <Button className="my-4" disabled={busy} onClick={()=>run('verify')}>Verify Microsoft sources</Button>
 <div className="mb-4 grid gap-3 md:grid-cols-2">{['dataverse','sharepoint'].map(k=><div className="rounded-panel border p-3" key={k}><strong>{k}</strong><p className="mt-1 text-sm">{data.config.health?.[k]?.ok?'Read check passed':data.config.health?.[k]?.error||'Not checked'}</p></div>)}</div>
 <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();run('settings',{mode,enabled,rpo_minutes:rpo,rto_minutes:rto,retention_days:retention});}}>
 <label>Operating mode<select className="cc-field" value={mode} onChange={e=>setMode(e.target.value)}><option value="pilot">Isolated pilot</option><option value="production">Production standby · 24/7</option></select></label>
 <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Enable nightly standby replication</label>
 {[['RPO target, minutes',rpo,setRpo,60,1440],['RTO target, minutes',rto,setRto,15,1440],['Retention policy, days',retention,setRetention,30,3650]].map(([text,value,set,min,max])=><label key={text}>{text}<input className="cc-field" type="number" min={min} max={max} value={value} required onChange={e=>set(Number(e.target.value))}/></label>)}
 <Button disabled={busy} type="submit">Save standby policy</Button></form>
 {!data.datasets.some(d=>d.enabled)&&<p className="mt-3 text-sm text-destructive">No enabled backup sources are configured. Standby will not copy any records or files until sources are added below.</p>}
 <p className="mt-3 text-xs text-muted-foreground">Nightly syncs start at 02:00 Europe/London and continue in bounded batches until complete; unfinished first copies continue between nightly runs. Microsoft copying remains paused during active incidents, and targets are not uptime guarantees. Retention does not silently purge documents.</p></section>;
}