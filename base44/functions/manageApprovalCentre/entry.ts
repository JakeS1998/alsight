import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
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
  const enabled=(await grants.count({email,enabled:true}))>0;
  if(input.action==='access')return Response.json({enabled});
  if(!enabled)return Response.json({error:'Approval access has not been granted, or has been revoked.'},{status:403});
  if(input.action!=='list')return Response.json({error:'Unknown approval operation.'},{status:400});
  if(!['pending','history'].includes(input.view) || (input.cursor!==undefined && (typeof input.cursor!=='string' || input.cursor.length>2000)))return Response.json({error:'Invalid approval view.'},{status:400});
  // The service-role read is deliberately restricted to this authenticated assignee.
  // Direct request-entity access is administrator-only; a self-edited User flag cannot grant access.
  const page=await base44.asServiceRole.entities.DocumentApprovalRequest.filter({approver_email:email,status:input.view==='pending' ? 'pending' : {$in:['approved','rejected','superseded']}},{sort:'-created_date',limit:25,...(input.cursor ? {cursor:input.cursor} : {}),fields:['document_title','source_table','document_url','status','decision_comments','decided_by_name','decided_at','writeback_status','created_date']});
  return Response.json({items:page.items,next_cursor:page.next_cursor,has_more:page.has_more});
 } catch(error) {return Response.json({error:error.message || 'Unable to load approvals.'},{status:400});}
}