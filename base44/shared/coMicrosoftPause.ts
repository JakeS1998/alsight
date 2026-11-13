import {fail,incident} from './coCore.ts';
import {cutoverDue,recoveryAuthorised} from './coCutoverTime.ts';
export async function microsoftSyncPause(b){
 const paused=await b.asServiceRole.entities.COIncident.count({status:{$in:['active','recovering']}});
 return paused?{skipped:true,paused:true,status:'paused',continue:false,reason:'Microsoft synchronisation is suspended until contingency write-back is verified and the incident is closed.'}:null;
}
export async function assertMicrosoftSync(b,recovery=false){
 if(recovery){const i=await incident(b);if(!i||!['active','recovering'].includes(i.status))return;if(i.status==='recovering'&&cutoverDue(i)&&recoveryAuthorised(i))return;}
 if(await microsoftSyncPause(b)){const error=new Error('Microsoft synchronisation is paused for contingency. Only approved evening recovery may contact Microsoft.');error.status=409;error.code='CONTINGENCY_SYNC_PAUSED';throw error;}
}