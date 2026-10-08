import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {approvalList,approvalSummary,approvalOptions,approvalDetail} from '../../shared/documentApprovalReads.ts';
import {decideDocumentApproval} from '../../shared/documentApprovalDecision.ts';
import {receiveDocumentApproval} from '../../shared/documentApprovalIntake.ts';
import {syncDocumentApprovalPage} from '../../shared/documentApprovalSync.ts';
const address=value=>typeof value==='string' ? value.trim().toLowerCase() : '';
const validId=value=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
export default async function(req: Request): Promise<Response> {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in to use approvals.'},{status:401});
  const input=await req.json(),email=address(user.email);
  if(!email)return Response.json({error:'A verified portal email is required.'},{status:403});
  const grants=base44.asServiceRole.entities.ApprovalAccess;
  if(['contactAccess','setContactAccess'].includes(input.action)) {
   if(user.role!=='admin')return Response.json({error:'Only administrators can manage approval access.'},{status:403});
   if(!validId(input.contactId))return Response.json({error:'Choose a person.'},{status:400});
   const contact=await base44.entities.Contact.get(input.contactId),contactEmail=address(contact?.email);
   if(!contact)return Response.json({error:'Person not found.'},{status:404});
   if(!contactEmail)return Response.json({email:'',enabled:false,notice:'Add a portal email before granting approval access.'});
   if(input.action==='contactAccess')return Response.json({email:contactEmail,enabled:(await grants.count({email:contactEmail,enabled:true}))>0});
   if(typeof input.enabled!=='boolean')return Response.json({error:'Choose whether approval access is enabled.'},{status:400});
   const previous=await grants.filter({email:contactEmail},{limit:1});
   if(previous.items[0] && previous.items[0].contact_id!==contact.id)return Response.json({error:'This portal email is already linked to another person’s approval access. Review the duplicate person records first.'},{status:409});
   await grants.upsert([{email:contactEmail,contact_id:contact.id,enabled:input.enabled,changed_by:user.id,changed_at:new Date().toISOString()}],{key:'email'});
   return Response.json({email:contactEmail,enabled:input.enabled});
  }
  if(input.action==='syncDocuments'){
   if(user.role!=='admin')return Response.json({error:'Only administrators can synchronise document approvals.'},{status:403});
   return Response.json(await syncDocumentApprovalPage(base44,input));
  }
  if(input.action==='receive')return Response.json(await receiveDocumentApproval(base44,user,input));
  const enabled=(await grants.count({email,enabled:true}))>0;
  if(input.action==='access')return Response.json({enabled});
  if(!enabled)return Response.json({error:'Approval access has not been granted, or has been revoked.'},{status:403});
  if(['respond','retry','detail','history'].includes(input.action) && !validId(input.requestId))return Response.json({error:'Choose an approval.'},{status:400});
  if(input.action==='summary')return Response.json(await approvalSummary(base44,user));
  if(input.action==='options')return Response.json(await approvalOptions(base44,user));
  if(input.action==='list')return Response.json(await approvalList(base44,user,input));
  if(input.action==='detail')return Response.json(await approvalDetail(base44,user,input.requestId));
  if(input.action==='history'){
   await approvalDetail(base44,user,input.requestId);
   if(typeof input.cursor!=='string' || input.cursor.length>2000)throw new Error('Invalid history cursor.');
   return Response.json(await base44.asServiceRole.entities.DocumentApprovalEvent.filter({approval_id:input.requestId},{sort:'occurred_at',limit:50,cursor:input.cursor}));
  }
  if(['respond','retry'].includes(input.action))return Response.json(await decideDocumentApproval(base44,user,input));
  return Response.json({error:'Unknown approval operation.'},{status:400});
 } catch(error) {return Response.json({error:error.message || 'Unable to load approvals.'},{status:400});}
}