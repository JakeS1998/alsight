import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  let stage = 'administrator check';
  try {
    const client = createClientFromRequest(req);
    const administrator = await client.auth.me();
    if (!administrator || administrator.role !== 'admin') return Response.json({error:'Only administrators can manage portal access.'},{status:403});
    const {contactId} = await req.json();
    if (typeof contactId !== 'string' || !contactId || contactId.length > 100) return Response.json({error:'Invalid person selected.'},{status:400});
    stage = 'person lookup';
    const contact = await client.entities.Contact.get(contactId);
    stage = 'portal identity lookup';
    const users = contact.email ? await client.entities.User.filter({email:contact.email.trim().toLowerCase()},'-created_date',1) : [];
    const identity = users[0];
    stage = 'pending invitation lookup';
    const pendingPage = await client.entities.PendingPortalAccess.filter({contact_id:contact.id},{limit:1});
    const pending = pendingPage.items[0] || null;
    const organisationId = identity?.account_id || pending?.account_id;
    const accountQuery = organisationId ? {dataverse_id:organisationId} : contact.company_number ? {company_number:contact.company_number} : contact.company_name ? {$or:[{company_name:contact.company_name},{name:contact.company_name}]} : null;
    stage = 'organisation lookup';
    const accounts = accountQuery ? (await client.entities.Account.filter(accountQuery,{limit:1})).items : [];
    const user = identity ? Object.fromEntries(['id','role','duty_roles','staff_aad_id','account_id','region'].map(key=>[key,identity[key]])) : null;
    return Response.json({user,pending,accounts});
  } catch (error) {
    console.error('Portal access lookup failed',{stage,message:error.message});
    return Response.json({error:`Portal access could not be loaded (${stage}): ${error.message}`},{status:500});
  }
}