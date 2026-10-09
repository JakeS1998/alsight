import {approvalTables,approvalRelatedRules,loadApprovalRouting,liveApproverRoles} from './approvalRoutingConfig.ts';
import {resolveApprovalRouting} from './approvalRoutingResolve.ts';
import {approvalEntity} from './documentApprovalRecords.ts';
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export async function approvalRoutingAdmin(base44,user,input) {
 if(user.role!=='admin')throw new Error('Only administrators can configure approval routing.');
 const db=base44.entities;
 if(input.action==='routingStatus')return {rules:await Promise.all(Object.keys(approvalTables).map(table=>loadApprovalRouting(base44,table))),tables:approvalTables,relatedRules:approvalRelatedRules};
 if(input.action==='routingPeople'){
  if(typeof input.search!=='string' || input.search.length>100 || (input.cursor && (typeof input.cursor!=='string' || input.cursor.length>4000)))throw new Error('Invalid person search.');
  const query={email:{$exists:true,$nin:[null,'']},...(input.search.trim() ? {$or:['full_name','email'].map(field=>({[field]:{$regex:escape(input.search.trim()),$options:'i'}}))} : {})};
  const page=await db.Contact.filter(query,{sort:'full_name',limit:20,cursor:input.cursor,fields:['full_name','email','portal_role']});
  const emails=page.items.map(p=>p.email?.trim().toLowerCase()).filter(Boolean);
  const grants=emails.length ? (await db.ApprovalAccess.filter({email:{$in:emails},enabled:true},{limit:100,fields:['email']})).items : [];
  const users=emails.length ? await db.User.filter({$or:emails.map(email=>({email:{$regex:`^${escape(email)}$`,$options:'i'}}))},'full_name',100) : [];
  return {...page,items:page.items.map(p=>({...p,email:p.email.trim().toLowerCase(),enabled:grants.some(g=>g.email===p.email.trim().toLowerCase()) && users.some(u=>u.email?.trim().toLowerCase()===p.email.trim().toLowerCase() && liveApproverRoles.includes(u.role))}))};
 }
 if(!approvalTables[input.table])throw new Error('Choose an approval-enabled document table.');
 if(input.action==='saveRouting'){
  if(typeof input.enabled!=='boolean' || !Array.isArray(input.named_emails) || input.named_emails.length>20 || !Array.isArray(input.related_rules) || input.related_rules.length>8)throw new Error('Invalid routing rule.');
  if(input.named_emails.some(email=>typeof email!=='string' || email.length>250 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || input.related_rules.some(key=>!approvalRelatedRules[key]))throw new Error('Choose valid people and linked project roles.');
  const named_emails=[...new Set(input.named_emails.map(email=>email.trim().toLowerCase()))],related_rules=[...new Set(input.related_rules)];
  if(input.enabled && !named_emails.length && !related_rules.length)throw new Error('Choose at least one person or linked project role, or disable this route.');
  if(named_emails.length && input.enabled){
   const grants=await db.ApprovalAccess.filter({email:{$in:named_emails},enabled:true},{limit:20,fields:['email']});
   if(named_emails.some(email=>!grants.items.some(g=>g.email===email)))throw new Error('Grant approval access to every selected person before saving.');
   const users=await db.User.filter({$or:named_emails.map(email=>({email:{$regex:`^${escape(email)}$`,$options:'i'}}))},'full_name',100);
   if(named_emails.some(email=>{const matches=users.filter(u=>u.email?.trim().toLowerCase()===email);return matches.length!==1 || !liveApproverRoles.includes(matches[0].role);}))throw new Error('Every named approver needs a registered internal portal account for live Dataverse approvals.');
  }
  const result=await db.ApprovalRouting.upsert([{table:input.table,named_emails,related_rules,enabled:input.enabled,changed_by:user.id,changed_at:new Date().toISOString()}],{key:'table'});
  return {rule:result.records[0],notice:'Routing saved. Apply it to existing pending documents below; automatic sync also uses this rule.'};
 }
 if(input.action==='routingPreview'){
  if(typeof input.recordId!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.recordId))throw new Error('Choose a linked document.');
  const document=await db[approvalEntity(input.table)].get(input.recordId);
  if(!document)throw new Error('Document not found.');
  const projects=document.project_id ? (await db.Project.filter({$or:[{id:document.project_id},{dataverse_id:document.project_id}]},{limit:2})).items : [];
  if(projects.length!==1)return {approvers:[],reasons:['The document needs one matching linked project.']};
  const {results}=await resolveApprovalRouting(base44,input.table,[{document,project:projects[0]}]);
  return {approvers:results[0].approvers,reasons:results[0].reasons,document:document.document_id || document.warranty_id,project:projects[0].name};
 }
 throw new Error('Unknown approval routing operation.');
}