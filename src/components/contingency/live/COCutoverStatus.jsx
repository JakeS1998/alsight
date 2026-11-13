import React from 'react';
export default function COCutoverStatus({incident}){
 const d=incident?.details;if(!d?.cutover_at)return null;
 const date=new Date(d.cutover_at).toLocaleString('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
 return <div className="rounded-panel border border-contingency bg-contingency-pale p-4" role="status"><strong>Return to live scheduled: {date} · Europe/London</strong><p className="mt-2 text-sm">Continue working in contingency until 21:00. At cutover, editing freezes while independently approved changes are written to Microsoft and verified. Contingency access closes and normal synchronisation resumes only when all changes are verified or explicitly excluded.</p>{d.cutover_state&&<p className="mt-2 text-sm">Cutover: {d.cutover_state.replaceAll('_',' ')}</p>}{d.cutover_error&&<p className="mt-2 text-sm text-destructive">{d.cutover_error}</p>}</div>;
}