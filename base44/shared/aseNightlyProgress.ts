import {gazetteWaitSeconds} from './aseProviderPolicy.ts';
export const outsideASENight=(run,now=new Date())=>run.scheduled===true && gazetteWaitSeconds(now)>0;
export const stalledASERun=(run,now=new Date())=>!Number.isFinite(Date.parse(run.last_activity)) || now.getTime()-Date.parse(run.last_activity)>900000;
export async function resumeNightlyASE(base44,run) {
  if(run.pause_requested) return {skipped:true,runId:run.id,reason:'This portfolio run was manually paused; its saved progress is preserved.'};
  // Invalidate old continuation tickets and ensure the entity trigger sees a fresh queued transition.
  if(run.status==='queued') await base44.entities.ASEAutomationRun.update(run.id,{status:'paused',dispatch_token:''});
  const resumed=await base44.entities.ASEAutomationRun.update(run.id,{status:'queued',scheduled:true,pause_requested:false,dispatch_token:'',waiting_until:'',error:'',last_activity:new Date().toISOString()});
  return {run:resumed,resumed:true};
}
export function nightlyProgressRules() {
  const run={scheduled:true,cursor:'saved-page',active_job_id:'saved-company',processed_count:42};
  return {nightlyContinuesAtNight:!outsideASENight(run,new Date('2026-10-06T21:15:00Z')),nightlyStopsInDay:outsideASENight(run,new Date('2026-10-07T07:00:00Z')),manualDaytimeUnchanged:!outsideASENight({...run,scheduled:false},new Date('2026-10-07T12:00:00Z')),stalledRunRecoverable:stalledASERun({last_activity:'2026-10-05T21:15:00Z'},new Date('2026-10-06T21:15:00Z')),liveRunNotRestarted:!stalledASERun({last_activity:'2026-10-06T21:14:00Z'},new Date('2026-10-06T21:15:00Z'))};
}