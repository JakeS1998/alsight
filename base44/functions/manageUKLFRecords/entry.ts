import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {withUKLFRecordLease} from '../../shared/uklfRecordLease.ts';
import {createMissingUKLFRecords} from '../../shared/uklfRecordCreation.ts';
import {uklfProjectFields} from '../../shared/uklfRecordValues.ts';
export default async function(req: Request): Promise<Response> {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user || user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
  const input=await req.json(),db=base44.entities;
  if(!['status','backfill','ensure'].includes(input.action))return Response.json({error:'Invalid UKLF operation.'},{status:400});
  if(input.action==='status'){const page=await db.UKLFRecordSyncState.filter({key:'primary'},{limit:1});return Response.json({state:page.items[0] || {status:'idle',processed:0,created:0,reused:0,conflicts:[]},eligible:await db.Project.count({procurement_route:true})});}
  if(input.action==='ensure' && (typeof input.projectId!=='string' || !/^[a-f0-9]{24}$/i.test(input.projectId)))return Response.json({error:'Valid project required.'},{status:400});
  const result=await withUKLFRecordLease(base44,async(state,assertLease)=>{
   if(input.action==='ensure'){const project=await db.Project.get(input.projectId);return await createMissingUKLFRecords(base44,project ? [project] : [],assertLease);}
   const restart=state.status==='completed';
   const page=await db.Project.filter({procurement_route:true},{sort:'id',limit:50,fields:uklfProjectFields,...(!restart && state.cursor ? {cursor:state.cursor} : {})});
   const output=await createMissingUKLFRecords(base44,page.items,assertLease);
   await assertLease();
   const updated=await db.UKLFRecordSyncState.update(state.id,{status:page.has_more ? 'running' : 'completed',cursor:page.has_more ? page.next_cursor : '',processed:(restart ? 0 : state.processed || 0)+page.items.length,created:(restart ? 0 : state.created || 0)+output.created,reused:(restart ? 0 : state.reused || 0)+output.reused,conflicts:[...(restart ? [] : state.conflicts || []),...output.conflicts].slice(0,200),...(!page.has_more ? {last_completed_at:new Date().toISOString()} : {})});
   return {state:updated,has_more:page.has_more};
  });
  return Response.json(result);
 }catch(error){return Response.json({error:error.message},{status:error.status || 500});}
}