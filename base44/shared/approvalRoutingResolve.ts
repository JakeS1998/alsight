import {loadApprovalRouting,approvalRelatedRules,liveApproverRoles} from './approvalRoutingConfig.ts';
import {withPortalUserNames} from './portalUserNames.ts';
const address=value=>String(value || '').trim().toLowerCase();
const identity=value=>String(value || '').toLowerCase();
const reference=(document,project,rule)=>identity((rule.document ? document : project)?.[rule.field]);
export async function resolveApprovalRouting(base44,table,pairs) {
 if(pairs.length>50)throw new Error('Resolve up to 50 approval documents at once.');
 const config=await loadApprovalRouting(base44,table),db=base44.asServiceRole.entities;
 const rules=(config.related_rules || []).map(key=>({key,...approvalRelatedRules[key]}));
 const refs=[...new Set(pairs.flatMap(({document,project})=>rules.map(rule=>reference(document,project,rule))).filter(Boolean))];
 const contacts=refs.length ? (await db.Contact.filter({$or:[{id:{$in:refs}},{dataverse_id:{$in:refs}},{aad_id:{$in:refs}}]},{limit:500,fields:['dataverse_id','aad_id','full_name','email']})).items : [];
 const staffRefs=[...new Set(pairs.flatMap(({document,project})=>rules.filter(rule=>rule.kind==='staff').map(rule=>reference(document,project,rule))).filter(Boolean))];
 const guids=staffRefs.filter(id=>/^[0-9a-f-]{36}$/.test(id)),portalIds=staffRefs.filter(id=>/^[0-9a-f]{24}$/.test(id));
 const users=guids.length ? await db.User.filter({$or:[{staff_aad_id:{$in:guids}},{dataverse_systemuser_id:{$in:guids}}]},'full_name',500) : [];
 for(let start=0;start<portalIds.length;start+=4){
  const batch=await Promise.allSettled(portalIds.slice(start,start+4).map(id=>db.User.get(id)));
  for(const result of batch){
   if(result.status==='rejected' && (result.reason?.response?.status || result.reason?.status)!==404)throw result.reason;
   if(result.status==='fulfilled' && result.value && !users.some(u=>u.id===result.value.id))users.push(result.value);
  }
 }
 const candidates=pairs.map(({document,project})=>{
  const reasons=[],emails=new Set((config.named_emails || []).map(address));
  for(const rule of rules){
   const ref=reference(document,project,rule);
   if(!ref){reasons.push(`${rule.label}: not assigned.`);continue;}
   const matches=rule.kind==='staff' ? users.filter(u=>[u.id,u.staff_aad_id,u.dataverse_systemuser_id].some(id=>identity(id)===ref)) : contacts.filter(c=>[c.id,c.dataverse_id,c.aad_id].some(id=>identity(id)===ref));
   const found=[...new Set(matches.map(p=>address(p.email)).filter(Boolean))];
   if(found.length!==1){reasons.push(`${rule.label}: ${found.length ? 'ambiguous identity' : 'no matching portal email'}.`);continue;}
   emails.add(found[0]);
  }
  return {document,project,emails:[...emails].filter(Boolean),reasons};
 });
 const emails=[...new Set(candidates.flatMap(c=>c.emails))];
 const grants=emails.length ? (await db.ApprovalAccess.filter({email:{$in:emails},enabled:true},{limit:500,fields:['email']})).items : [];
 const emailUsers=emails.length ? await withPortalUserNames(db,await db.User.filter({$or:emails.map(email=>({email:{$regex:`^${email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,$options:'i'}}))},'full_name',500)) : [];
 return {config,results:candidates.map(candidate=>{
  const reasons=[...candidate.reasons],approvers=[];
  if(config.enabled)for(const email of candidate.emails){
   const people=emailUsers.filter(u=>address(u.email)===email);
   if(!grants.some(g=>address(g.email)===email))reasons.push(`${email}: approval access has not been granted.`);
   else if(people.length!==1 || !liveApproverRoles.includes(people[0].role))reasons.push(`${email}: needs a registered internal portal account for live Dataverse approvals.`);
   else approvers.push({email,name:people[0].full_name || email});
  }
  return {...candidate,emails:approvers.map(a=>a.email),approvers,reasons:config.enabled ? reasons : ['Routing is disabled for this table.']};
 })};
}