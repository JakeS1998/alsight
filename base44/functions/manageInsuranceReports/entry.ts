import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {insuranceReportData} from '../../shared/insuranceReportData.ts';
import {renderInsuranceReportEmail} from '../../shared/insuranceReportEmail.ts';
import {withPortalUserNames} from '../../shared/portalUserNames.ts';
import {portalUserSearch} from '../../shared/portalUserSearch.ts';
import {dataRequestError} from '../../shared/dataRequestError.ts';
const roles=['admin','director','regional_director','bsm','bdm','finance'];
const address=value=>String(value || '').trim().toLowerCase();
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
async function settings(db){const page=await db.InsuranceReportSettings.filter({key:'primary'},{limit:1});return page.items[0] || {key:'primary',enabled:false,recipient_emails:[]};}
async function recipients(db,emails){return emails.length ? db.User.filter({$or:emails.map(email=>({email:{$regex:`^${escape(email)}$`,$options:'i'}})),role:{$in:roles}},'full_name',100) : [];}
export default async function(req: Request): Promise<Response> {
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user || user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
  const input=await req.json(),db=base44.entities;
  if(input.action==='get'){const config=await settings(db),people=await withPortalUserNames(db,await recipients(db,config.recipient_emails));return Response.json({settings:config,recipientNames:Object.fromEntries(people.map(person=>[address(person.email),person.full_name]))});}
  if(input.action==='people'){
   if(typeof input.search!=='string' || input.search.length>100 || !Number.isInteger(input.offset ?? 0) || (input.offset ?? 0)<0 || (input.offset ?? 0)>10000)throw new Error('Invalid recipient search.');
   const search=input.search.trim(),users=await db.User.filter({role:{$in:roles},...await portalUserSearch(db,search)},'full_name',21,input.offset || 0);
   const named=await withPortalUserNames(db,users.slice(0,20));
   return Response.json({items:named.map(u=>({id:u.id,name:u.full_name,email:u.email,role:u.role})),has_more:users.length>20,next_offset:(input.offset || 0)+20});
  }
  if(input.action==='save'){
   if(typeof input.enabled!=='boolean' || !Array.isArray(input.recipient_emails) || input.recipient_emails.length>20 || input.recipient_emails.some(email=>typeof email!=='string' || email.length>250 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new Error('Choose up to 20 registered internal recipients.');
   const emails=[...new Set(input.recipient_emails.map(address))],people=await recipients(db,emails);
   if(input.enabled && emails.some(email=>people.filter(p=>address(p.email)===email).length!==1))throw new Error('Every recipient must have one registered internal portal account.');
   if(input.enabled && !emails.length)throw new Error('Choose at least one recipient before enabling the monthly report.');
   const result=await db.InsuranceReportSettings.upsert([{key:'primary',enabled:input.enabled,recipient_emails:emails,changed_by:user.id,changed_at:new Date().toISOString()}],{key:'key'});
   return Response.json({settings:result.records[0]});
  }
  if(input.action==='preview')return Response.json({variables:await insuranceReportData(base44)});
  if(input.action==='renderCheck'){
   const report=await insuranceReportData(base44),rendered=renderInsuranceReportEmail(report);
   return Response.json({table_rows:rendered.tableRows,policy_count:report.expired_count+report.expiring_count,html_contains_table:rendered.html.includes('<thead>'),escaped_table:rendered.html.includes('&lt;table'),unresolved_variables:/\{\{/.test(rendered.html)});
  }
  if(input.action==='deliver'){
   const config=await settings(db);
   if(!config.enabled)return Response.json({sent:false,reason:'Report disabled.'});
   const people=await recipients(db,config.recipient_emails),person=people.find(p=>address(p.email)===address(input.to));
   if(!person)return Response.json({error:'Choose an eligible saved report recipient.'},{status:400});
   const rendered=renderInsuranceReportEmail(await insuranceReportData(base44));
   const result=await base44.asServiceRole.integrations.Core.SendEmail({to:person.email,subject:rendered.subject,html:rendered.html,category:'transactional'});
   return Response.json({sent:result?.success===true,reason:result?.reason,table_rows:rendered.tableRows});
  }
  if(input.action==='prepare'){
   const config=await settings(db);
   if(!config.enabled || !config.recipient_emails.length)return Response.json({recipients:[],variables:{},enabled:false});
   const people=await recipients(db,config.recipient_emails),emails=people.map(p=>p.email).filter(Boolean);
   if(!emails.length)return Response.json({recipients:[],variables:{},enabled:false});
   return Response.json({recipients:[...new Set(emails)].slice(0,20),variables:await insuranceReportData(base44),enabled:true});
  }
  return Response.json({error:'Unknown insurance report operation.'},{status:400});
 }catch(error){return dataRequestError(error,'Unable to manage insurance reports.',400);}
}