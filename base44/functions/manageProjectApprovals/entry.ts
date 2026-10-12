import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {receiveProjectApproval,projectRoute} from '../../shared/projectApprovalIntake.ts';
import {decideProjectApproval} from '../../shared/projectApprovalDecision.ts';
import {projectNumberAdmin} from '../../shared/projectNumberAdmin.ts';
import {liveApproverRoles} from '../../shared/approvalRoutingConfig.ts';
export default async function(req:Request):Promise<Response>{
 let action='',attempt=1,allowWait=false;
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in to use project approvals.'},{status:401});
  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405});
  const raw=await req.text();if(raw.length>12000)throw new Error('Request is too large.');
  const input=JSON.parse(raw),db=base44.asServiceRole.entities,email=user.email.trim().toLowerCase();
  action=input.action;attempt=input.attempt ?? 1;allowWait=input.allowWait===true;
  if(!Number.isInteger(attempt) || attempt<1 || attempt>30)throw new Error('Invalid approval intake retry.');
  const validId=value=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
  if(['counter','setCounter','receive'].includes(input.action)){
   if(user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
   if(input.action==='receive'){if(!validId(input.projectId))throw new Error('Choose a project.');return Response.json(await receiveProjectApproval(base44,input.projectId));}
   return Response.json(await projectNumberAdmin(base44,user,input));
  }
  if(!liveApproverRoles.includes(user.role) || !(await db.ApprovalAccess.count({email,enabled:true})))return Response.json({error:'Internal approval access is required.'},{status:403});
  if(input.action==='list'){
   if(!['pending','approved','rejected','all'].includes(input.view) || (input.cursor && (typeof input.cursor!=='string' || input.cursor.length>4000)))throw new Error('Invalid approval view.');
   const query={...(input.view==='all' ? {} : {status:input.view}),...(user.role==='admin' ? {} : {approver_emails:email})};
   const [page,total]=await Promise.all([db.ProjectApproval.filter(query,{sort:'-created_date',limit:20,cursor:input.cursor}),db.ProjectApproval.count(query)]);
   return Response.json({...page,total});
  }
  if(!['respond','retry'].includes(input.action) || !validId(input.requestId))throw new Error('Choose a project approval operation.');
  const route=await projectRoute(base44),request=await db.ProjectApproval.get(input.requestId);
  const retryAdmin=input.action==='retry' && user.role==='admin' && Boolean(request.response);
  if(!retryAdmin && (!route.enabled || !route.named_emails.includes(email) || !request.approver_emails.includes(email)))return Response.json({error:'This project approval is not assigned to you.'},{status:403});
  return Response.json(await decideProjectApproval(base44,user,input));
 }catch(error){
  if(error.status===409 && action==='receive' && allowWait)return Response.json({busy:true,attempt});
  return Response.json({error:error.message || 'Unable to complete project approval.'},{status:error.status===409 ? 409 : 400});
 }
}