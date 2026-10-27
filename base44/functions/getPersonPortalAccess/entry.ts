import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  let stage = 'administrator check';
  try {
    const client = createClientFromRequest(req);
    const administrator = await client.auth.me().catch(error=>error.status===401?null:Promise.reject(error));
    if(!administrator)return Response.json({error:'Sign in to manage portal access.'},{status:401});
    if (administrator.role !== 'admin') return Response.json({error:'Only administrators can manage portal access.'},{status:403});
    const {contactId,action='read',pageAccess} = await req.json().catch(()=>({}));
    if(!['read','savePageAccess'].includes(action))return Response.json({error:'Unknown portal access operation.'},{status:400});
    if (typeof contactId !== 'string' || !contactId || contactId.length > 100) return Response.json({error:'Invalid person selected.'},{status:400});
    stage = 'person lookup';
    const contact = await client.entities.Contact.get(contactId).catch(error=>error.status===404?null:Promise.reject(error));
    if(!contact)return Response.json({error:'Person not found.'},{status:404});
    stage = 'portal identity lookup';
    // Cross-user identity reads require service scope, after the administrator check above.
    const users = contact.email ? await client.asServiceRole.entities.User.filter({email:contact.email.trim().toLowerCase()},'-created_date',1) : [];
    let identity = users[0];
    if(action==='savePageAccess'){
      const keys=['today','alliance360','network','ie','opportunities','projects','commercial','approvals','framework','insider'];
      if(!identity)return Response.json({error:'This person needs a linked portal account before page access can be changed.'},{status:400});
      if(!pageAccess||typeof pageAccess!=='object'||Array.isArray(pageAccess)||Object.entries(pageAccess).some(([key,value])=>!keys.includes(key)||typeof value!=='boolean'))return Response.json({error:'Choose valid page access settings.'},{status:400});
      stage='saving page access';
      identity=await client.asServiceRole.entities.User.update(identity.id,{page_access:pageAccess});
    }
    stage = 'pending invitation lookup';
    const pendingPage = await client.entities.PendingPortalAccess.filter({contact_id:contact.id},{limit:1});
    const pending = pendingPage.items[0] || null;
    const organisationId = identity?.account_id || pending?.account_id;
    const accountQuery = organisationId ? {dataverse_id:organisationId} : contact.company_number ? {company_number:contact.company_number} : contact.company_name ? {$or:[{company_name:contact.company_name},{name:contact.company_name}]} : null;
    stage = 'organisation lookup';
    const accounts = accountQuery ? (await client.entities.Account.filter(accountQuery,{limit:1})).items : [];
    const user = identity ? Object.fromEntries(['id','role','duty_roles','staff_aad_id','account_id','region','page_access'].map(key=>[key,identity[key]])) : null;
    return Response.json({user,pending,accounts});
  } catch (error) {
    console.error('Portal access lookup failed',{stage,message:error.message});
    return Response.json({error:`Portal access could not be loaded (${stage}): ${error.message}`},{status:500});
  }
}