import { base44 } from '@/api/base44Client';
import projectScope from '@/components/projects/projectScope';
import assignedRoles from '@/components/data/assignedRoles';
import { dayBounds } from '@/components/adaptive/adaptiveTime';
import { TASK_SOURCES, assignedTaskQuery, taskRow } from '@/components/tasks/assignedTaskQueries';
const internal=['admin','director','regional_director','bsm','bdm','finance'];
export default async function adaptiveData(user,since,bounds=dayBounds()) {
 const db=base44.entities,warnings=[],roles=assignedRoles(user);
 async function read(label,work,fallback) {try{return await work();}catch(error){warnings.push(`${label} unavailable. ${error.response?.data?.error||error.message||'Try refreshing.'}`);return fallback;}}
 const contacts=await read('Identity',()=>db.Contact.filter({$or:[{aad_id:user.id},...(user.email?[{email:user.email}]:[])]},{limit:20,fields:['full_name','aad_id']}),{items:[]});
 const scope={...projectScope(user,contacts.items[0]?.aad_id),status:{$ne:'inactive'},live_project:true};
 const [projects,projectTotal,changes]=await Promise.all([
  read('Projects',()=>db.Project.filter(scope,{sort:'-updated_date',limit:30,fields:['name','project_number','dataverse_id','client_name','related_supplier_account_ids','updated_date','practical_completion_date','site_postcode','procurement_route']}),{items:[],has_more:false}),
  read('Project total',()=>db.Project.count(scope),null),
  since?read('Project changes',()=>db.Project.count({...scope,updated_date:{$gt:since}}),null):Promise.resolve(null)
 ]);
 const taskQueries=TASK_SOURCES.map(source=>assignedTaskQuery(source,user,contacts.items));
 const [taskPages,tomorrowPages]=await Promise.all([
  Promise.all(TASK_SOURCES.map((source,i)=>read(source.label,async()=>{const [page,count]=await Promise.all([db[source.entity].filter(taskQueries[i],{sort:source.due,limit:10}),db[source.entity].count(taskQueries[i])]);return {rows:page.items.map(r=>({...taskRow(source,r),detail:`Assigned to you · ${source.label}`,label:'Open task',severity:'attention'})),count,more:page.has_more};},{rows:[],count:null,more:false}))),
  Promise.all(TASK_SOURCES.map((source,i)=>read(`${source.label} next working-day deadlines`,async()=>{const dated=source.due==='due_at',page=await db[source.entity].filter({...taskQueries[i],[source.due]:{$gte:dated?bounds.nextWorkStart:bounds.nextWorkDay,$lt:dated?bounds.nextWorkEnd:bounds.nextWorkAfter}},{sort:source.due,limit:3});return page.items.map(row=>taskRow(source,row));},[])))
 ]);
 const supplierIds=[...new Set(projects.items.flatMap(p=>p.related_supplier_account_ids||[]))];
 const [briefing,policies,opportunities]=await Promise.all([
  roles.some(role=>internal.includes(role))?read('Project intelligence',async()=>{const {data}=await base44.functions.invoke('getTodayBriefing',{projectIds:projects.items.map(p=>p.id)});if(data.error)throw Error(data.error);return data;},{items:[],totals:{}}):Promise.resolve({items:[],totals:{}}),
  supplierIds.length?read('Supplier insurance',async()=>{const query={account_id:{$in:supplierIds},status:'active',expiry_date:{$nin:[null,''],$lte:new Date(Date.now()+30*86400000).toISOString()}};const [page,total]=await Promise.all([db.SupplierInsurance.filter(query,{sort:'expiry_date',limit:5,fields:['name','account_id','expiry_date','policy_type']}),db.SupplierInsurance.count(query)]);return {...page,total};},{items:[],total:null}):Promise.resolve({items:[],total:0}),
  roles.some(role=>['bdm','admin','director'].includes(role))?read('Opportunities',()=>db.Opportunity.filter({owner_id:user.id,status:'open'},{sort:'-updated_date',limit:5,fields:['title','stage','updated_date']}),{items:[]}):Promise.resolve({items:[]})
 ]);
 const insurance=policies.items.map(p=>({key:`insurance-${p.id}`,title:p.name,detail:`${p.policy_type||'Supplier insurance'} expires ${p.expiry_date.slice(0,10)}. Review compliance before relying on cover.`,due:p.expiry_date,to:`/accounts/${p.account_id}`,label:'Review compliance',category:'compliance',severity:'upcoming'}));
 const actions=[...taskPages.flatMap(p=>p.rows),...briefing.items,...insurance];
 const priorityTotal=taskPages.every(p=>p.count!==null)&&policies.total!==null?taskPages.reduce((n,p)=>n+p.count,0)+Object.values(briefing.totals).reduce((n,value)=>n+Number(value||0),0)+policies.total:null;
 return {identityContacts:contacts.items,identityUnavailable:warnings.some(w=>w.startsWith('Identity unavailable.')),insuranceTotal:policies.total,projects:projects.items,projectTotal,changes,actions,nextWorkActions:tomorrowPages.flat(),priorityTotal,taskTotal:taskPages.every(p=>p.count!==null)?taskPages.reduce((n,p)=>n+p.count,0):null,moreTasks:taskPages.some(p=>p.more),totals:briefing.totals,opportunities:opportunities.items,warnings,refreshedAt:new Date().toISOString(),projectMore:projects.has_more};
}