import {withProjectNumberLease} from './projectNumberLease.ts';
import {projectApprovalWriteContext,writeProjectApproval} from './projectApprovalDataverse.ts';
export const projectRejectionReasons=['Duplicate','No Sharepoint Folder','No PCS','No PSO','Other (Comments Added)'];
export async function decideProjectApproval(base44,user,input) {
 const db=base44.asServiceRole.entities;
 return withProjectNumberLease(base44,async(counter,assertLease)=>{
  let request=await db.ProjectApproval.get(input.requestId);
  if(request.status!=='pending')throw new Error('This project already has a decision. Refresh approvals.');
  if(request.response){if(input.action!=='retry' || (request.decided_by_id!==user.id && user.role!=='admin'))throw new Error('A decision is already recorded. Only its approver or an administrator can retry it.');}
  else {
   if(!['Approve','Reject'].includes(input.response) || typeof input.comments!=='string' || input.comments.length>4000)throw new Error('Choose Approve or Reject and keep comments within 4,000 characters.');
   if(input.response==='Reject' && (!projectRejectionReasons.includes(input.reason) || (input.reason==='Other (Comments Added)' && !input.comments.trim())))throw new Error('A rejection reason is required; Other also requires comments.');
  }
  const project=await db.Project.get(request.project_id);
  const context=await projectApprovalWriteContext(base44,user,project);
  if(!request.response){request=await db.ProjectApproval.update(request.id,{response:input.response,rejection_reason:input.response==='Reject' ? input.reason : '',comments:input.comments.trim(),decided_by_id:user.id,decided_by_name:user.full_name || user.email,decided_at:new Date().toISOString(),writeback_status:'pending'});}
  try {
   if(request.response==='Approve' && !request.assigned_project_number){
    const number=counter.last_used+1,formatted=`${counter.prefix}${number}`;
    if(!Number.isSafeInteger(number) || number>999999999)throw new Error('The project counter is out of range.');
    const [projects,reserved]=await Promise.all([db.Project.filter({project_number:formatted},{limit:2,fields:['id']}),db.ProjectApproval.filter({assigned_project_number:formatted},{limit:2,fields:['id']})]);
    if(projects.has_more || reserved.has_more || projects.items.some(row=>row.id!==project.id) || reserved.items.some(row=>row.id!==request.id))throw new Error(`${formatted} is already in use or reserved. Correct the project counter before retrying; existing numbers will not be overwritten.`);
    await assertLease();
    await db.ProjectNumberCounter.update(counter.id,{last_used:number,pending_request_id:request.id,pending_number:number,changed_at:new Date().toISOString(),changed_by:user.id});
    request=await db.ProjectApproval.update(request.id,{assigned_number:number,assigned_project_number:formatted});
    await db.ProjectNumberCounter.update(counter.id,{pending_request_id:'',pending_number:0});
   }
   const values={approval_status:request.response==='Approve' ? 'Approved' : 'Rejected',...(request.response==='Approve' ? {project_number:request.assigned_project_number} : {})};
   await assertLease();await writeProjectApproval(context,values);await assertLease();
   await db.Project.update(project.id,values);
   await db.ProjectApproval.update(request.id,{status:request.response==='Approve' ? 'approved' : 'rejected',writeback_status:'confirmed',integration_error:''});
   return {ok:true,notice:request.response==='Approve' ? `Project approved as ${request.assigned_project_number}.` : 'Project rejected. The reason has been recorded.'};
  }catch(error){await db.ProjectApproval.update(request.id,{writeback_status:'error',integration_error:String(error.message).slice(0,1000)});return {ok:false,notice:'Decision recorded but not completed. Retry the saved decision.',error:error.message};}
 });
}