export async function notifyPQApprover(base44,round){
 if(round.status!=='active')return {};
 const step=round.steps[round.current_index];
 try {
  await base44.asServiceRole.integrations.Core.SendEmail({to:step.email,from_name:'ALS Hub',template_name:'PQApprovalRequest',variables:{project_name:round.project_name,reference:round.reference,step_number:String(round.current_index+1),step_count:String(round.steps.length),review_url:`https://alsight.base44.app/pq-approvals/${round.id}`}});
  await base44.asServiceRole.entities.PQApprovalRound.update(round.id,{notification_status:'sent'});
  return {};
 }catch(error){
  await base44.asServiceRole.entities.PQApprovalRound.update(round.id,{notification_status:'failed'});
  return {warning:'The approval change was saved, but the email notification could not be sent. Share the review link with the current approver; they can request their verification code there.'};
 }
}