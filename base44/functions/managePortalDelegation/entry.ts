import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
const levels={admin:0,director:0,regional_director:1,bdm:2,bsm:2,finance:2};
export default async function(req){
 try{
  const b=createClientFromRequest(req),u=await b.auth.me().catch(e=>e.status===401?null:Promise.reject(e));
  if(!u)return Response.json({error:'Sign in to manage delegation.'},{status:401});
  const input=await req.json().catch(()=>({}));
  if(!['start','end'].includes(input.action))return Response.json({error:'Choose a valid delegation action.'},{status:400});
  const E=b.asServiceRole.entities;
  if(input.action==='end'){await E.User.update(u.id,{delegate_of:null,delegate_of_name:null,delegate_region:null});return Response.json({ok:true});}
  if(!Object.hasOwn(levels,u.role))return Response.json({error:'Only eligible internal staff can start cover.'},{status:403});
  if(typeof input.contactId!=='string'||!input.contactId||input.contactId.length>100)return Response.json({error:'Choose a colleague.'},{status:400});
  const contact=await E.Contact.get(input.contactId).catch(e=>e.status===404?null:Promise.reject(e));
  if(!contact||contact.status==='inactive'||!contact.aad_id)return Response.json({error:'This colleague needs an active linked portal account.'},{status:400});
  let target=await E.User.get(contact.aad_id).catch(e=>e.status===404?null:Promise.reject(e));
  if(!target&&contact.email)target=(await E.User.filter({email:contact.email.trim().toLowerCase()},'-created_date',1))[0];
  if(!target||contact.email&&target.email?.toLowerCase()!==contact.email.trim().toLowerCase())return Response.json({error:'The colleague’s portal identity must be reviewed by an administrator.'},{status:409});
  if(!Object.hasOwn(levels,target.role)||u.role!=='admin'&&levels[target.role]>levels[u.role])return Response.json({error:'This colleague is outside the permitted delegation hierarchy.'},{status:403});
  if(target.id===u.id)return Response.json({error:'Choose another colleague.'},{status:400});
  const region=target.region||target.data?.region||null;
  if(target.role==='regional_director'&&(!region||input.region!==region))return Response.json({error:'Choose the regional director’s assigned region; arbitrary regional access is not permitted.'},{status:400});
  await E.User.update(u.id,{delegate_of:target.staff_aad_id||target.data?.staff_aad_id||contact.aad_id,delegate_of_name:target.full_name||contact.full_name,delegate_region:target.role==='regional_director'?region:null});
  return Response.json({ok:true});
 }catch(e){return Response.json({error:'Delegation could not be updated.'},{status:[400,401,403,404,409,429].includes(e.status)?e.status:500});}
}