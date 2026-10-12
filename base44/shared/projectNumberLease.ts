import {projectCounter} from './projectApprovalIntake.ts';
export async function withProjectNumberLease(base44,work) {
 const db=base44.asServiceRole.entities,counter=await projectCounter(base44),token=crypto.randomUUID();
 const claimed=await db.ProjectNumberCounter.updateMany({id:counter.id,lease_until:{$lt:new Date().toISOString()}},{$set:{lease_token:token,lease_until:new Date(Date.now()+240000).toISOString()}});
 if(!claimed.updated){const error=new Error('Another project decision or counter change is being processed. Please retry shortly.');error.status=409;throw error;}
 const assertLease=async()=>{const fresh=await db.ProjectNumberCounter.get(counter.id);if(fresh.lease_token!==token || Date.parse(fresh.lease_until)<=Date.now())throw new Error('Project numbering lock expired. Please retry.');return fresh;};
 try{
  let fresh=await assertLease();
  if(fresh.pending_request_id){
   const request=await db.ProjectApproval.get(fresh.pending_request_id);
   if(request.response!=='Approve')throw new Error('An incomplete number reservation needs administrator attention.');
   await db.ProjectApproval.update(request.id,{assigned_number:fresh.pending_number,assigned_project_number:`${fresh.prefix}${fresh.pending_number}`});
   await db.ProjectNumberCounter.update(counter.id,{pending_request_id:'',pending_number:0});
   fresh=await assertLease();
  }
  return await work(fresh,assertLease);
 }finally{await db.ProjectNumberCounter.updateMany({id:counter.id,lease_token:token},{$set:{lease_token:'',lease_until:'1970-01-01T00:00:00.000Z'}});}
}